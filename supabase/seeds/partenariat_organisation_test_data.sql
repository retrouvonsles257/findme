-- Données de test pour partenariat_organisation
-- Organisation: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
-- Exécuter après la migration 20260206_partenariat_organisation.sql

INSERT INTO partenariat_organisation (id_organisation, nom_partenaire, personne_contact, email, telephone, statut, date_partnership) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Croix-Rouge régionale', 'Marie Dupont', 'marie.dupont@croixrouge.example.org', '+237 6 XX XX XX XX', 'active', '2024-01-15'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Commissariat central', 'Capitaine Jean Mbarga', 'j.mbarga@police.gov.cm', '+237 2 XX XX XX XX', 'active', '2023-06-01'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Hôpital de référence', 'Dr. Amina Ousmanou', 'contact@hopital-ref.example.org', NULL, 'pending', '2025-01-10'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Association familles disparus', 'Paul Nkolo', 'p.nkolo@asso-familles.org', '+237 6 XX XX XX XX', 'active', '2022-09-01');
