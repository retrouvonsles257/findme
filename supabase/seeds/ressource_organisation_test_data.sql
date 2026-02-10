-- Données de test pour ressource_organisation
-- Organisation: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
-- Exécuter après la migration 20260205_ressource_organisation.sql

-- Toutes les URL sont à NULL : à remplir avec de vrais liens quand disponibles.
INSERT INTO ressource_organisation (id_organisation, titre, type, description, url, ordre) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Guide de bonnes pratiques', 'guide', 'Guide pour la gestion des dossiers de personnes disparues et le travail avec les familles.', NULL, 1),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Modèle de fiche signalement', 'document', 'Modèle type de fiche à remplir pour tout nouveau signalement.', NULL, 2),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Outil de suivi des dossiers', 'tool', 'Tableau de bord et checklist pour le suivi des dossiers actifs.', NULL, 3),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Formation premiers secours psychologiques', 'training', 'Ressource de formation pour l''accueil des familles en détresse.', NULL, 4),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Répertoire des acteurs', 'document', 'Liste des contacts utiles (police, hôpitaux, associations) par zone.', NULL, 5)
;

-- Si des lignes existaient déjà avec des URL example.com, exécuter une fois pour les retirer :
-- UPDATE ressource_organisation SET url = NULL WHERE url LIKE '%example.com%';
