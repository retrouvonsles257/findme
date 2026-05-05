const STORAGE_KEY = 'retrouvonsles_anon_signin_last_ok_ms';
/** Délai minimal entre deux connexions anonymes réussies (même onglet). */
const MIN_INTERVAL_MS = 45_000;

export function getAnonymousSignInCooldownRemainingMs(): number {
  try {
    const last = sessionStorage.getItem(STORAGE_KEY);
    if (!last) return 0;
    const elapsed = Date.now() - Number(last);
    return Math.max(0, MIN_INTERVAL_MS - elapsed);
  } catch {
    return 0;
  }
}

export function canAttemptAnonymousSignIn(): { ok: boolean; retryAfterMs: number } {
  const remaining = getAnonymousSignInCooldownRemainingMs();
  if (remaining > 0) {
    return { ok: false, retryAfterMs: remaining };
  }
  return { ok: true, retryAfterMs: 0 };
}

/** À appeler uniquement après une connexion anonyme réussie. */
export function markAnonymousSignInSuccess(): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}
