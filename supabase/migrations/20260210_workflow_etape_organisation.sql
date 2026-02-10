-- =====================================================
-- Table: workflow_etape_organisation
-- Étapes de traitement des dossiers configurables par organisation (admin org)
-- =====================================================

CREATE TABLE IF NOT EXISTS workflow_etape_organisation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_organisation UUID NOT NULL REFERENCES organisation(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  libelle VARCHAR(255) NOT NULL,
  ordre INT NOT NULL DEFAULT 0,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(id_organisation, code)
);

CREATE INDEX idx_workflow_etape_organisation_org ON workflow_etape_organisation(id_organisation);
CREATE INDEX idx_workflow_etape_organisation_ordre ON workflow_etape_organisation(id_organisation, ordre);

ALTER TABLE workflow_etape_organisation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workflow_etape_organisation_select"
  ON workflow_etape_organisation FOR SELECT
  USING (
    id_organisation = (SELECT id_organisation FROM utilisateur WHERE id = auth.uid() LIMIT 1)
  );

CREATE POLICY "workflow_etape_organisation_insert"
  ON workflow_etape_organisation FOR INSERT
  WITH CHECK (
    id_organisation = (SELECT id_organisation FROM utilisateur WHERE id = auth.uid() LIMIT 1)
  );

CREATE POLICY "workflow_etape_organisation_update"
  ON workflow_etape_organisation FOR UPDATE
  USING (
    id_organisation = (SELECT id_organisation FROM utilisateur WHERE id = auth.uid() LIMIT 1)
  );

CREATE POLICY "workflow_etape_organisation_delete"
  ON workflow_etape_organisation FOR DELETE
  USING (
    id_organisation = (SELECT id_organisation FROM utilisateur WHERE id = auth.uid() LIMIT 1)
  );

COMMENT ON TABLE workflow_etape_organisation IS 'Étapes de workflow (traitement dossiers) configurables par organisation pour admin org';

-- Grant pour le rôle authenticated (RLS restreint par id_organisation)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_etape_organisation TO authenticated;
