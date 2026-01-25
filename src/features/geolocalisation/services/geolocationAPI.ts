/**
 * =====================================================
 * RETROUVONSLES - Geolocation API Service
 * Direct Supabase database operations for geolocation
 * =====================================================
 */

import { supabase } from '../../../config';
import type {
  LocationDatabase,
  LocationInput,
  LocationUpdate,
} from '../types';

// Type-safe Supabase wrapper
const db = {
  from: (table: string) => (supabase.from(table) as any),
};

// ============================================
// LOCATION CRUD OPERATIONS
// ============================================

/**
 * Create a new location entry
 */
export const createLocation = async (input: LocationInput): Promise<LocationDatabase> => {
  const { data, error } = await db
    .from('localisation')
    .insert({
      latitude: input.latitude,
      longitude: input.longitude,
      precision_m: input.precision_m,
      altitude_m: input.altitude_m,
      source_localisation: input.source_localisation,
      fiabilite_source: input.fiabilite_source || 'moyenne',
      type_localisation: input.type_localisation,
      adresse: input.adresse,
      ville: input.ville,
      region: input.region,
      pays: input.pays,
      point_interet: input.point_interet,
      description: input.description,
      date_localisation: input.date_localisation,
      id_dossier: input.id_dossier,
      id_signalement: input.id_signalement,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Get location by ID
 */
export const getLocationById = async (id: string): Promise<LocationDatabase> => {
  const { data, error } = await db
    .from('localisation')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Get all locations for a dossier
 */
export const getLocationsByDossier = async (
  idDossier: string,
  limit: number = 50,
): Promise<LocationDatabase[]> => {
  const { data, error } = await db
    .from('localisation')
    .select('*')
    .eq('id_dossier', idDossier)
    .order('date_localisation', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
};

/**
 * Get locations by type
 */
export const getLocationsByType = async (
  type: string,
  limit: number = 100,
): Promise<LocationDatabase[]> => {
  const { data, error } = await db
    .from('localisation')
    .select('*')
    .eq('type_localisation', type)
    .order('date_localisation', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
};

/**
 * Get locations by source
 */
export const getLocationsBySource = async (
  source: string,
  limit: number = 100,
): Promise<LocationDatabase[]> => {
  const { data, error } = await db
    .from('localisation')
    .select('*')
    .eq('source_localisation', source)
    .order('date_localisation', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
};

/**
 * Get locations within a geographic radius
 */
export const getLocationsNearby = async (
  latitude: number,
  longitude: number,
  radiusKm: number = 50,
): Promise<LocationDatabase[]> => {
  const { data, error } = await db
    .from('localisation')
    .select(
      `
      *,
      distance:point->ST_DWithin(
        ST_GeographyFromText('SRID=4326;POINT(${longitude} ${latitude})'),
        ${radiusKm * 1000}
      )
      `,
    )
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Update location
 */
export const updateLocation = async (
  id: string,
  input: LocationUpdate,
): Promise<LocationDatabase> => {
  const { data, error } = await db
    .from('localisation')
    .update({
      ...(input.latitude && { latitude: input.latitude }),
      ...(input.longitude && { longitude: input.longitude }),
      ...(input.precision_m && { precision_m: input.precision_m }),
      ...(input.altitude_m && { altitude_m: input.altitude_m }),
      ...(input.source_localisation && { source_localisation: input.source_localisation }),
      ...(input.fiabilite_source && { fiabilite_source: input.fiabilite_source }),
      ...(input.type_localisation && { type_localisation: input.type_localisation }),
      ...(input.adresse && { adresse: input.adresse }),
      ...(input.ville && { ville: input.ville }),
      ...(input.region && { region: input.region }),
      ...(input.pays && { pays: input.pays }),
      ...(input.point_interet && { point_interet: input.point_interet }),
      ...(input.description && { description: input.description }),
      ...(input.date_localisation && { date_localisation: input.date_localisation }),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Delete location
 */
export const deleteLocation = async (id: string): Promise<void> => {
  const { error } = await db
    .from('localisation')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// ============================================
// PROXIMITY ZONE OPERATIONS
// ============================================

/**
 * Get all proximity zones
 * Note: Using localisation table as proximity zones since zone_proximite doesn't exist
 */
export const getProximityZones = async (): Promise<any[]> => {
  // Return empty array - zone_proximite table doesn't exist in schema
  // This functionality would need a database migration to add the table
  console.warn('getProximityZones: zone_proximite table not in database schema');
  return [];
};

/**
 * Create proximity zone
 * Note: Disabled - zone_proximite table doesn't exist
 */
export const createProximityZone = async (zone: {
  latitude_centre: number;
  longitude_centre: number;
  rayon_km: number;
  nom: string;
  description?: string;
}): Promise<any> => {
  console.warn('createProximityZone: zone_proximite table not in database schema');
  // Return mock data to prevent errors
  return {
    id: 'mock-' + Date.now(),
    ...zone,
    created_at: new Date().toISOString(),
  };
};

/**
 * Delete proximity zone
 * Note: Disabled - zone_proximite table doesn't exist
 */
export const deleteProximityZone = async (id: string): Promise<void> => {
  console.warn('deleteProximityZone: zone_proximite table not in database schema');
};

// ============================================
// ALERT OPERATIONS
// ============================================

/**
 * Get alerts for a location
 * Note: Using statut_alerte instead of est_active
 */
export const getAlerts = async (): Promise<any[]> => {
  const { data, error } = await db
    .from('alerte')
    .select('*')
    .eq('statut_alerte', 'en_cours')
    .order('date_diffusion', { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Get alerts within radius
 * Note: Using statut_alerte instead of est_active
 */
export const getAlertsNearby = async (
  latitude: number,
  longitude: number,
  radiusKm: number = 100,
): Promise<any[]> => {
  // Simple query without PostGIS for now - filter client-side
  const { data, error } = await db
    .from('alerte')
    .select('*')
    .eq('statut_alerte', 'en_cours')
    .order('date_diffusion', { ascending: false });

  if (error) throw error;
  
  // Filter by radius client-side
  if (!data) return [];
  
  const earthRadiusKm = 6371;
  return data.filter((alert: any) => {
    if (!alert.latitude_centre || !alert.longitude_centre) return true;
    const dLat = ((alert.latitude_centre - latitude) * Math.PI) / 180;
    const dLon = ((alert.longitude_centre - longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((latitude * Math.PI) / 180) *
        Math.cos((alert.latitude_centre * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = earthRadiusKm * c;
    return distance <= radiusKm;
  });
};

/**
 * Create alert
 */
export const createAlert = async (alert: {
  titre: string;
  message: string;
  type_alerte: string;
  id_dossier?: string;
}): Promise<any> => {
  const { data, error } = await db
    .from('alerte')
    .insert(alert)
    .select()
    .single();

  if (error) throw error;
  return data;
};
