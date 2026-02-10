-- =====================================================
-- Table: ressource_organisation
-- Ressources par organisation (admin org / héritage NGO)
-- =====================================================

CREATE TABLE IF NOT EXISTS ressource_organisation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_organisation UUID NOT NULL REFERENCES organisation(id) ON DELETE CASCADE,
  titre VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'document' CHECK (type IN ('document', 'tool', 'guide', 'training')),
  description TEXT,
  url TEXT,
  ordre INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ressource_organisation_org ON ressource_organisation(id_organisation);
CREATE INDEX idx_ressource_organisation_type ON ressource_organisation(type);

ALTER TABLE ressource_organisation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ressource_organisation_select"
  ON ressource_organisation FOR SELECT
  USING (
    id_organisation = (SELECT id_organisation FROM utilisateur WHERE id = auth.uid() LIMIT 1)
  );

CREATE POLICY "ressource_organisation_insert"
  ON ressource_organisation FOR INSERT
  WITH CHECK (
    id_organisation = (SELECT id_organisation FROM utilisateur WHERE id = auth.uid() LIMIT 1)
  );

CREATE POLICY "ressource_organisation_update"
  ON ressource_organisation FOR UPDATE
  USING (
    id_organisation = (SELECT id_organisation FROM utilisateur WHERE id = auth.uid() LIMIT 1)
  );

CREATE POLICY "ressource_organisation_delete"
  ON ressource_organisation FOR DELETE
  USING (
    id_organisation = (SELECT id_organisation FROM utilisateur WHERE id = auth.uid() LIMIT 1)
  );

COMMENT ON TABLE ressource_organisation IS 'Ressources (liens, guides, outils) par organisation pour admin org et pages NGO';
