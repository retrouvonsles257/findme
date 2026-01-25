import React from 'react';
import styles from './MapView.module.css';
import { MapViewMarker } from './MapView';

export interface MapViewContainerProps {
  markers: MapViewMarker[];
  center: [number, number];
  zoom: number;
  height: string;
  onMarkerClick?: (marker: MapViewMarker) => void;
  onMapClick?: (lat: number, lng: number) => void;
}

/**
 * MapViewContainer component - renders the map canvas
 */
export const MapViewContainer: React.FC<MapViewContainerProps> = ({
  markers,
  center,
  zoom,
  height,
  onMarkerClick,
  onMapClick,
}) => {
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const lng = (x / rect.width) * 360 - 180;
    const lat = 90 - (y / rect.height) * 180;

    onMapClick?.(lat, lng);
  };

  const typeColors = {
    missing: '#ef4444',
    sighting: '#3b82f6',
    organization: '#8b5cf6',
    alert: '#f59e0b',
  };

  return (
    <div
      className={styles.mapContainer}
      style={{ height }}
      onClick={handleMapClick}
    >
      <div className={styles.mapContent}>
        {/* Map background */}
        <svg
          viewBox="0 0 100 100"
          className={styles.mapBackground}
          preserveAspectRatio="none"
        >
          <rect width="100" height="100" fill="#e8f4f8" />
          <circle cx="50" cy="50" r="30" fill="#d1f0ff" opacity="0.5" />
        </svg>

        {/* Markers */}
        {markers.map((marker) => (
          <div
            key={marker.id}
            className={styles.markerWrapper}
            style={{
              left: `${((marker.lng + 180) / 360) * 100}%`,
              top: `${((90 - marker.lat) / 180) * 100}%`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onMarkerClick?.(marker);
            }}
          >
            <div
              className={styles.marker}
              style={{ '--marker-color': typeColors[marker.type] } as React.CSSProperties}
            >
              <div className={styles.markerDot} />
            </div>
          </div>
        ))}

        {/* Center indicator */}
        <div
          className={styles.centerPoint}
          style={{
            left: `${((center[1] + 180) / 360) * 100}%`,
            top: `${((90 - center[0]) / 180) * 100}%`,
          }}
        />
      </div>
    </div>
  );
};
