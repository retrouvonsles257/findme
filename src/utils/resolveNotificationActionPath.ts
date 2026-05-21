/**
 * Résout le chemin SPA d'une notification (centre in-app, push FCM, SW).
 * À garder aligné avec `resolveClickPath` dans notification-fcm-send.
 */

import { NotificationTargets } from './notificationTargets';

export type NotificationAccountKind = 'citizen' | 'authority';

export type NotificationLike = {
  url_action?: string | null;
  id_dossier?: string | null;
  id_alerte?: string | null;
  type_notification?: string | null;
  donnees_supplementaires?: Record<string, unknown> | string | null;
};

function strVal(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length > 0 ? s : null;
}

function readExtra(record: NotificationLike): Record<string, unknown> | null {
  const raw = record.donnees_supplementaires;
  if (!raw) return null;
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }
  return null;
}

function resolveIdentityVerification(
  extra: Record<string, unknown>,
  isAuthority: boolean,
): string | null {
  const kind = strVal(extra.kind);
  const demandeId =
    strVal(extra.demande_verification_id) ||
    strVal(extra.demande_id);
  if (!demandeId) return null;
  if (kind === 'identity_verification_pending') {
    return NotificationTargets.authority.identityVerification(demandeId);
  }
  if (
    kind === 'identity_verification_submitted' ||
    kind === 'identity_verification_processed'
  ) {
    return NotificationTargets.citizen.profileVerification(demandeId);
  }
  if (isAuthority) {
    return NotificationTargets.authority.identityVerification(demandeId);
  }
  return NotificationTargets.citizen.profileVerification(demandeId);
}

/**
 * @param account Type de compte du destinataire (pas l'émetteur).
 */
export function resolveNotificationActionPath(
  record: NotificationLike,
  account: NotificationAccountKind = 'citizen',
): string {
  const isAuthority = account === 'authority';
  const T = isAuthority ? NotificationTargets.authority : NotificationTargets.citizen;
  const fallback = T.notifications();

  const urlAction = strVal(record.url_action);
  if (urlAction?.startsWith('/')) {
    return urlAction;
  }
  if (urlAction && /^https?:\/\//i.test(urlAction)) {
    try {
      const u = new URL(urlAction);
      const path = `${u.pathname}${u.search}${u.hash}`;
      return path.length > 1 ? path : fallback;
    } catch {
      /* inférence */
    }
  }

  const extra = readExtra(record);
  if (extra) {
    const identityPath = resolveIdentityVerification(extra, isAuthority);
    if (identityPath) return identityPath;

    const evName = strVal(extra.event);
    if (evName === 'sos_dispatch' && isAuthority) {
      return T.sos(strVal(extra.sos_id) || undefined);
    }
    if (evName === 'sos_handled' && !isAuthority) {
      return NotificationTargets.citizen.sos();
    }
    if (evName === 'alerte_lifecycle' && isAuthority) {
      const alerteId = strVal(record.id_alerte);
      if (alerteId) return NotificationTargets.authority.alerte(alerteId);
    }
    if (evName === 'signalement_validated' && !isAuthority) {
      const sid = strVal(extra.signalement_id);
      if (sid) return NotificationTargets.citizen.signalement(sid);
    }
    if (
      evName === 'signalement_created' ||
      evName === 'signalement_moderation' ||
      evName === 'signalement_messagerie_reply'
    ) {
      const sid = strVal(extra.signalement_id);
      if (sid && isAuthority) return NotificationTargets.authority.signalement(sid);
    }
    if (evName === 'signalement_messagerie_message' && !isAuthority) {
      const sid = strVal(extra.signalement_id);
      if (sid) return NotificationTargets.citizen.signalement(sid);
    }
    if (
      evName === 'pre_declaration_created' ||
      evName === 'pre_declaration_citizen_reply' ||
      evName === 'pre_declaration_rejected' ||
      evName === 'pre_declaration_message'
    ) {
      const preId = strVal(extra.pre_declaration_id);
      if (preId) {
        return isAuthority
          ? NotificationTargets.authority.preDeclaration(preId)
          : NotificationTargets.citizen.preDeclaration(preId);
      }
    }
    if (evName === 'dossier_messagerie_message' && !isAuthority) {
      const d = strVal(extra.dossier_id) || strVal(record.id_dossier);
      if (d) return NotificationTargets.citizen.dossier(d);
    }
    if (evName === 'dossier_messagerie_citizen_reply' && isAuthority) {
      const d = strVal(extra.dossier_id) || strVal(record.id_dossier);
      if (d) return NotificationTargets.authority.dossier(d);
    }
    if (evName === 'dossier_status_changed') {
      const d = strVal(extra.dossier_id) || strVal(record.id_dossier);
      if (d) {
        return isAuthority
          ? NotificationTargets.authority.dossier(d)
          : NotificationTargets.citizen.dossier(d);
      }
    }
    if (evName === 'ia_match_prioritaire_citoyen' && !isAuthority) {
      const d = strVal(extra.dossier_id) || strVal(record.id_dossier);
      if (d) return NotificationTargets.citizen.dossier(d);
    }

    const preId = strVal(extra.pre_declaration_id);
    if (preId) {
      return isAuthority
        ? NotificationTargets.authority.preDeclaration(preId)
        : NotificationTargets.citizen.preDeclaration(preId);
    }

    const sid = strVal(extra.signalement_id);
    if (sid) {
      return isAuthority
        ? NotificationTargets.authority.signalement(sid)
        : NotificationTargets.citizen.signalement(sid);
    }

    const resultatIaId = strVal(extra.resultat_ia_id);
    if (resultatIaId && isAuthority) {
      return NotificationTargets.authority.iaResult(resultatIaId);
    }
    if (resultatIaId && !isAuthority) {
      const d = strVal(extra.dossier_id) || strVal(record.id_dossier);
      if (d) return NotificationTargets.citizen.dossier(d);
    }

    const dFromExtra = strVal(extra.dossier_id);
    if (dFromExtra) {
      return isAuthority
        ? NotificationTargets.authority.dossier(dFromExtra)
        : NotificationTargets.citizen.dossier(dFromExtra);
    }
  }

  const typeN = strVal(record.type_notification);
  if (typeN === 'signalement_valide' && !isAuthority) {
    const sid = extra && strVal(extra.signalement_id);
    if (sid) return NotificationTargets.citizen.signalement(sid);
    return NotificationTargets.citizen.signalements();
  }
  if (typeN === 'message_autorite' && !isAuthority) {
    const sid = extra && strVal(extra.signalement_id);
    if (sid) return NotificationTargets.citizen.signalement(sid);
    const preId = extra && strVal(extra.pre_declaration_id);
    if (preId) return NotificationTargets.citizen.preDeclaration(preId);
    const d = strVal(record.id_dossier);
    if (d) return NotificationTargets.citizen.dossier(d);
  }
  if (typeN === 'message_autorite' && isAuthority) {
    const sid = extra && strVal(extra.signalement_id);
    if (sid) return NotificationTargets.authority.signalement(sid);
    const d = strVal(record.id_dossier);
    if (d) return NotificationTargets.authority.dossier(d);
  }
  if (typeN === 'nouvelle_alerte') {
    const alerteId = strVal(record.id_alerte);
    return isAuthority
      ? (alerteId ? NotificationTargets.authority.alerte(alerteId) : NotificationTargets.authority.alertes())
      : NotificationTargets.citizen.alerts(alerteId || undefined);
  }
  if (typeN === 'correspondance_ia') {
    if (isAuthority) {
      const rid = extra && strVal(extra.resultat_ia_id);
      if (rid) return NotificationTargets.authority.iaResult(rid);
      return NotificationTargets.authority.iaAnalysis();
    }
    const d = strVal(record.id_dossier);
    if (d) return NotificationTargets.citizen.dossier(d);
  }
  if (typeN === 'personne_retrouvee' || typeN === 'mise_a_jour_dossier') {
    const d = strVal(record.id_dossier);
    if (d) {
      return isAuthority
        ? NotificationTargets.authority.dossier(d)
        : NotificationTargets.citizen.dossier(d);
    }
  }

  const idAlerte = strVal(record.id_alerte);
  if (idAlerte) {
    return isAuthority
      ? NotificationTargets.authority.alerte(idAlerte)
      : NotificationTargets.citizen.alerts(idAlerte);
  }

  const idDossier = strVal(record.id_dossier);
  if (idDossier) {
    return isAuthority
      ? NotificationTargets.authority.dossier(idDossier)
      : NotificationTargets.citizen.dossier(idDossier);
  }

  return fallback;
}
