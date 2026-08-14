-- Cole no SQL Editor e execute (schema.sql já precisa ter rodado).
-- Usuários do Authentication:
--   jpromao1@gmail.com        → admin
--   rogeriopolmil@gmail.com   → auxiliar

insert into public.allowed_users (email, role, display_name) values
  ('jpromao1@gmail.com', 'admin', 'Administração'),
  ('rogeriopolmil@gmail.com', 'auxiliar', 'Sargento auxiliar')
on conflict (email) do update
  set role = excluded.role,
      display_name = excluded.display_name;

insert into public.profiles (id, email, display_name, role) values
  ('5186fcfc-56ca-4dec-95c1-3b665ceb800b', 'jpromao1@gmail.com', 'Administração', 'admin'),
  ('e1f95948-b0d7-4865-b449-793235ea4ae4', 'rogeriopolmil@gmail.com', 'Sargento auxiliar', 'auxiliar')
on conflict (id) do update
  set email = excluded.email,
      display_name = excluded.display_name,
      role = excluded.role;

select email, role, id from public.profiles order by role;
