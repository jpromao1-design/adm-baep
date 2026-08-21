-- =============================================================================
-- Migração: Seção (P1/P3/P5), Auxiliar, remoção de Prioridade, perfil Sargento Souza
-- Cole no SQL Editor do Supabase e execute.
-- =============================================================================

-- 1) Perfil do auxiliar
insert into public.allowed_users (email, role, display_name) values
  ('rogeriopolmil@gmail.com', 'auxiliar', 'Sargento Souza')
on conflict (email) do update
  set role = excluded.role,
      display_name = excluded.display_name;

update public.profiles
set display_name = 'Sargento Souza',
    role = 'auxiliar',
    email = 'rogeriopolmil@gmail.com'
where id = 'e1f95948-b0d7-4865-b449-793235ea4ae4'
   or lower(email) = 'rogeriopolmil@gmail.com';

insert into public.profiles (id, email, display_name, role)
select u.id, u.email, 'Sargento Souza', 'auxiliar'
from auth.users u
where lower(u.email) = 'rogeriopolmil@gmail.com'
on conflict (id) do update
  set display_name = excluded.display_name,
      role = excluded.role,
      email = excluded.email;

-- 2) Campo seção
alter table public.tasks
  add column if not exists section text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'tasks_section_check'
  ) then
    alter table public.tasks
      add constraint tasks_section_check
      check (section is null or section in ('P1', 'P3', 'P5'));
  end if;
end $$;

-- 3) involved → auxiliar
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'tasks' and column_name = 'involved'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'tasks' and column_name = 'auxiliar'
  ) then
    alter table public.tasks rename column involved to auxiliar;
  elsif exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'tasks' and column_name = 'involved'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'tasks' and column_name = 'auxiliar'
  ) then
    update public.tasks
    set auxiliar = coalesce(auxiliar, involved)
    where auxiliar is null and involved is not null;
    alter table public.tasks drop column involved;
  end if;
end $$;

alter table public.tasks add column if not exists auxiliar text;

-- 4) remover prioridade
alter table public.tasks drop column if exists priority;

-- Conferência
select email, display_name, role from public.profiles order by role;
