-- Corrige: column profiles.must_change_password does not exist
-- Cole no SQL Editor do projeto "Sistema Integrado 8º BAEP"
-- (URL: https://epjgztejmnbdfqwdrfxv.supabase.co) e execute.

alter table public.profiles
  add column if not exists must_change_password boolean not null default false;

-- Força o PostgREST a enxergar a coluna nova
notify pgrst, 'reload schema';

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

select email, display_name, role, must_change_password, active
from public.profiles
order by role;
