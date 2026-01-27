-- =====================================================
-- RETROUVONSLES - DÉSACTIVER RLS COMPLÈTEMENT
-- Ce script désactive RLS sur TOUTES les tables
-- Pour permettre aux utilisateurs d'accéder aux données
-- =====================================================

-- Supprimer TOUTES les politiques existantes d'abord
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- DÉSACTIVER RLS SUR TOUTES LES TABLES
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
ALTER TABLE IF EXISTS don DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS campagne_sensibilisation DISABLE ROW LEVEL SECURITY;

-- GRANT permissions au rôle authenticated et anon
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;

-- Vérifier que RLS est bien désactivé
SELECT 
    schemaname,
    tablename,
    CASE WHEN rowsecurity THEN 'ENABLED ❌' ELSE 'DISABLED ✓' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

SELECT '✅ RLS COMPLÈTEMENT DÉSACTIVÉ SUR TOUTES LES TABLES!' AS status;
