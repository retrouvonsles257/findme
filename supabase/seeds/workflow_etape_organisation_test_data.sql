-- Données de test pour workflow_etape_organisation
-- Organisation: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
-- Exécuter après la migration 20260210_workflow_etape_organisation.sql

INSERT INTO workflow_etape_organisation (id_organisation, code, libelle, ordre, actif) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'en_attente', 'En attente', 0, true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'en_cours', 'En cours de traitement', 1, true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'en_analyse', 'En analyse', 2, true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cloture', 'Clôturé', 3, true)
ON CONFLICT (id_organisation, code) DO NOTHING;
