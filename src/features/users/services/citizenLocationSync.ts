/**
 * Synchronise la position GPS du navigateur vers `utilisateur.latitude_actuelle` / `longitude_actuelle`
 * pour que `diffuserAlerte` puisse filtrer par rayon (même logique que les alertes à centre géographique).
 */
import { supabase } from '../../../config';

const lastSyncMsByUser = new Map<string, number>();
const DEBOUNCE_MS = 35000;

export async function setCitizenGeolocationConsent(userId: string, enabled: boolean): Promise<void> {
  try {
    const { data: row } = await (supabase as any)
      .from('utilisateur')
      .select('preferences_notification')
      .eq('id', userId)
      .maybeSingle();
    const prefs = ((row as any)?.preferences_notification || {}) as Record<string, unknown>;

    await (supabase as any)
      .from('utilisateur')
      .update({
        accepte_geolocalisation: enabled,
        preferences_notification: {
          ...prefs,
          partager_position: enabled,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
  } catch {
    // La synchro GPS tentera quand meme la RPC ; les logs restent non bloquants cote onboarding.
  }
}

export async function syncCitizenGpsAfterPermissionGrant(
  userId: string,
  latitude: number,
  longitude: number,
): Promise<{ synced: boolean; reason?: string }> {
  await setCitizenGeolocationConsent(userId, true);
  return maybeSyncCitizenGpsToProfile(userId, latitude, longitude);
}

/**
 * Même logique que {@link maybeSyncCitizenGpsToProfile} avec anti-spam (une maj / ~35 s / utilisateur).
 */
export async function maybeSyncCitizenGpsToProfileDebounced(
  userId: string,
  latitude: number,
  longitude: number,
): Promise<{ synced: boolean; reason?: string }> {
  const now = Date.now();
  const last = lastSyncMsByUser.get(userId) || 0;
  if (now - last < DEBOUNCE_MS) {
    return { synced: false, reason: 'debounced' };
  }
  lastSyncMsByUser.set(userId, now);
  return maybeSyncCitizenGpsToProfile(userId, latitude, longitude);
}

export async function maybeSyncCitizenGpsToProfile(
  userId: string,
  latitude: number,
  longitude: number,
): Promise<{ synced: boolean; reason?: string }> {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { synced: false, reason: 'coords_invalides' };
  }

  try {
    const { data: row, error: selErr } = await (supabase as any)
      .from('utilisateur')
      .select('accepte_geolocalisation, preferences_notification')
      .eq('id', userId)
      .maybeSingle();

    if (selErr) {
      return { synced: false, reason: 'select_error' };
    }
    if (!row) return { synced: false, reason: 'no_row' };

    const prefs = (row.preferences_notification || {}) as Record<string, unknown>;
    if (prefs.partager_position === false) {
      return { synced: false, reason: 'partager_position_desactive' };
    }

    // Comptes inscrits : accepte_geolocalisation=FALSE par défaut en base — le client envoie
    // des coords uniquement si le navigateur a accordé la géoloc (RPC active aussi le flag).
    if (!row.accepte_geolocalisation) {
      await setCitizenGeolocationConsent(userId, true);
    }

    const { error: upErr } = await (supabase as any).rpc('maj_position_citoyen', {
      p_lat: latitude,
      p_lng: longitude,
    });

    if (upErr) {
      return { synced: false, reason: 'update_error' };
    }

    return { synced: true };
  } catch (e: any) {
    return { synced: false, reason: 'exception' };
  }
}
