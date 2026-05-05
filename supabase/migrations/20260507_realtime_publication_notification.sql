-- =====================================================
-- Notifications « instantanées » côté citoyen (Realtime).
-- Combine 3 prérequis pour que postgres_changes (INSERT) livre :
--   1) RLS SELECT autorisée pour le citoyen sur ses propres lignes
--   2) `notification` ajoutée à la publication `supabase_realtime`
--   3) REPLICA IDENTITY FULL (utile en cas d’UPDATE/DELETE diffusés)
-- =====================================================

-- 1) RLS SELECT (idempotent)
ALTER TABLE public.notification ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notification_select_own ON public.notification;
CREATE POLICY notification_select_own
  ON public.notification FOR SELECT TO authenticated
  USING (id_utilisateur = auth.uid());

-- INSERT par autorité / Edge / fonction interne : le client autorité doit pouvoir créer
-- des lignes pour les destinataires (id_utilisateur ≠ auth.uid()). On garde une politique
-- INSERT permissive pour `authenticated` (sera réutilisée si elle existe déjà).
DROP POLICY IF EXISTS notification_insert_any_authenticated ON public.notification;
CREATE POLICY notification_insert_any_authenticated
  ON public.notification FOR INSERT TO authenticated
  WITH CHECK (true);

-- UPDATE/DELETE : seulement sur ses propres lignes (marquer lue/supprimer).
DROP POLICY IF EXISTS notification_update_own ON public.notification;
CREATE POLICY notification_update_own
  ON public.notification FOR UPDATE TO authenticated
  USING (id_utilisateur = auth.uid())
  WITH CHECK (id_utilisateur = auth.uid());

DROP POLICY IF EXISTS notification_delete_own ON public.notification;
CREATE POLICY notification_delete_own
  ON public.notification FOR DELETE TO authenticated
  USING (id_utilisateur = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification TO authenticated;

-- 2) Publication Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notification'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notification;
  END IF;
EXCEPTION
  WHEN undefined_object THEN
    RAISE NOTICE 'Publication supabase_realtime introuvable (hors Supabase géré ?)';
  WHEN duplicate_object THEN
    NULL;
END
$$;

-- 3) REPLICA IDENTITY FULL (sans risque si déjà FULL)
ALTER TABLE public.notification REPLICA IDENTITY FULL;
