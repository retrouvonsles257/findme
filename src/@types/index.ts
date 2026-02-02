/**
 * =====================================================
 * RETROUVONSLES - Types Index (runtime module)
 * =====================================================
 * CRA/Webpack a besoin d'un vrai module .ts pour résoudre les imports,
 * y compris `import type`.
 *
 * IMPORTANT: on exporte uniquement les symboles réellement utilisés par
 * `src/features/**` pour éviter les collisions (ex: `User`).
 */

export type {
  Json,
  Timestamp,
  UUID,
  // Tables/interfaces utilisées par les features
  Don,
  CampagneSensibilisation,
  Alerte,
} from './database.types';

export {
  // Dons
  TypeDon,
  MethodePaiement,
  StatutPaiement,
  // Alertes
  TypeAlerte,
  StatutAlerte,
  NiveauUrgence,
} from './enums.types';

