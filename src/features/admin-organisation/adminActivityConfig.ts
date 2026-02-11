/**
 * Config des libellés et icônes pour les activités du dashboard admin.
 * Utilisé par DashboardPage pour mapper type_action → label i18n et icône.
 */

import {
  Folder,
  FileText,
  Activity,
  CheckCircle,
  type LucideIcon,
} from 'lucide-react';

/** Clés i18n pour chaque type d'action (admin.* ou common.*) */
export const ACTIVITY_LABEL_KEYS: Record<string, string> = {
  creation_dossier: 'admin.activityDossierCreated',
  modification_dossier: 'admin.activityRapportUpdated',
  creation_signalement: 'admin.activityRapportUpdated',
  validation_signalement: 'admin.activityRapportUpdated',
  diffusion_alerte: 'admin.activityDossierCreated',
  connexion: 'admin.recentActivity',
  deconnexion: 'admin.recentActivity',
  modification_profil: 'admin.recentActivity',
  upload_photo: 'admin.activityDossierCreated',
  changement_statut: 'admin.activityPersonneFound',
  attribution_role: 'admin.recentActivity',
  autre: 'admin.recentActivity',
};

/** Icône Lucide par type d'action */
export const ACTIVITY_ICONS: Record<string, LucideIcon> = {
  creation_dossier: Folder,
  modification_dossier: FileText,
  creation_signalement: FileText,
  validation_signalement: CheckCircle,
  changement_statut: CheckCircle,
  diffusion_alerte: Folder,
};

export const DEFAULT_ACTIVITY_ICON: LucideIcon = Activity;

/**
 * Formate une date d'action en texte relatif (il y a X min/heures/jours).
 * @param dateStr - ISO date string
 * @param t - fonction i18n (key) => string
 */
export function formatActivityTime(
  dateStr: string,
  t: (key: string) => string
): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffHours < 1) {
    const mins = Math.max(1, Math.floor(diffMs / 60000));
    return t('common.time_minutes').replace('{{count}}', String(mins));
  }
  if (diffHours < 24) {
    return t('common.time_hours').replace('{{count}}', String(diffHours));
  }
  if (diffDays === 1) return t('common.time_day');
  return t('common.time_days').replace('{{count}}', String(diffDays));
}
