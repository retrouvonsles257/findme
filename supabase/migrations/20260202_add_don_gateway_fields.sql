-- =====================================================
-- RETROUVONSLES - Donations gateway fields (mock/live)
-- =====================================================
-- Objectif:
-- - Permettre de suivre les dons liés à un utilisateur (citoyen)
-- - Préparer l'intégration Orange Money + MTN MoMo (via gateway)
-- - Ajouter un champ metadata pour stocker l'opérateur, téléphone, payloads, etc.
--
-- NOTE:
-- - Ce script est SAFE à exécuter même si certaines colonnes existent déjà
--   (via IF NOT EXISTS).
-- - Si ta table `don` n'existe pas, crée-la d'abord (selon ton modèle SQL).

alter table if exists public.don
  add column if not exists id_utilisateur uuid null references public.utilisateur(id) on delete set null;

alter table if exists public.don
  add column if not exists provider text null;

alter table if exists public.don
  add column if not exists provider_reference text null;

alter table if exists public.don
  add column if not exists checkout_url text null;

alter table if exists public.don
  add column if not exists metadata jsonb null;

alter table if exists public.don
  add column if not exists updated_at timestamptz null;

-- Indexes (optional but helpful)
create index if not exists idx_don_id_utilisateur on public.don (id_utilisateur);
create index if not exists idx_don_provider_reference on public.don (provider_reference);
create index if not exists idx_don_date_don on public.don (date_don);

