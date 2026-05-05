/**
 * Empêche les redirections ouvertes : n'accepte que les chemins internes /citizen/…
 */
export function safeCitizenNextPath(raw: string | null | undefined, fallback: string): string {
  if (!raw || typeof raw !== 'string') return fallback;
  let p = raw.trim();
  try {
    p = decodeURIComponent(p);
  } catch {
    return fallback;
  }
  if (!p.startsWith('/') || p.includes('://') || p.includes('..') || p.includes('\\')) {
    return fallback;
  }
  if (!p.startsWith('/citizen/')) {
    return fallback;
  }
  return p;
}
