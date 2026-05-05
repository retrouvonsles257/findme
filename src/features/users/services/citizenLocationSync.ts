/**
 * Synchronise la position GPS du navigateur vers `utilisateur.latitude_actuelle` / `longitude_actuelle`
 * pour que `diffuserAlerte` puisse filtrer par rayon (même logique que les alertes à centre géographique).
 */
import { supabase } from '../../../config';

const LOG = '[CitizenLocationSync]';

const lastSyncMsByUser = new Map<string, number>();
const DEBOUNCE_MS = 35000;

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
      console.warn(LOG, 'select_fail', selErr.message);
      return { synced: false, reason: 'select_error' };
    }
    if (!row) return { synced: false, reason: 'no_row' };

    if (!row.accepte_geolocalisation) {
      return { synced: false, reason: 'geolocalisation_desactivee' };
    }

    const prefs = (row.preferences_notification || {}) as Record<string, unknown>;
    if (prefs.partager_position === false) {
      return { synced: false, reason: 'partager_position_desactive' };
    }

    const { error: upErr } = await (supabase as any).rpc('maj_position_citoyen', {
      p_lat: latitude,
      p_lng: longitude,
    });

    if (upErr) {
      console.warn(LOG, 'rpc_maj_position_fail', upErr.message, upErr.code);
      return { synced: false, reason: 'update_error' };
    }

    console.info(LOG, 'sync_ok', {
      userId: String(userId).slice(0, 8) + '…',
      lat: latitude.toFixed(5),
      lng: longitude.toFixed(5),
    });
    return { synced: true };
  } catch (e: any) {
    console.warn(LOG, 'exception', e?.message || e);
    return { synced: false, reason: 'exception' };
  }
}
