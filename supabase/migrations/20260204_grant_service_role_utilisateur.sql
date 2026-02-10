-- Edge Functions utilisent la clé service_role pour accéder aux tables.
-- Sans ces GRANT : "permission denied for table ..."

-- Admin org (admin-invite-user, admin-create-user)
GRANT SELECT ON public.utilisateur TO service_role;
GRANT SELECT ON public.utilisateur_role TO service_role;
GRANT SELECT ON public.role TO service_role;
GRANT INSERT, UPDATE ON public.utilisateur TO service_role;
GRANT INSERT ON public.utilisateur_role TO service_role;

-- Dons (donations-create, donations-webhook, donations-mock-confirm)
GRANT SELECT, INSERT, UPDATE ON public.don TO service_role;
