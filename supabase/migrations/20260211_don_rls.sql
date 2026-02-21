-- =====================================================
-- RLS table DON - Phase 1 alignement doc donations
-- =====================================================
-- Lecture : citoyen voit ses dons (id_utilisateur = auth.uid())
--          autorité / modérateur / super_admin (niveau >= 4) voient tous les dons.
-- Insert/Update : réservés aux Edge Functions (service_role).
-- Prérequis : public.get_user_niveau_acces(uuid), public.is_niveau_at_least(int)
-- =====================================================

alter table if exists public.don enable row level security;

drop policy if exists don_own_select on public.don;
drop policy if exists don_authority_select on public.don;

-- Citoyen : voir uniquement ses propres dons
create policy don_own_select
on public.don
for select
to authenticated
using (id_utilisateur = auth.uid());

-- Autorité / Modérateur / Super admin (niveau >= 4) : voir tous les dons
create policy don_authority_select
on public.don
for select
to authenticated
using (public.is_niveau_at_least(4));
