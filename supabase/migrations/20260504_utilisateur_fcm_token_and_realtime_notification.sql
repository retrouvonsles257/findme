-- =====================================================
-- Tokens FCM par utilisateur + publication Realtime
-- pour synchroniser l’UI / toasts quand l’app est ouverte.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.utilisateur_fcm_token (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_utilisateur uuid NOT NULL REFERENCES public.utilisateur (id) ON DELETE CASCADE,
  token text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT utilisateur_fcm_token_token_key UNIQUE (token)
);

CREATE INDEX IF NOT EXISTS utilisateur_fcm_token_id_utilisateur_idx
  ON public.utilisateur_fcm_token (id_utilisateur);

COMMENT ON TABLE public.utilisateur_fcm_token IS 'Jetons Firebase Cloud Messaging (navigateur / Web Push) par utilisateur.';

ALTER TABLE public.utilisateur_fcm_token ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "utilisateur_fcm_token_select_own" ON public.utilisateur_fcm_token;
CREATE POLICY "utilisateur_fcm_token_select_own"
  ON public.utilisateur_fcm_token FOR SELECT TO authenticated
  USING (id_utilisateur = auth.uid());

DROP POLICY IF EXISTS "utilisateur_fcm_token_insert_own" ON public.utilisateur_fcm_token;
CREATE POLICY "utilisateur_fcm_token_insert_own"
  ON public.utilisateur_fcm_token FOR INSERT TO authenticated
  WITH CHECK (id_utilisateur = auth.uid());

DROP POLICY IF EXISTS "utilisateur_fcm_token_update_own" ON public.utilisateur_fcm_token;
CREATE POLICY "utilisateur_fcm_token_update_own"
  ON public.utilisateur_fcm_token FOR UPDATE TO authenticated
  USING (id_utilisateur = auth.uid())
  WITH CHECK (id_utilisateur = auth.uid());

DROP POLICY IF EXISTS "utilisateur_fcm_token_delete_own" ON public.utilisateur_fcm_token;
CREATE POLICY "utilisateur_fcm_token_delete_own"
  ON public.utilisateur_fcm_token FOR DELETE TO authenticated
  USING (id_utilisateur = auth.uid());

-- Webhook FCM (Edge Function) : après déploiement de notification-fcm-send,
-- Dashboard Supabase → Database → Webhooks → INSERT sur public.notification
-- URL: https://<ref>.supabase.co/functions/v1/notification-fcm-send
-- Headers: x-notification-fcm-secret: <même valeur que secret NOTIFICATION_FCM_SECRET>
-- Corps: payload standard Supabase (type, table, record, schema).
