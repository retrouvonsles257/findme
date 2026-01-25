/**
 * =====================================================
 * RETROUVONSLES - Types pour les Cartes
 * =====================================================
 */

export type Location = {
  latitude: number;
  longitude: number;
};

export type MapMarker = {
  id: string;
  location: Location;
  title: string;
};
