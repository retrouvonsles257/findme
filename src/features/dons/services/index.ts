/**
 * =====================================================
 * RETROUVONSLES - Services Index
 * Exports centralisés pour les services dons
 * =====================================================
 */

// NOTE:
// `donAPI` et `donService` exportent certains helpers avec les mêmes noms
// (ex: `getDonByReferenceTransaction`). On évite les `export *` multiples
// qui créent des ambiguïtés TS2308.

// Service niveau "métier" (préféré côté UI)
export * from './donService';

// Service bas niveau (DB) : export explicite (sans conflit)
export {
  createDon,
  getDonById,
  getDons,
  updateDon,
  deleteDon,
  updateDonPaymentStatus,
  markDonAsThanked,
  generateDonReceipt,
  getDonStatistics,
  getRecentDons,
  getDonationHistory,
  countSuccessfulDons,
  getTotalDonationsAmount,
  // on n'exporte pas `getDonByReferenceTransaction` ici (déjà exposé via donService)
} from './donAPI';
export * from './paymentService';

// Réexporter les types
export type {
  DonCreateInput,
  DonUpdateInput,
  DonFilters,
  DonStats,
} from './donAPI';

export type {
  DonFormData,
  DonDisplayData,
  DonValidationErrors,
} from './donService';

export type {
  PaymentInitiation,
  PaymentVerification,
  PaymentResult,
} from './paymentService';
