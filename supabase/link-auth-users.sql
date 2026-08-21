-- Cole no SQL Editor (schema.sql já precisa ter rodado).
-- Sargento Souza — auxiliar
-- A senha NÃO é gravada aqui. Defina 123mudar em:
-- Authentication → Users → rogeriopolmil@gmail.com → Reset password

insert into public.allowed_users (email, role, display_name) values
  ('jpromao1@gmail.com', 'admin', 'Administração'),
  ('rogeriopolmil@gmail.com', 'auxiliar', 'Sargento Souza')
on conflict (email) do update
  set role = excluded.role,
      display_name = excluded.display_name;

insert into public.profiles (id, email, display_name, role)
select
  u.id,
  u.email,
  case when lower(u.email) = 'rogeriopolmil@gmail.com' then 'Sargento Souza' else coalesce(a.display_name, split_part(u.email, '@', 1)) end,
  a.role
from auth.users u
join public.allowed_users a on lower(a.email) = lower(u.email)
on conflict (id) do update
  set email = excluded.email,
      display_name = excluded.display_name,
      role = excluded.role;

select email, display_name, role, id from public.profiles order by role;
