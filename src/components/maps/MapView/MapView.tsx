import React, { useState, useMemo } from 'react';
import styles from './MapView.module.css';
import { MapViewContainer } from './MapViewContainer';
import { MapControls } from './MapControls';
import { MapLegend } from './MapLegend';

export interface MapViewMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
  type: 'missing' | 'sighting' | 'organization' | 'alert';
  image?: string;
  data?: Record<string, any>;
}

export interface MapViewProps {
  markers: MapViewMarker[];
  center?: [number, number];
  zoom?: number;
  onMarkerClick?: (marker: MapViewMarker) => void;
  onMapClick?: (lat: number, lng: number) => void;
  showLegend?: boolean;
  showSearch?: boolean;
  height?: string;
  layers?: ('missing' | 'sighting' | 'organization' | 'alert')[];
}

/**
 * MapView component for displaying interactive map with markers
 */
export const MapView: React.FC<MapViewProps> = ({
  markers,
  center = [3.848, 11.5021],
  zoom = 6,
  onMarkerClick,
  onMapClick,
  showLegend = true,
  showSearch = true,
  height = '500px',
  layers = ['missing', 'sighting', 'organization', 'alert'],
}) => {
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [visibleLayers, setVisibleLayers] = useState(layers);

  const filteredMarkers = useMemo(() => {
    return markers.filter((m) => visibleLayers.includes(m.type));
  }, [markers, visibleLayers]);

  const toggleLayer = (layer: string) => {
    setVisibleLayers((prev) =>
      prev.includes(layer as any)
        ? prev.filter((l) => l !== layer)
        : [...prev, layer as any]
    );
  };

  return (
    <div className={styles.mapView}>
      <MapViewContainer
        markers={filteredMarkers}
        center={center}
        zoom={currentZoom}
        height={height}
        onMarkerClick={onMarkerClick}
        onMapClick={onMapClick}
      />

      <MapControls
        zoom={currentZoom}
        onZoomChange={setCurrentZoom}
        markerCount={filteredMarkers.length}
      />

      {showLegend && (
        <MapLegend
          visibleLayers={visibleLayers}
          onLayerToggle={toggleLayer}
        />
      )}
    </div>
  );
};
