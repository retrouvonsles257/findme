-- Lecture des rôles et des attributions pour la page Admin « Rôles et permissions »
-- (référentiel + nombre d'utilisateurs par rôle dans l'organisation).
-- RLS sur utilisateur doit restreindre les lignes visibles (ex. même organisation).

GRANT SELECT ON public.role TO authenticated;
GRANT SELECT ON public.utilisateur_role TO authenticated;
GRANT SELECT ON public.utilisateur TO authenticated;
