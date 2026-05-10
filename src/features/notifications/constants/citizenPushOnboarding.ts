/**
 * Alignement avec CitizenLayout : délai avant la demande navigateur (notif / push),
 * pour laisser l’UI et le routeur se stabiliser (même clés localStorage partout).
 */
export const PUSH_NOTIFICATION_ONBOARDING_DELAY_MS = 1200;

export const CITIZEN_PERM_NOTIF_ASKED_KEY = 'citizen_perm_notif_asked_v1';
export const CITIZEN_PERM_ONBOARDING_DONE_KEY = 'citizen_perm_onboarding_done_v1';
export const CITIZEN_PERM_GEO_ASKED_KEY = 'citizen_perm_geo_asked_v1';
