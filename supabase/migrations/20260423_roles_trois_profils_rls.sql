-- =====================================================
-- Étape C : 3 rôles applicatifs (citoyen, autorite, admin_systeme)
-- + identite_verifiee / autorite_echelon sur utilisateur
-- + RPC et RLS alignés (remplace la grille 9 rôles)
-- À appliquer sur Supabase : supabase db push / SQL Editor
-- =====================================================

-- ---------- 1) Enum : nouvelles valeurs (les anciennes restent dans le type PG) ----------
ALTER TYPE public.nom_role ADD VALUE IF NOT EXISTS 'citoyen';
ALTER TYPE public.nom_role ADD VALUE IF NOT EXISTS 'autorite';
ALTER TYPE public.nom_role ADD VALUE IF NOT EXISTS 'admin_systeme';

-- ---------- 2) Colonnes profil ----------
ALTER TABLE public.utilisateur
  ADD COLUMN IF NOT EXISTS identite_verifiee boolean NOT NULL DEFAULT false;

ALTER TABLE public.utilisateur
  ADD COLUMN IF NOT EXISTS autorite_echelon smallint NULL;

COMMENT ON COLUMN public.utilisateur.identite_verifiee IS 'True si identité vérifiée (ex-citoyen_verifie).';
COMMENT ON COLUMN public.utilisateur.autorite_echelon IS 'Compte autorite : 1=saisie restreinte, 2=modération, 3=ONG, 4=police/gendarmerie plein pouvoir dossier.';

-- ---------- 3) Backfill identité vérifiée (avant fusion des lignes role) ----------
UPDATE public.utilisateur u
SET identite_verifiee = true
WHERE EXISTS (
  SELECT 1
  FROM public.utilisateur_role ur
  JOIN public.role r ON r.id = ur.id_role
  WHERE ur.id_utilisateur = u.id
    AND r.nom_role::text = 'citoyen_verifie'
);

-- ---------- 4) Backfill échelon autorité (sans admin_organisation) ----------
UPDATE public.utilisateur u
SET autorite_echelon = s.mx
FROM (
  SELECT
    ur.id_utilisateur,
    MAX(
      CASE r.nom_role::text
        WHEN 'operateur_saisie' THEN 1
        WHEN 'moderateur' THEN 2
        WHEN 'responsable_ong' THEN 3
        WHEN 'officier_police' THEN 4
        WHEN 'agent_gendarmerie' THEN 4
        ELSE 0
      END
    ) AS mx
  FROM public.utilisateur_role ur
  JOIN public.role r ON r.id = ur.id_role
  WHERE r.nom_role::text IN (
    'operateur_saisie', 'moderateur', 'responsable_ong', 'officier_police', 'agent_gendarmerie'
  )
  GROUP BY ur.id_utilisateur
) s
WHERE u.id = s.id_utilisateur AND s.mx > 0;

-- ---------- 5) Fusion utilisateur_role → 3 rôles physiques ----------
DO $$
DECLARE
  id_cit_std uuid;
  id_cit_ver uuid;
  id_anchor uuid;
  id_super uuid;
  id_admin_org uuid;
BEGIN
  SELECT id INTO id_cit_std FROM public.role WHERE nom_role::text = 'citoyen_standard' LIMIT 1;
  SELECT id INTO id_cit_ver FROM public.role WHERE nom_role::text = 'citoyen_verifie' LIMIT 1;
  SELECT id INTO id_anchor FROM public.role WHERE nom_role::text = 'officier_police' LIMIT 1;
  IF id_anchor IS NULL THEN
    SELECT id INTO id_anchor FROM public.role
    WHERE nom_role::text IN ('agent_gendarmerie', 'responsable_ong', 'operateur_saisie', 'moderateur')
    ORDER BY niveau_accreditation DESC NULLS LAST
    LIMIT 1;
  END IF;
  SELECT id INTO id_super FROM public.role WHERE nom_role::text = 'super_admin' LIMIT 1;
  SELECT id INTO id_admin_org FROM public.role WHERE nom_role::text = 'admin_organisation' LIMIT 1;

  IF id_cit_std IS NULL THEN
    RAISE EXCEPTION 'Migration roles: ligne role citoyen_standard introuvable';
  END IF;
  IF id_anchor IS NULL THEN
    RAISE EXCEPTION 'Migration roles: aucun rôle autorité source (officier_police, etc.) introuvable';
  END IF;
  IF id_super IS NULL THEN
    RAISE EXCEPTION 'Migration roles: ligne role super_admin introuvable';
  END IF;

  -- Citoyens vérifiés → même id_role que citoyen_standard
  IF id_cit_ver IS NOT NULL THEN
    UPDATE public.utilisateur_role ur
    SET id_role = id_cit_std
    WHERE ur.id_role = id_cit_ver;
  END IF;

  -- Tous les rôles « terrain » autorité → ancre unique
  UPDATE public.utilisateur_role ur
  SET id_role = id_anchor
  WHERE ur.id_role IN (
    SELECT r.id FROM public.role r
    WHERE r.nom_role::text IN (
      'agent_gendarmerie', 'responsable_ong', 'operateur_saisie', 'moderateur', 'officier_police'
    )
  );

  -- Admin org → super_admin (même ligne cible que admin_systeme après renommage)
  IF id_admin_org IS NOT NULL THEN
    UPDATE public.utilisateur_role ur
    SET id_role = id_super
    WHERE ur.id_role = id_admin_org;
  END IF;
END $$;

-- Dédupliquer (id_utilisateur, id_role)
DELETE FROM public.utilisateur_role ur
WHERE ur.ctid NOT IN (
  SELECT MIN(ur2.ctid)
  FROM public.utilisateur_role ur2
  WHERE ur2.id_utilisateur = ur.id_utilisateur AND ur2.id_role = ur.id_role
);

-- ---------- 6) Renommer les 3 lignes conservées dans public.role ----------
UPDATE public.role
SET
  nom_role = 'citoyen'::public.nom_role,
  niveau_accreditation = 10,
  description = 'Compte grand public (citoyen).',
  permissions = '{"can_view_public": true, "can_report": true}'::jsonb
WHERE nom_role::text = 'citoyen_standard';

UPDATE public.role r
SET
  nom_role = 'autorite'::public.nom_role,
  niveau_accreditation = 50,
  description = 'Compte autorité (organisation).',
  permissions = '{"can_org_scoped": true}'::jsonb
WHERE r.id IN (
  SELECT DISTINCT ur.id_role
  FROM public.utilisateur_role ur
  JOIN public.role rx ON rx.id = ur.id_role
  WHERE rx.nom_role::text IN (
    'officier_police', 'agent_gendarmerie', 'responsable_ong', 'operateur_saisie', 'moderateur'
  )
);

UPDATE public.role
SET
  nom_role = 'admin_systeme'::public.nom_role,
  niveau_accreditation = 100,
  description = 'Administrateur système.',
  permissions = '{"full_system_access": true}'::jsonb
WHERE nom_role::text = 'super_admin';

DELETE FROM public.role
WHERE nom_role::text NOT IN ('citoyen', 'autorite', 'admin_systeme');

-- Garantir les 3 lignes référentiel (ex. base sans compte autorité encore)
INSERT INTO public.role (nom_role, niveau_accreditation, description, permissions)
SELECT 'citoyen'::public.nom_role, 10, 'Compte grand public (citoyen).', '{"can_view_public": true, "can_report": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.role r WHERE r.nom_role::text = 'citoyen');

INSERT INTO public.role (nom_role, niveau_accreditation, description, permissions)
SELECT 'autorite'::public.nom_role, 50, 'Compte autorité (organisation).', '{"can_org_scoped": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.role r WHERE r.nom_role::text = 'autorite');

INSERT INTO public.role (nom_role, niveau_accreditation, description, permissions)
SELECT 'admin_systeme'::public.nom_role, 100, 'Administrateur système.', '{"full_system_access": true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.role r WHERE r.nom_role::text = 'admin_systeme');

-- ---------- 7) Helpers RLS ----------
CREATE OR REPLACE FUNCTION public.utilisateur_has_role(p_user uuid, p_nom text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.utilisateur_role ur
    JOIN public.role r ON r.id = ur.id_role
    WHERE ur.id_utilisateur = p_user
      AND (ur.date_expiration IS NULL OR ur.date_expiration > now())
      AND r.nom_role::text = p_nom
  );
$$;

CREATE OR REPLACE FUNCTION public.is_autorite_membre_org()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.utilisateur_has_role(auth.uid(), 'autorite')
    AND public.get_my_org_id() IS NOT NULL;
$$;

GRANT EXECUTE ON FUNCTION public.utilisateur_has_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_autorite_membre_org() TO authenticated;

-- ---------- 8) RPC rôles (utilisées par l''app) ----------
CREATE OR REPLACE FUNCTION public.get_user_main_role(p_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT r.nom_role::text
      FROM public.utilisateur_role ur
      JOIN public.role r ON r.id = ur.id_role
      WHERE ur.id_utilisateur = p_user_id
        AND (ur.date_expiration IS NULL OR ur.date_expiration > now())
      ORDER BY r.niveau_accreditation DESC NULLS LAST
      LIMIT 1
    ),
    'citoyen'
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_all_roles(p_user_id uuid)
RETURNS text[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  arr text[];
BEGIN
  SELECT coalesce(array_agg(DISTINCT r.nom_role::text), ARRAY[]::text[])
  INTO arr
  FROM public.utilisateur_role ur
  JOIN public.role r ON r.id = ur.id_role
  WHERE ur.id_utilisateur = p_user_id
    AND (ur.date_expiration IS NULL OR ur.date_expiration > now());

  IF arr IS NULL OR cardinality(arr) = 0 THEN
    RETURN ARRAY['citoyen']::text[];
  END IF;
  RETURN arr;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_with_role(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec public.utilisateur%ROWTYPE;
  main_role text;
  all_roles text[];
BEGIN
  SELECT * INTO rec FROM public.utilisateur WHERE id = p_user_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  main_role := public.get_user_main_role(p_user_id);
  all_roles := public.get_user_all_roles(p_user_id);

  RETURN jsonb_build_object(
    'id', rec.id,
    'email', rec.email,
    'nom', rec.nom,
    'prenom', rec.prenom,
    'nom_complet', trim(both ' ' from coalesce(rec.prenom, '') || ' ' || coalesce(rec.nom, '')),
    'type_compte', rec.type_compte::text,
    'statut_compte', rec.statut_compte::text,
    'id_organisation', rec.id_organisation,
    'telephone', rec.telephone,
    'identite_verifiee', rec.identite_verifiee,
    'autorite_echelon', rec.autorite_echelon,
    'role', main_role,
    'roles', to_jsonb(all_roles)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_main_role(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_all_roles(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_with_role(uuid) TO authenticated, anon;

-- ---------- 9) get_user_niveau_acces (inchangé sémantiquement : MAX niveau) ----------
CREATE OR REPLACE FUNCTION public.get_user_niveau_acces(user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  niveau integer;
BEGIN
  SELECT COALESCE(MAX(r.niveau_accreditation), 0)
  INTO niveau
  FROM public.utilisateur_role ur
  JOIN public.role r ON ur.id_role = r.id
  WHERE ur.id_utilisateur = user_id
    AND (ur.date_expiration IS NULL OR ur.date_expiration > now());

  RETURN niveau;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_niveau_at_least(min_niveau int)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_niveau_acces(auth.uid()) >= min_niveau;
$$;

-- ---------- 10) Trigger garde opérateur : échelon 1 = restrictions ----------
CREATE OR REPLACE FUNCTION public.guard_operator_dossier_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  echelon int;
BEGIN
  SELECT u.autorite_echelon INTO echelon
  FROM public.utilisateur u
  WHERE u.id = auth.uid();

  IF public.utilisateur_has_role(auth.uid(), 'autorite')
     AND echelon IS NOT NULL AND echelon <= 1 THEN
    IF new.statut_dossier IS DISTINCT FROM old.statut_dossier THEN
      RAISE EXCEPTION 'autorite_echelon_1: cannot change dossier statut_dossier';
    END IF;
    IF new.visible_public IS DISTINCT FROM old.visible_public THEN
      RAISE EXCEPTION 'autorite_echelon_1: cannot change dossier visible_public';
    END IF;
    IF new.diffusion_autorisee IS DISTINCT FROM old.diffusion_autorisee
       OR new.diffusion_reseaux_sociaux IS DISTINCT FROM old.diffusion_reseaux_sociaux
       OR new.diffusion_medias IS DISTINCT FROM old.diffusion_medias THEN
      RAISE EXCEPTION 'autorite_echelon_1: cannot change dossier diffusion flags';
    END IF;
  END IF;
  RETURN new;
END;
$$;

-- ---------- 11) Remplacer is_niveau_at_least(2) par membre autorité + org ----------
DROP POLICY IF EXISTS dossier_operator_select_org ON public.dossier_disparition;
CREATE POLICY dossier_operator_select_org
ON public.dossier_disparition FOR SELECT TO authenticated
USING (
  public.is_autorite_membre_org()
  AND id_organisation_responsable = public.get_my_org_id()
);

DROP POLICY IF EXISTS dossier_operator_insert ON public.dossier_disparition;
CREATE POLICY dossier_operator_insert
ON public.dossier_disparition FOR INSERT TO authenticated
WITH CHECK (
  public.is_autorite_membre_org()
  AND id_utilisateur_createur = auth.uid()
  AND id_organisation_responsable = public.get_my_org_id()
);

DROP POLICY IF EXISTS dossier_operator_update_own ON public.dossier_disparition;
CREATE POLICY dossier_operator_update_own
ON public.dossier_disparition FOR UPDATE TO authenticated
USING (
  public.is_autorite_membre_org()
  AND id_utilisateur_createur = auth.uid()
)
WITH CHECK (
  public.is_autorite_membre_org()
  AND id_utilisateur_createur = auth.uid()
  AND id_organisation_responsable = public.get_my_org_id()
);

CREATE POLICY dossier_admin_systeme_select
ON public.dossier_disparition FOR SELECT TO authenticated
USING (public.utilisateur_has_role(auth.uid(), 'admin_systeme'));

-- ---------- Personne ----------
DROP POLICY IF EXISTS personne_operator_select_org ON public.personne;
CREATE POLICY personne_operator_select_org
ON public.personne FOR SELECT TO authenticated
USING (
  public.is_autorite_membre_org() AND (
    cree_par = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.dossier_disparition d
      WHERE d.id_personne = personne.id
        AND d.id_organisation_responsable = public.get_my_org_id()
    )
  )
);

DROP POLICY IF EXISTS personne_operator_insert ON public.personne;
CREATE POLICY personne_operator_insert
ON public.personne FOR INSERT TO authenticated
WITH CHECK (public.is_autorite_membre_org() AND cree_par = auth.uid());

DROP POLICY IF EXISTS personne_operator_update_own ON public.personne;
CREATE POLICY personne_operator_update_own
ON public.personne FOR UPDATE TO authenticated
USING (public.is_autorite_membre_org() AND cree_par = auth.uid())
WITH CHECK (public.is_autorite_membre_org() AND cree_par = auth.uid());

CREATE POLICY personne_admin_systeme_select
ON public.personne FOR SELECT TO authenticated
USING (public.utilisateur_has_role(auth.uid(), 'admin_systeme'));

-- ---------- Signalement ----------
DROP POLICY IF EXISTS signalement_operator_select_org ON public.signalement;
CREATE POLICY signalement_operator_select_org
ON public.signalement FOR SELECT TO authenticated
USING (
  public.is_autorite_membre_org()
  AND EXISTS (
    SELECT 1 FROM public.dossier_disparition d
    WHERE d.id = signalement.id_dossier
      AND d.id_organisation_responsable = public.get_my_org_id()
  )
);

CREATE POLICY signalement_admin_systeme_select
ON public.signalement FOR SELECT TO authenticated
USING (public.utilisateur_has_role(auth.uid(), 'admin_systeme'));

-- ---------- Photo ----------
DROP POLICY IF EXISTS photo_operator_select_pending_org ON public.photo;
CREATE POLICY photo_operator_select_pending_org
ON public.photo FOR SELECT TO authenticated
USING (
  public.is_autorite_membre_org()
  AND approuvee = false
  AND EXISTS (
    SELECT 1 FROM public.dossier_disparition d
    WHERE d.id_personne = photo.id_personne
      AND d.id_organisation_responsable = public.get_my_org_id()
  )
);

DROP POLICY IF EXISTS photo_operator_insert_own ON public.photo;
CREATE POLICY photo_operator_insert_own
ON public.photo FOR INSERT TO authenticated
WITH CHECK (
  public.is_autorite_membre_org()
  AND uploadee_par = auth.uid()
  AND visible_public = false
  AND approuvee = false
);

CREATE POLICY photo_admin_systeme_select
ON public.photo FOR SELECT TO authenticated
USING (public.utilisateur_has_role(auth.uid(), 'admin_systeme'));

-- ---------- Localisation ----------
DROP POLICY IF EXISTS localisation_operator_select_org ON public.localisation;
CREATE POLICY localisation_operator_select_org
ON public.localisation FOR SELECT TO authenticated
USING (
  public.is_autorite_membre_org()
  AND (
    (id_dossier IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.dossier_disparition d
      WHERE d.id = localisation.id_dossier
        AND d.id_organisation_responsable = public.get_my_org_id()
    ))
    OR (id_signalement IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.signalement s
      JOIN public.dossier_disparition d ON d.id = s.id_dossier
      WHERE s.id = localisation.id_signalement
        AND d.id_organisation_responsable = public.get_my_org_id()
    ))
  )
);

DROP POLICY IF EXISTS localisation_operator_insert_own ON public.localisation;
CREATE POLICY localisation_operator_insert_own
ON public.localisation FOR INSERT TO authenticated
WITH CHECK (
  public.is_autorite_membre_org()
  AND enregistree_par = auth.uid()
  AND (
    (id_dossier IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.dossier_disparition d
      WHERE d.id = localisation.id_dossier
        AND d.id_organisation_responsable = public.get_my_org_id()
    ))
    OR (id_signalement IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.signalement s
      JOIN public.dossier_disparition d ON d.id = s.id_dossier
      WHERE s.id = localisation.id_signalement
        AND d.id_organisation_responsable = public.get_my_org_id()
    ))
  )
);

CREATE POLICY localisation_admin_systeme_select
ON public.localisation FOR SELECT TO authenticated
USING (public.utilisateur_has_role(auth.uid(), 'admin_systeme'));

-- ---------- Lien filiation ----------
DROP POLICY IF EXISTS filiation_operator_select_org ON public.lien_filiation;
CREATE POLICY filiation_operator_select_org
ON public.lien_filiation FOR SELECT TO authenticated
USING (
  public.is_autorite_membre_org()
  AND EXISTS (
    SELECT 1 FROM public.dossier_disparition d
    WHERE d.id_personne IN (lien_filiation.id_personne_source, lien_filiation.id_personne_cible)
      AND d.id_organisation_responsable = public.get_my_org_id()
  )
);

DROP POLICY IF EXISTS filiation_operator_insert_own ON public.lien_filiation;
CREATE POLICY filiation_operator_insert_own
ON public.lien_filiation FOR INSERT TO authenticated
WITH CHECK (
  public.is_autorite_membre_org()
  AND cree_par = auth.uid()
  AND visible_public = false
);

DROP POLICY IF EXISTS filiation_operator_update_own ON public.lien_filiation;
CREATE POLICY filiation_operator_update_own
ON public.lien_filiation FOR UPDATE TO authenticated
USING (public.is_autorite_membre_org() AND cree_par = auth.uid())
WITH CHECK (public.is_autorite_membre_org() AND cree_par = auth.uid());

DROP POLICY IF EXISTS filiation_operator_delete_own ON public.lien_filiation;
CREATE POLICY filiation_operator_delete_own
ON public.lien_filiation FOR DELETE TO authenticated
USING (public.is_autorite_membre_org() AND cree_par = auth.uid());

CREATE POLICY filiation_admin_systeme_select
ON public.lien_filiation FOR SELECT TO authenticated
USING (public.utilisateur_has_role(auth.uid(), 'admin_systeme'));

-- ---------- 12) Dons : lecture globale autorité + admin système ----------
DROP POLICY IF EXISTS don_authority_select ON public.don;
CREATE POLICY don_authority_select
ON public.don FOR SELECT TO authenticated
USING (
  public.utilisateur_has_role(auth.uid(), 'autorite')
  OR public.utilisateur_has_role(auth.uid(), 'admin_systeme')
);
