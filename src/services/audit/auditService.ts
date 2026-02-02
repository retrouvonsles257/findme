/**
 * =====================================================
 * RETROUVONSLES - Audit / Journal d'activité
 * Best-effort logging (ne doit pas bloquer l'UI)
 * =====================================================
 */

import { supabase } from '../../config';
import type { TypeAction } from '../../@types/enums.types';

export type AuditLogInput = {
  type_action: TypeAction;
  description?: string | null;
  action_detaillee?: string | null;
  donnees_avant?: any;
  donnees_apres?: any;
  id_utilisateur?: string | null;
  id_dossier?: string | null;
  id_signalement?: string | null;
  id_alerte?: string | null;
};

export async function logActivity(input: AuditLogInput): Promise<void> {
  try {
    const userAgent =
      typeof navigator !== 'undefined' ? navigator.userAgent : null;

    await (supabase as any).from('journal_activite').insert({
      type_action: input.type_action,
      description: input.description ?? null,
      action_detaillee: input.action_detaillee ?? null,
      donnees_avant: input.donnees_avant ?? null,
      donnees_apres: input.donnees_apres ?? null,
      user_agent: userAgent,
      id_utilisateur: input.id_utilisateur ?? null,
      id_dossier: input.id_dossier ?? null,
      id_signalement: input.id_signalement ?? null,
      id_alerte: input.id_alerte ?? null,
    });
  } catch {
    // Best-effort: on ignore toute erreur d'audit (RLS/table absente/etc.)
  }
}

