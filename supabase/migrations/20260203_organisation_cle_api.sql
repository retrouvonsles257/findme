-- =====================================================
-- Table: organisation_cle_api
-- Clés API par organisation (admin org)
-- Le secret complet n'est jamais stocké ; seul le préfixe est affiché dans la liste.
-- =====================================================

CREATE TABLE IF NOT EXISTS organisation_cle_api (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_organisation UUID NOT NULL REFERENCES organisation(id) ON DELETE CASCADE,
  nom_cle VARCHAR(255) NOT NULL,
  prefix_cle VARCHAR(32) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_organisation_cle_api_org ON organisation_cle_api(id_organisation);
CREATE INDEX idx_organisation_cle_api_revoked ON organisation_cle_api(revoked_at);

ALTER TABLE organisation_cle_api ENABLE ROW LEVEL SECURITY;

-- Seuls les utilisateurs de la même organisation peuvent voir/gérer les clés
CREATE POLICY "organisation_cle_api_select"
  ON organisation_cle_api FOR SELECT
  USING (
    id_organisation = (SELECT id_organisation FROM utilisateur WHERE id = auth.uid() LIMIT 1)
  );

CREATE POLICY "organisation_cle_api_insert"
  ON organisation_cle_api FOR INSERT
  WITH CHECK (
    id_organisation = (SELECT id_organisation FROM utilisateur WHERE id = auth.uid() LIMIT 1)
  );

CREATE POLICY "organisation_cle_api_update"
  ON organisation_cle_api FOR UPDATE
  USING (
    id_organisation = (SELECT id_organisation FROM utilisateur WHERE id = auth.uid() LIMIT 1)
  );

COMMENT ON TABLE organisation_cle_api IS 'Clés API par organisation (préfixe stocké, secret complet affiché une seule fois à la création)';
