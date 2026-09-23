# Adm BAEP — 8º BAEP

Sistema de gestão de tarefas, eventos e prazos operacionais. Interface PWA (computador da seção e celular no serviço), autenticação e dados no Supabase.

Acesso restrito: somente os e-mails cadastrados em `allowed_users` entram.

## 1. Supabase (SQL)

1. Crie um **projeto Supabase exclusivo deste sistema** em [supabase.com](https://supabase.com). Não compartilhe banco com outros apps.
2. SQL Editor → cole e execute `supabase/schema.sql`.
3. Ajuste os e-mails da allowlist:

```sql
update public.allowed_users set email = 'seu.email@pm.sp.gov.br' where role = 'admin';
update public.allowed_users set email = 'sargento.email@pm.sp.gov.br' where role = 'auxiliar';
```

4. Authentication → Users → crie os dois usuários (e-mail + senha), **com o mesmo e-mail** da allowlist. O trigger cria o perfil automaticamente.
5. Copie Project URL e anon/publishable key em Project Settings → API.

## 2. Frontend

```bash
copy .env.example .env
```

Preencha:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

```bash
npm install
npm run dev
```

PWA (instalável + cache): `npm run build` e `npm run preview`. No celular, use HTTPS (ou `preview` na rede local) e “Adicionar à tela inicial”.

## 3. Recorrência

A série fica em uma linha na tabela `tasks` (`is_recurring`, `recurrence`, `completed_occurrences`).

O cliente expande ocorrências (`src/lib/recurrence.js`). O banco expõe a mesma lógica em `expand_task_occurrences(from, to)` para relatórios.

Frequências: diária, semanal, quinzenal, mensal, semestral, anual.

## 4. Estrutura

```
src/
  api/            cliente Supabase e CRUD de tasks
  lib/            datas, status, recorrência, auth, notificações
  hooks/          useTasks, toggle, modais
  components/     layout, dashboard, tarefas, UI
  pages/          Dashboard, Tarefas, Agenda, Busca, Login
supabase/schema.sql
```

## 5. GitHub (celular e outros locais)

Repositório **privado**. O site publicado fica em HTTPS (GitHub Pages). Só entra quem tem login no Supabase.

1. Crie o repositório `adm-baep` no GitHub (Private).
2. Settings → Secrets and variables → Actions, cadastre:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Settings → Pages → Source: **GitHub Actions**.
4. Envie o código (`git push`). O workflow publica em:
   `https://SEU-USUARIO.github.io/adm-baep/`
5. No Supabase: Authentication → URL Configuration
   - Site URL = essa URL
   - Redirect URLs = `https://SEU-USUARIO.github.io/adm-baep/**`

Não commite o arquivo `.env`.

## 6. Depois do Authentication

Rode `supabase/link-auth-users.sql`, `supabase/migration-secao-auxiliar.sql`, `supabase/migration-password-change.sql` e `supabase/migration-audit.sql`.

O auxiliar Sargento Souza (`rogeriopolmil@gmail.com`) entra com a senha inicial e é obrigado a alterar antes de usar o sistema. A senha nova é gravada com hash pelo Authentication do Supabase.

## 7. Dashboard — status e edição nos cards (v1.2.0+)

Nos cards do Dashboard (e na lista mobile de Tarefas):

- o **badge de status** abre um menu com os status do banco: `pendente`, `em_andamento`, `aguardando`, `concluido` (rótulos: Pendente, Em andamento, Aguardando, Concluída);
- o ícone de **lápis** abre o mesmo `TaskFormModal` usado nas demais telas;
- o **WhatsApp** usa `buildWhatsAppMessage` / `openWhatsAppShare` (`src/lib/whatsapp.js`) — mensagem institucional sem URL do sistema;
- a atualização usa `updateTask` via `handleStatusChange` / `handleSave` (TanStack Query), com invalidação da query `tasks` e toast de feedback;
- permissões de UI: `changeAnyStatus` e `manageTasks` (`src/lib/permissions.js`); a segurança efetiva continua na RLS do Supabase.

Não há `service_role` no frontend.

## 8. WhatsApp (v1.2.1)

Compartilhamento centralizado em `src/lib/whatsapp.js`. A mensagem usa negrito do WhatsApp (`*texto*`), omite campos vazios e **não inclui** o endereço do Adm BAEP. A abertura continua via `https://wa.me/?text=...`.

## 9. Segurança (v1.2.2 — Commit 015)

Após as migrations de usuários, execute também:

`supabase/fix-015-security-hardening.sql`

Isso restringe SELECT/UPDATE de `profiles`, impede elevação de `role`/`active` pelo próprio usuário, limita `notify_user` a admin e separa a limpeza da flag `must_change_password` em `complete_password_change()`.

**Atenção operacional:** aprovar solicitação de acesso autoriza o e-mail, mas o usuário Auth ainda precisa ser criado no Dashboard do Supabase (senha inicial `123mudar`).
