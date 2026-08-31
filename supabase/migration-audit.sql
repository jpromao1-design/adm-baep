-- =============================================================================
-- Migração de auditoria — ADM BAEP
-- Execute no SQL Editor do Supabase após schema.sql e migrations anteriores.
-- =============================================================================

-- 1) Garantir coluna must_change_password
alter table public.profiles
  add column if not exists must_change_password boolean not null default false;

-- 2) Remover allowlist obsoleta de testes locais
delete from public.allowed_users
where lower(email) in ('admin@8baep.local', 'auxiliar@8baep.local');

-- 3) Garantir perfis reais
insert into public.allowed_users (email, role, display_name) values
  ('jpromao1@gmail.com', 'admin', 'Administração'),
  ('rogeriopolmil@gmail.com', 'auxiliar', 'Sargento Souza')
on conflict (email) do update
  set role = excluded.role,
      display_name = excluded.display_name;

-- 4) RPC troca de senha (idempotente)
create or replace function public.set_must_change_password(p_required boolean)
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles
  set must_change_password = coalesce(p_required, false)
  where id = auth.uid();
$$;

revoke all on function public.set_must_change_password(boolean) from public;
grant execute on function public.set_must_change_password(boolean) to authenticated;

-- 5) Índice útil para consultas por seção
create index if not exists tasks_section_idx on public.tasks (section);

-- Conferência
select email, display_name, role, must_change_password from public.profiles order by role;
select email, display_name, role from public.allowed_users order by role;
