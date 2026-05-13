-- =====================================================
-- Verifications manuelles du périmètre administrateur plateforme
-- A exécuter dans un environnement de test avec un JWT Supabase.
-- Remplacer les valeurs de request.jwt.claim.sub / role selon le profil testé.
-- =====================================================

-- 1) Superadmin plateforme attendu : admin_systeme sans organisation.
-- select set_config('request.jwt.claim.sub', '<uuid_admin_plateforme>', true);
-- select public.is_platform_admin(); -- attendu: true
-- select public.get_platform_observability_metrics(); -- attendu: JSON agrégé

-- 2) Admin d'organisation attendu : admin_systeme avec organisation.
-- select set_config('request.jwt.claim.sub', '<uuid_admin_organisation>', true);
-- select public.is_platform_admin(); -- attendu: false
-- select public.get_platform_observability_metrics(); -- attendu: exception accès réservé

-- 3) Autorité opérationnelle attendue : rôle autorite.
-- select set_config('request.jwt.claim.sub', '<uuid_autorite>', true);
-- select public.is_platform_admin(); -- attendu: false
-- select public.get_sensitive_access_requests(); -- attendu: exception accès réservé

-- 4) Citoyen attendu : rôle citoyen.
-- select set_config('request.jwt.claim.sub', '<uuid_citoyen>', true);
-- select public.is_platform_admin(); -- attendu: false
-- select public.request_sensitive_access('<uuid_cible>', '<uuid_role>', 'test'); -- attendu: exception accès réservé

-- 5) Maintenance publique.
-- select public.get_public_system_config(); -- attendu: uniquement configuration non sensible
