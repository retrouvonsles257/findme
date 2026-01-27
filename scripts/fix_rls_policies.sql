-- =====================================================
-- RETROUVONSLES - Script FINAL RLS
-- Politiques SIMPLES et PERMISSIVES
-- Tous les utilisateurs authentifiés ont accès aux fonctionnalités
-- =====================================================

-- =====================================================
-- ÉTAPE 1: DÉSACTIVER RLS SUR TOUTES LES TABLES
-- =====================================================

ALTER TABLE IF EXISTS resultat_ia DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS organisation DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notification DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS utilisateur DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS signalement DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS dossier_disparition DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS alerte DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS photo DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS commentaire DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS document DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS personne DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS localisation DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lien_filiation DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS utilisateur_role DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS role DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS journal_activite DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS statistique_recherche DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- ÉTAPE 2: SUPPRIMER TOUTES LES POLITIQUES EXISTANTES
-- =====================================================

DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- =====================================================
-- ÉTAPE 3: RÉACTIVER RLS SUR TOUTES LES TABLES
-- =====================================================

ALTER TABLE resultat_ia ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisation ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification ENABLE ROW LEVEL SECURITY;
ALTER TABLE utilisateur ENABLE ROW LEVEL SECURITY;
ALTER TABLE signalement ENABLE ROW LEVEL SECURITY;
ALTER TABLE dossier_disparition ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerte ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo ENABLE ROW LEVEL SECURITY;
ALTER TABLE commentaire ENABLE ROW LEVEL SECURITY;
ALTER TABLE document ENABLE ROW LEVEL SECURITY;
ALTER TABLE personne ENABLE ROW LEVEL SECURITY;
ALTER TABLE localisation ENABLE ROW LEVEL SECURITY;
ALTER TABLE lien_filiation ENABLE ROW LEVEL SECURITY;
ALTER TABLE utilisateur_role ENABLE ROW LEVEL SECURITY;
ALTER TABLE role ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_activite ENABLE ROW LEVEL SECURITY;
ALTER TABLE statistique_recherche ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ÉTAPE 4: POLITIQUES SIMPLES - ACCÈS COMPLET POUR AUTHENTIFIÉS
-- Approche: Permettre l'accès à tous les utilisateurs authentifiés
-- On affinera plus tard si besoin
-- =====================================================

-- ==================== RESULTAT_IA ====================
CREATE POLICY "resultat_ia_full_access" ON resultat_ia
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- ==================== ORGANISATION ====================
CREATE POLICY "organisation_full_access" ON organisation
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- ==================== NOTIFICATION ====================
-- Les utilisateurs voient leurs propres notifications
CREATE POLICY "notification_own" ON notification
FOR ALL TO authenticated
USING (id_utilisateur = auth.uid())
WITH CHECK (id_utilisateur = auth.uid() OR true);

-- ==================== UTILISATEUR ====================
CREATE POLICY "utilisateur_full_access" ON utilisateur
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- ==================== SIGNALEMENT ====================
CREATE POLICY "signalement_full_access" ON signalement
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- ==================== DOSSIER_DISPARITION ====================
CREATE POLICY "dossier_full_access" ON dossier_disparition
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- ==================== ALERTE ====================
CREATE POLICY "alerte_full_access" ON alerte
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- ==================== PHOTO ====================
CREATE POLICY "photo_full_access" ON photo
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- ==================== COMMENTAIRE ====================
CREATE POLICY "commentaire_full_access" ON commentaire
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- ==================== DOCUMENT ====================
CREATE POLICY "document_full_access" ON document
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- ==================== PERSONNE ====================
CREATE POLICY "personne_full_access" ON personne
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- ==================== LOCALISATION ====================
CREATE POLICY "localisation_full_access" ON localisation
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- ==================== LIEN_FILIATION ====================
CREATE POLICY "lien_filiation_full_access" ON lien_filiation
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- ==================== UTILISATEUR_ROLE ====================
CREATE POLICY "utilisateur_role_full_access" ON utilisateur_role
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- ==================== ROLE ====================
CREATE POLICY "role_full_access" ON role
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- ==================== JOURNAL_ACTIVITE ====================
CREATE POLICY "journal_full_access" ON journal_activite
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- ==================== STATISTIQUE_RECHERCHE ====================
CREATE POLICY "statistique_full_access" ON statistique_recherche
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- =====================================================
-- ÉTAPE 5: PERMISSIONS POUR SERVICE ROLE (anon et service)
-- =====================================================

-- Permettre aux utilisateurs anonymes de voir les dossiers publics
CREATE POLICY "dossier_anon_read" ON dossier_disparition
FOR SELECT TO anon
USING (visible_public = true);

-- Permettre aux utilisateurs anonymes de voir les alertes actives
CREATE POLICY "alerte_anon_read" ON alerte
FOR SELECT TO anon
USING (statut_alerte = 'en_cours');

-- Permettre aux utilisateurs anonymes de voir les personnes (pour recherche)
CREATE POLICY "personne_anon_read" ON personne
FOR SELECT TO anon
USING (true);

-- Permettre aux utilisateurs anonymes de voir les photos publiques
CREATE POLICY "photo_anon_read" ON photo
FOR SELECT TO anon
USING (visible_public = true AND approuvee = true);

-- Permettre aux utilisateurs anonymes de créer des signalements
CREATE POLICY "signalement_anon_insert" ON signalement
FOR INSERT TO anon
WITH CHECK (true);

-- Permettre aux utilisateurs anonymes de voir les organisations
CREATE POLICY "organisation_anon_read" ON organisation
FOR SELECT TO anon
USING (statut_actif = true);

-- =====================================================
-- ÉTAPE 6: VÉRIFICATION
-- =====================================================

SELECT 'Script RLS exécuté avec succès!' AS status;

-- Afficher toutes les politiques créées
SELECT 
    tablename AS "Table",
    policyname AS "Politique",
    permissive AS "Type",
    roles AS "Rôles",
    cmd AS "Commande"
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
