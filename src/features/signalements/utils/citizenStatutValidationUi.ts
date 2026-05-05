/**
 * Affichage citoyen des statuts signalement — aligné sur `statut_validation` (étape E).
 */

export type CitizenSignalementFilterBucket = 'all' | 'pending' | 'approved' | 'rejected';

/** Valeur DB brute (priorité `statut_validation`, sinon `etat` legacy). */
export function getRawStatut(sig: { statut_validation?: string | null; etat?: string | null } | null | undefined): string {
  return String(sig?.statut_validation || sig?.etat || 'en_attente').toLowerCase();
}

export type CitizenStatutPhase = 'queue' | 'review' | 'ok' | 'nok' | 'other';

export function getStatutPhase(raw: string): CitizenStatutPhase {
  switch (raw) {
    case 'en_attente':
    case 'nouveau':
      return 'queue';
    case 'en_verification':
    case 'en_cours':
      return 'review';
    case 'valide':
      return 'ok';
    case 'invalide':
    case 'rejete':
      return 'nok';
    case 'spam':
    case 'doublonne':
      return 'other';
    default:
      return 'queue';
  }
}

/**
 * Suffixe de clé i18n sous le namespace `citizen` (ex. `signalementStatus.en_attente`).
 * Usage : `t(\`citizen.${getCitizenStatusI18nSuffix(raw)}\`)`.
 */
export function getCitizenStatusI18nSuffix(raw: string): string {
  const s = raw.toLowerCase();
  const map: Record<string, string> = {
    en_attente: 'signalementStatus.en_attente',
    nouveau: 'signalementStatus.en_attente',
    en_verification: 'signalementStatus.en_verification',
    en_cours: 'signalementStatus.en_verification',
    valide: 'signalementStatus.valide',
    invalide: 'signalementStatus.invalide',
    rejete: 'signalementStatus.invalide',
    spam: 'signalementStatus.spam',
    doublonne: 'signalementStatus.doublonne',
  };
  return map[s] || 'signalementStatus.en_attente';
}

/** Classes carte existantes + `other` pour spam / doublon. */
export function getCardStatusVisual(raw: string): 'approved' | 'pending' | 'rejected' | 'other' {
  const phase = getStatutPhase(raw);
  if (phase === 'ok') return 'approved';
  if (phase === 'nok') return 'rejected';
  if (phase === 'other') return 'other';
  return 'pending';
}

export function matchesCitizenListFilter(
  raw: string,
  filter: CitizenSignalementFilterBucket,
): boolean {
  if (filter === 'all') return true;
  const phase = getStatutPhase(raw);
  if (filter === 'approved') return phase === 'ok';
  if (filter === 'rejected') return phase === 'nok' || phase === 'other';
  if (filter === 'pending') return phase === 'queue' || phase === 'review';
  return true;
}
