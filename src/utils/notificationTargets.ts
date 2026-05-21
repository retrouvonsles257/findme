/**
 * Chemins SPA pour les liens de notification (citoyen / autorité).
 * Source unique pour les `url_action` à l'insert et la résolution de repli.
 */

export const NotificationTargets = {
  citizen: {
    notifications: () => '/citizen/notifications',
    signalement: (id: string) => `/citizen/signalement/${id}`,
    signalements: () => '/citizen/my-signalements',
    dossier: (id: string) => `/citizen/dossier/${id}`,
    alerts: (alerteId?: string) =>
      alerteId
        ? `/citizen/alerts?alerte=${encodeURIComponent(alerteId)}`
        : '/citizen/alerts',
    preDeclaration: (id: string) => `/citizen/pre-declarations/${id}`,
    sos: () => '/citizen/sos',
    profileVerification: (demandeId: string) =>
      `/citizen/profile?verification=${encodeURIComponent(demandeId)}`,
  },
  authority: {
    notifications: () => '/authority/notifications',
    signalement: (id: string) => `/authority/signalements/${id}`,
    signalements: () => '/authority/signalements',
    dossier: (id: string) => `/authority/dossiers/${id}`,
    alerte: (id: string) => `/authority/alertes/${id}`,
    alertes: () => '/authority/alertes',
    preDeclaration: (id: string) => `/authority/pre-declarations/${id}`,
    sos: (sosId?: string) =>
      sosId
        ? `/authority/sos?focus=${encodeURIComponent(sosId)}`
        : '/authority/sos',
    iaResult: (resultId: string) =>
      `/authority/ia-analysis?resultId=${encodeURIComponent(resultId)}`,
    iaAnalysis: () => '/authority/ia-analysis',
    identityVerification: (demandeId: string) =>
      `/authority/verifications-identite?demande=${encodeURIComponent(demandeId)}`,
  },
} as const;
