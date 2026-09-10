-- Corrige leitura do próprio perfil (evita login “mudo” após migration 007)
-- Execute no SQL Editor se o login autenticar mas voltar para a tela sem mensagem.

drop policy if exists profiles_select_own_or_peer on public.profiles;
create policy profiles_select_own_or_peer on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or public.is_allowed_user()
    or public.is_admin()
  );
