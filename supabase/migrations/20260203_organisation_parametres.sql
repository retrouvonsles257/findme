-- Paramètres organisation (équipe + notifications) pour admin org
ALTER TABLE organisation ADD COLUMN IF NOT EXISTS parametres_organisation JSONB DEFAULT '{}';
COMMENT ON COLUMN organisation.parametres_organisation IS 'Préférences équipe et notifications (max_team_members, auto_assign, require_approval, email_new_dossier, etc.)';
