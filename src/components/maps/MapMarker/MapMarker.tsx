import React, { useState } from 'react';
import styles from './MapMarker.module.css';
import { MapMarkerPopup } from './MapMarkerPopup';

export interface MapMarkerProps {
  id: string;
  lat: number;
  lng: number;
  label: string;
  type?: 'missing' | 'sighting' | 'organization' | 'alert' | 'default';
  image?: string;
  description?: string;
  data?: Record<string, any>;
  onClick?: (marker: MapMarkerProps) => void;
}

/**
 * MapMarker component for displaying individual markers on map
 */
export const MapMarker: React.FC<MapMarkerProps> = ({
  id,
  lat,
  lng,
  label,
  type = 'default',
  image,
  description,
  data,
  onClick,
}) => {
  const [showPopup, setShowPopup] = useState(false);

  const handleClick = () => {
    setShowPopup(!showPopup);
    onClick?.({ id, lat, lng, label, type, image, description, data });
  };

  const typeColors = {
    missing: '#ef4444',
    sighting: '#3b82f6',
    organization: '#8b5cf6',
    alert: '#f59e0b',
    default: '#6b7280',
  };

  return (
    <div
      className={styles.marker}
      style={{
        '--marker-color': typeColors[type],
        left: `${((lng + 180) / 360) * 100}%`,
        top: `${((90 - lat) / 180) * 100}%`,
      } as React.CSSProperties}
      onClick={handleClick}
    >
      <div className={styles.markerIcon}>
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
        </svg>
      </div>

      {showPopup && (
        <MapMarkerPopup
          label={label}
          description={description}
          image={image}
          type={type}
          data={data}
          onClose={() => setShowPopup(false)}
        />
      )}
    </div>
  );
};
