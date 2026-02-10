-- =====================================================
-- Table: demande_verification_identite
-- Demandes de vérification d'identité (citoyens -> citoyen_verifie)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE statut_demande_verification AS ENUM (
    'en_attente',
    'approuve',
    'refuse',
    'complement_demande'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS demande_verification_identite (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_utilisateur UUID NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
  id_organisation UUID REFERENCES organisation(id) ON DELETE SET NULL,
  statut statut_demande_verification NOT NULL DEFAULT 'en_attente',
  type_document VARCHAR(50) NOT NULL DEFAULT 'cni' CHECK (type_document IN ('cni', 'passeport', 'autre')),
  url_document TEXT,
  url_selfie TEXT,
  commentaire_moderateur TEXT,
  traite_par UUID REFERENCES utilisateur(id) ON DELETE SET NULL,
  traite_le TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_demande_verif_identite_org ON demande_verification_identite(id_organisation);
CREATE INDEX idx_demande_verif_identite_statut ON demande_verification_identite(statut);
CREATE INDEX idx_demande_verif_identite_utilisateur ON demande_verification_identite(id_utilisateur);
CREATE INDEX idx_demande_verif_identite_created ON demande_verification_identite(created_at DESC);

ALTER TABLE demande_verification_identite ENABLE ROW LEVEL SECURITY;

-- Voir : ses propres demandes, ou celles de son org, ou les globales (id_organisation NULL)
CREATE POLICY "demande_verification_identite_select"
  ON demande_verification_identite FOR SELECT
  USING (
    id_utilisateur = auth.uid()
    OR id_organisation = (SELECT id_organisation FROM utilisateur WHERE id = auth.uid() LIMIT 1)
    OR id_organisation IS NULL
  );

-- Créer une demande : uniquement pour soi (citoyen)
CREATE POLICY "demande_verification_identite_insert"
  ON demande_verification_identite FOR INSERT
  WITH CHECK (id_utilisateur = auth.uid());

-- Modifier (traiter) : demande de son org ou globale
CREATE POLICY "demande_verification_identite_update"
  ON demande_verification_identite FOR UPDATE
  USING (
    id_organisation = (SELECT id_organisation FROM utilisateur WHERE id = auth.uid() LIMIT 1)
    OR id_organisation IS NULL
  );

COMMENT ON TABLE demande_verification_identite IS 'Demandes de vérification d''identité pour passage citoyen_verifie ; traitées par admin org ou modérateur';

GRANT SELECT, INSERT, UPDATE ON demande_verification_identite TO authenticated;
