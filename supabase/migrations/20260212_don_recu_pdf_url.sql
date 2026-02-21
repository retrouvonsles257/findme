-- =====================================================
-- RETROUVONSLES - Don: lien vers reçu PDF (optionnel)
-- =====================================================
-- Aligné avec DONATIONS_IMPLEMENTATION.md (receipt_url / recu_pdf_url).

alter table if exists public.don
  add column if not exists recu_pdf_url text null;
