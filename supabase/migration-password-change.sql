-- Flag de troca obrigatória de senha + RPC usada pelo app após o login padrão.
-- Cole no SQL Editor do Supabase e execute.

alter table public.profiles
  add column if not exists must_change_password boolean not null default false;

update public.profiles
set must_change_password = true
where lower(email) = 'rogeriopolmil@gmail.com';

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

select email, display_name, role, must_change_password
from public.profiles
order by role;
