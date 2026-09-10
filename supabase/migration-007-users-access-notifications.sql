-- =============================================================================
-- Commit 007 — Gestão de usuários, solicitações de acesso e notificações
-- Execute no SQL Editor do Supabase (produção).
-- IMPORTANTE: colunas de profiles ANTES das funções que as referenciam.
-- =============================================================================

-- Extensões em profiles (deve rodar antes de is_admin / is_active_allowed_user)
alter table public.profiles
  add column if not exists active boolean not null default true,
  add column if not exists phone text,
  add column if not exists unit text,
  add column if not exists last_login_at timestamptz;

-- Helpers de papel
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin' and coalesce(p.active, true)
  );
$$;

create or replace function public.is_active_allowed_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and coalesce(p.active, true)
  );
$$;

-- Solicitações de acesso (inserção pública anônima)
create table if not exists public.access_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  unit text,
  role_requested text,
  justification text,
  status text not null default 'PENDENTE'
    check (status in ('PENDENTE', 'APROVADO', 'REJEITADO', 'CANCELADO')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default now()
);

create index if not exists access_requests_status_idx on public.access_requests (status);
create index if not exists access_requests_email_idx on public.access_requests (lower(email));

-- Notificações internas
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text,
  type text not null default 'info',
  link text,
  meta jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, created_at desc)
  where read_at is null;

-- Preferências de push (preparação; Web Push completo exige VAPID/Edge)
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  keys jsonb not null default '{}'::jsonb,
  user_agent text,
  created_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

-- Atualiza is_allowed_user para exigir perfil ativo
create or replace function public.is_allowed_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and coalesce(p.active, true)
  );
$$;

-- Notificar todos os admins
create or replace function public.notify_admins(
  p_title text,
  p_body text,
  p_type text default 'info',
  p_link text default null,
  p_meta jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, title, body, type, link, meta)
  select p.id, p_title, p_body, p_type, p_link, p_meta
  from public.profiles p
  where p.role = 'admin' and coalesce(p.active, true);
end;
$$;

-- Solicitar acesso (anon / authenticated)
create or replace function public.submit_access_request(
  p_full_name text,
  p_email text,
  p_phone text default null,
  p_unit text default null,
  p_role_requested text default null,
  p_justification text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_email text := lower(trim(p_email));
begin
  if length(trim(coalesce(p_full_name, ''))) < 3 then
    raise exception 'Informe o nome completo.';
  end if;
  if v_email is null or position('@' in v_email) = 0 then
    raise exception 'Informe um e-mail válido.';
  end if;

  if exists (
    select 1 from public.access_requests
    where lower(email) = v_email and status = 'PENDENTE'
  ) then
    raise exception 'Já existe uma solicitação pendente para este e-mail.';
  end if;

  if exists (select 1 from public.allowed_users where lower(email) = v_email) then
    raise exception 'Este e-mail já está autorizado. Utilize a tela de login.';
  end if;

  insert into public.access_requests (
    full_name, email, phone, unit, role_requested, justification
  ) values (
    trim(p_full_name), v_email, nullif(trim(p_phone), ''), nullif(trim(p_unit), ''),
    nullif(trim(p_role_requested), ''), nullif(trim(p_justification), '')
  )
  returning id into v_id;

  perform public.notify_admins(
    'Nova solicitação de acesso',
    trim(p_full_name) || ' (' || v_email || ') solicitou acesso.',
    'access_request',
    '/users?tab=requests',
    jsonb_build_object('request_id', v_id, 'email', v_email)
  );

  return v_id;
end;
$$;

grant execute on function public.submit_access_request(text, text, text, text, text, text) to anon, authenticated;

-- Aprovar solicitação (admin)
create or replace function public.approve_access_request(
  p_request_id uuid,
  p_role text default 'auxiliar',
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.access_requests%rowtype;
  v_role text := coalesce(nullif(trim(p_role), ''), 'auxiliar');
begin
  if not public.is_admin() then
    raise exception 'Apenas administradores podem aprovar solicitações.';
  end if;
  if v_role not in ('admin', 'auxiliar') then
    raise exception 'Perfil inválido.';
  end if;

  select * into r from public.access_requests where id = p_request_id for update;
  if not found then raise exception 'Solicitação não encontrada.'; end if;
  if r.status <> 'PENDENTE' then raise exception 'Solicitação já analisada.'; end if;

  insert into public.allowed_users (email, role, display_name)
  values (lower(r.email), v_role, r.full_name)
  on conflict (email) do update
    set role = excluded.role,
        display_name = excluded.display_name;

  update public.profiles
  set role = v_role,
      display_name = coalesce(r.full_name, display_name),
      phone = coalesce(r.phone, phone),
      unit = coalesce(r.unit, unit),
      active = true
  where lower(email) = lower(r.email);

  update public.access_requests
  set status = 'APROVADO',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      review_notes = p_notes
  where id = p_request_id;
end;
$$;

grant execute on function public.approve_access_request(uuid, text, text) to authenticated;

-- Rejeitar solicitação
create or replace function public.reject_access_request(
  p_request_id uuid,
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Apenas administradores podem rejeitar solicitações.';
  end if;

  update public.access_requests
  set status = 'REJEITADO',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      review_notes = p_notes
  where id = p_request_id and status = 'PENDENTE';

  if not found then
    raise exception 'Solicitação não encontrada ou já analisada.';
  end if;
end;
$$;

grant execute on function public.reject_access_request(uuid, text) to authenticated;

-- Upsert allowlist + perfil (admin)
create or replace function public.admin_upsert_user(
  p_email text,
  p_display_name text,
  p_role text default 'auxiliar',
  p_phone text default null,
  p_unit text default null,
  p_active boolean default true
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(p_email));
  v_role text := coalesce(nullif(trim(p_role), ''), 'auxiliar');
begin
  if not public.is_admin() then
    raise exception 'Apenas administradores podem gerenciar usuários.';
  end if;
  if v_email is null or position('@' in v_email) = 0 then
    raise exception 'E-mail inválido.';
  end if;
  if v_role not in ('admin', 'auxiliar') then
    raise exception 'Perfil inválido.';
  end if;

  insert into public.allowed_users (email, role, display_name)
  values (v_email, v_role, nullif(trim(p_display_name), ''))
  on conflict (email) do update
    set role = excluded.role,
        display_name = excluded.display_name;

  update public.profiles
  set display_name = coalesce(nullif(trim(p_display_name), ''), display_name),
      role = v_role,
      phone = coalesce(nullif(trim(p_phone), ''), phone),
      unit = coalesce(nullif(trim(p_unit), ''), unit),
      active = coalesce(p_active, true)
  where lower(email) = v_email;
end;
$$;

grant execute on function public.admin_upsert_user(text, text, text, text, text, boolean) to authenticated;

-- Ativar / inativar
create or replace function public.admin_set_user_active(p_user_id uuid, p_active boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Apenas administradores podem alterar status de usuários.';
  end if;
  if p_user_id = auth.uid() and p_active is false then
    raise exception 'Você não pode inativar a própria conta.';
  end if;

  update public.profiles set active = coalesce(p_active, true) where id = p_user_id;
  if not found then raise exception 'Usuário não encontrado.'; end if;
end;
$$;

grant execute on function public.admin_set_user_active(uuid, boolean) to authenticated;

-- Forçar troca de senha (admin marca flag; e-mail de reset é disparado no app)
create or replace function public.admin_force_password_change(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Apenas administradores podem redefinir senha.';
  end if;
  update public.profiles set must_change_password = true where id = p_user_id;
  if not found then raise exception 'Usuário não encontrado.'; end if;
end;
$$;

grant execute on function public.admin_force_password_change(uuid) to authenticated;

-- Registrar último login
create or replace function public.touch_last_login()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles set last_login_at = now() where id = auth.uid();
end;
$$;

grant execute on function public.touch_last_login() to authenticated;

-- Notificações: marcar lida / todas
create or replace function public.mark_notification_read(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.notifications
  set read_at = coalesce(read_at, now())
  where id = p_id and user_id = auth.uid();
end;
$$;

create or replace function public.mark_all_notifications_read()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.notifications
  set read_at = now()
  where user_id = auth.uid() and read_at is null;
end;
$$;

grant execute on function public.mark_notification_read(uuid) to authenticated;
grant execute on function public.mark_all_notifications_read() to authenticated;

-- Notificar usuário ao ser atribuído (opcional, chamado do app)
create or replace function public.notify_user(
  p_user_id uuid,
  p_title text,
  p_body text,
  p_type text default 'info',
  p_link text default null,
  p_meta jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Não autenticado.';
  end if;
  if not public.is_allowed_user() then
    raise exception 'Sem permissão.';
  end if;

  insert into public.notifications (user_id, title, body, type, link, meta)
  values (p_user_id, p_title, p_body, p_type, p_link, p_meta)
  returning id into v_id;
  return v_id;
end;
$$;

grant execute on function public.notify_user(uuid, text, text, text, text, jsonb) to authenticated;

-- RLS
alter table public.access_requests enable row level security;
alter table public.notifications enable row level security;
alter table public.push_subscriptions enable row level security;

drop policy if exists access_requests_admin_all on public.access_requests;
create policy access_requests_admin_all on public.access_requests
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists notifications_own on public.notifications;
create policy notifications_own on public.notifications
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists notifications_own_update on public.notifications;
create policy notifications_own_update on public.notifications
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists push_own on public.push_subscriptions;
create policy push_own on public.push_subscriptions
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Profiles: admin pode listar todos; usuário vê o próprio
drop policy if exists profiles_select_own_or_peer on public.profiles;
create policy profiles_select_own_or_peer on public.profiles
  for select to authenticated
  using (public.is_allowed_user() or public.is_admin());

drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update on public.profiles
  for update to authenticated
  using (public.is_admin() or id = auth.uid())
  with check (public.is_admin() or id = auth.uid());

-- Allowed users: admin gerencia
drop policy if exists allowed_users_select_if_profile on public.allowed_users;
create policy allowed_users_select_if_profile on public.allowed_users
  for select to authenticated
  using (public.is_allowed_user() or public.is_admin());

drop policy if exists allowed_users_admin_write on public.allowed_users;
create policy allowed_users_admin_write on public.allowed_users
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
