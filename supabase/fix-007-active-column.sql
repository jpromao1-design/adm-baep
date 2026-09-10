-- =============================================================================
-- Correção rápida se a migration 007 falhou com:
--   ERROR: 42703: column p.active does not exist
--
-- 1) Execute ESTE arquivo primeiro (Run).
-- 2) Depois execute de novo o arquivo completo:
--    migration-007-users-access-notifications.sql
-- =============================================================================

alter table public.profiles
  add column if not exists active boolean not null default true,
  add column if not exists phone text,
  add column if not exists unit text,
  add column if not exists last_login_at timestamptz;
