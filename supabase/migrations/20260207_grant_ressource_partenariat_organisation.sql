-- Sans ces GRANT, le client (rôle authenticated) reçoit "permission denied for table ressource_organisation"
-- RLS restreint ensuite les lignes visibles selon id_organisation.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ressource_organisation TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partenariat_organisation TO authenticated;
