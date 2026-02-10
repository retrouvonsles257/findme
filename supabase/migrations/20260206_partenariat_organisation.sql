-- =====================================================
-- Table: partenariat_organisation
-- Partenariats par organisation (admin org / héritage NGO)
-- =====================================================

CREATE TABLE IF NOT EXISTS partenariat_organisation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_organisation UUID NOT NULL REFERENCES organisation(id) ON DELETE CASCADE,
  nom_partenaire VARCHAR(255) NOT NULL,
  personne_contact VARCHAR(150),
  email VARCHAR(255),
  telephone VARCHAR(50),
  statut VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (statut IN ('active', 'inactive', 'pending')),
  date_partnership DATE,
  commentaire TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_partenariat_organisation_org ON partenariat_organisation(id_organisation);
CREATE INDEX idx_partenariat_organisation_statut ON partenariat_organisation(statut);

ALTER TABLE partenariat_organisation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "partenariat_organisation_select"
  ON partenariat_organisation FOR SELECT
  USING (
    id_organisation = (SELECT id_organisation FROM utilisateur WHERE id = auth.uid() LIMIT 1)
  );

CREATE POLICY "partenariat_organisation_insert"
  ON partenariat_organisation FOR INSERT
  WITH CHECK (
    id_organisation = (SELECT id_organisation FROM utilisateur WHERE id = auth.uid() LIMIT 1)
  );

CREATE POLICY "partenariat_organisation_update"
  ON partenariat_organisation FOR UPDATE
  USING (
    id_organisation = (SELECT id_organisation FROM utilisateur WHERE id = auth.uid() LIMIT 1)
  );

CREATE POLICY "partenariat_organisation_delete"
  ON partenariat_organisation FOR DELETE
  USING (
    id_organisation = (SELECT id_organisation FROM utilisateur WHERE id = auth.uid() LIMIT 1)
  );

COMMENT ON TABLE partenariat_organisation IS 'Partenariats (autres organisations, contacts) par organisation pour admin org et pages NGO';
