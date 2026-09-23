-- Commit 015 — Hardening de segurança (profiles + notify + password flag)
-- Cole no SQL Editor do projeto Sistema Integrado 8º BAEP e execute.
-- Seguro para rodar em produção com dados existentes.

-- 1) SELECT de profiles: próprio ou admin (não todos os peers)
drop policy if exists profiles_select_own_or_peer on public.profiles;
create policy profiles_select_own_or_peer on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

-- 2) UPDATE direto: apenas admin (self-update de role/active bloqueado)
drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update on public.profiles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 3) Trigger: impede elevação de privilégio mesmo se a policy de UPDATE falhar
create or replace function public.profiles_guard_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  -- RPCs security definer (senha / last_login) atualizam o próprio perfil;
  -- role, active e email nunca podem ser alterados pelo próprio usuário.
  if new.id is distinct from auth.uid() then
    raise exception 'Sem permissão para alterar outro perfil.';
  end if;
  if new.role is distinct from old.role
     or new.active is distinct from old.active
     or new.email is distinct from old.email then
    raise exception 'Sem permissão para alterar campos privilegiados do perfil.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_guard on public.profiles;
create trigger trg_profiles_guard
  before update on public.profiles
  for each row
  execute function public.profiles_guard_privileged_columns();

-- 4) notify_user: somente admin
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
  if not public.is_admin() then
    raise exception 'Sem permissão.';
  end if;

  insert into public.notifications (user_id, title, body, type, link, meta)
  values (p_user_id, p_title, p_body, p_type, p_link, p_meta)
  returning id into v_id;
  return v_id;
end;
$$;

-- 5) set_must_change_password: limpar flag só via complete_password_change
--    (ainda é SECURITY DEFINER; a proteção real é o trigger acima + policy UPDATE)
create or replace function public.complete_password_change()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Não autenticado.';
  end if;
  update public.profiles
  set must_change_password = false
  where id = auth.uid();
end;
$$;

revoke all on function public.complete_password_change() from public;
grant execute on function public.complete_password_change() to authenticated;

-- Manter set_must_change_password apenas para forçar true (login senha padrão / admin)
create or replace function public.set_must_change_password(p_required boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Não autenticado.';
  end if;
  if coalesce(p_required, false) = false then
    -- Limpeza deve usar complete_password_change() após updateUser
    raise exception 'Use complete_password_change() para limpar a flag.';
  end if;
  update public.profiles
  set must_change_password = true
  where id = auth.uid();
end;
$$;

-- Assert rápido (deve retornar as colunas)
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name in ('must_change_password', 'active', 'phone', 'unit', 'last_login_at')
order by column_name;
