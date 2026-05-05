/**
 * Libellés UI pour le profil « Autorité » : sous-niveaux par `autorite_echelon` (1–4),
 * sans réutiliser les anciens intitulés métier comme titres produit.
 */

export type AuthorityEchelonI18nKey =
  | 'authority.echelonFunction.1'
  | 'authority.echelonFunction.2'
  | 'authority.echelonFunction.3'
  | 'authority.echelonFunction.4'
  | 'authority.roles.autorite';

export function authorityEchelonI18nKey(echelon: number | null | undefined): AuthorityEchelonI18nKey {
  const e = echelon == null ? NaN : Number(echelon);
  if (e === 1) return 'authority.echelonFunction.1';
  if (e === 2) return 'authority.echelonFunction.2';
  if (e === 3) return 'authority.echelonFunction.3';
  if (e === 4) return 'authority.echelonFunction.4';
  return 'authority.roles.autorite';
}
