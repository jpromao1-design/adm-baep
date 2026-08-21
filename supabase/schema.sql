-- =============================================================================
-- ADM BAEP — 8º BAEP — esquema Supabase (PostgreSQL)
-- Cole e execute este arquivo no SQL Editor do painel Supabase.
--
-- Depois:
--   1. Authentication → Providers → Email: habilitado
--   2. Crie os dois usuários (você e o Sargento) em Authentication → Users
--      OU deixe-os se cadastrar pelo app (só entra quem estiver em allowed_users)
--   3. Substitua os e-mails abaixo pelos reais
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Allowlist: somente estes e-mails podem usar o sistema
-- -----------------------------------------------------------------------------
create table if not exists public.allowed_users (
  email text primary key,
  role  text not null default 'auxiliar'
        check (role in ('admin', 'auxiliar')),
  display_name text,
  created_at timestamptz not null default now()
);

-- SUBSTITUA pelos e-mails reais antes de executar, ou rode o INSERT depois.
insert into public.allowed_users (email, role, display_name) values
  ('jpromao1@gmail.com', 'admin', 'Administração'),
  ('rogeriopolmil@gmail.com', 'auxiliar', 'Sargento Souza')
on conflict (email) do nothing;

-- -----------------------------------------------------------------------------
-- Perfis (1:1 com auth.users, só se o e-mail estiver na allowlist)
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  display_name text,
  role text not null default 'auxiliar'
       check (role in ('admin', 'auxiliar')),
  created_at timestamptz not null default now()
);

create or replace function public.is_allowed_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p where p.id = auth.uid()
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed public.allowed_users%rowtype;
begin
  select * into allowed
  from public.allowed_users
  where lower(email) = lower(new.email);

  if not found then
    return new;
  end if;

  insert into public.profiles (id, email, display_name, role)
  values (new.id, new.email, coalesce(allowed.display_name, split_part(new.email, '@', 1)), allowed.role)
  on conflict (id) do update
    set email = excluded.email,
        role = excluded.role;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Tarefas / eventos / prazos (espelha o schema Task.jsonc do app original)
-- -----------------------------------------------------------------------------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  type text not null default 'tarefa'
       check (type in ('tarefa', 'demanda', 'evento', 'compromisso')),
  status text not null default 'pendente'
       check (status in ('pendente', 'em_andamento', 'aguardando', 'concluido')),
  section text check (section is null or section in ('P1', 'P3', 'P5')),
  received_date date,
  start_date date,
  due_date date,
  end_date date,
  event_date date,
  event_time text,
  event_datetime timestamptz,
  location text,
  auxiliar text,
  notes text,
  observations text,
  remind_on_day boolean not null default true,
  remind_day_before boolean not null default true,
  is_recurring boolean not null default false,
  recurrence text
       check (recurrence is null or recurrence in (
         'diaria', 'semanal', 'quinzenal', 'mensal', 'semestral', 'anual'
       )),
  recurrence_end_date date,
  completed_occurrences date[] not null default '{}',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_due_date_idx on public.tasks (due_date);
create index if not exists tasks_event_date_idx on public.tasks (event_date);
create index if not exists tasks_status_idx on public.tasks (status);
create index if not exists tasks_created_at_idx on public.tasks (created_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tasks_touch_updated_at on public.tasks;
create trigger tasks_touch_updated_at
  before update on public.tasks
  for each row execute procedure public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Motor de recorrência no banco (espelha a expansão no cliente)
-- Gera ocorrências entre p_from e p_to sem materializar linhas extras.
-- -----------------------------------------------------------------------------
create or replace function public.add_recurrence(p_date date, p_recurrence text)
returns date
language sql
immutable
as $$
  select case p_recurrence
    when 'diaria'     then p_date + interval '1 day'
    when 'semanal'    then p_date + interval '7 days'
    when 'quinzenal'  then p_date + interval '14 days'
    when 'mensal'     then p_date + interval '1 month'
    when 'semestral'  then p_date + interval '6 months'
    when 'anual'      then p_date + interval '1 year'
    else p_date
  end::date;
$$;

create or replace function public.expand_task_occurrences(
  p_from date,
  p_to   date
)
returns table (
  task_id uuid,
  occurrence_date date,
  title text,
  type text,
  status text,
  is_completed boolean,
  location text,
  auxiliar text,
  is_recurring boolean,
  recurrence text
)
language plpgsql
stable
security invoker
as $$
declare
  r public.tasks%rowtype;
  cursor_date date;
  series_end date;
  guard int;
begin
  for r in
    select * from public.tasks
  loop
    if not r.is_recurring or r.recurrence is null then
      occurrence_date := coalesce(r.event_date, r.due_date);
      if occurrence_date is not null
         and occurrence_date between p_from and p_to then
        task_id := r.id;
        title := r.title;
        type := r.type;
        status := r.status;
        is_completed := (r.status = 'concluido');
        location := r.location;
        auxiliar := r.auxiliar;
        is_recurring := false;
        recurrence := r.recurrence;
        return next;
      end if;
      continue;
    end if;

    cursor_date := coalesce(r.start_date, r.due_date, r.event_date, r.created_at::date);
    if cursor_date is null then
      continue;
    end if;

    series_end := coalesce(r.recurrence_end_date, p_to);
    guard := 0;

    while cursor_date < p_from and cursor_date <= series_end and guard < 2500 loop
      cursor_date := public.add_recurrence(cursor_date, r.recurrence);
      guard := guard + 1;
    end loop;

    while cursor_date <= p_to and cursor_date <= series_end and guard < 2500 loop
      task_id := r.id;
      occurrence_date := cursor_date;
      title := r.title;
      type := r.type;
      status := r.status;
      is_completed := cursor_date = any (r.completed_occurrences);
      location := r.location;
      auxiliar := r.auxiliar;
      is_recurring := true;
      recurrence := r.recurrence;
      return next;
      cursor_date := public.add_recurrence(cursor_date, r.recurrence);
      guard := guard + 1;
    end loop;
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- RLS — acesso só para os dois perfis autenticados
-- -----------------------------------------------------------------------------
alter table public.allowed_users enable row level security;
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;

drop policy if exists "profiles_select_own_or_peer" on public.profiles;
create policy "profiles_select_own_or_peer"
  on public.profiles for select
  to authenticated
  using (public.is_allowed_user());

drop policy if exists "allowed_users_select_if_profile" on public.allowed_users;
create policy "allowed_users_select_if_profile"
  on public.allowed_users for select
  to authenticated
  using (public.is_allowed_user());

drop policy if exists "tasks_select_allowed" on public.tasks;
create policy "tasks_select_allowed"
  on public.tasks for select
  to authenticated
  using (public.is_allowed_user());

drop policy if exists "tasks_insert_allowed" on public.tasks;
create policy "tasks_insert_allowed"
  on public.tasks for insert
  to authenticated
  with check (public.is_allowed_user() and created_by = auth.uid());

drop policy if exists "tasks_update_allowed" on public.tasks;
create policy "tasks_update_allowed"
  on public.tasks for update
  to authenticated
  using (public.is_allowed_user())
  with check (public.is_allowed_user());

drop policy if exists "tasks_delete_allowed" on public.tasks;
create policy "tasks_delete_allowed"
  on public.tasks for delete
  to authenticated
  using (public.is_allowed_user());

grant usage on schema public to authenticated;
grant select on public.allowed_users to authenticated;
grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
grant execute on function public.expand_task_occurrences(date, date) to authenticated;
grant execute on function public.is_allowed_user() to authenticated;
