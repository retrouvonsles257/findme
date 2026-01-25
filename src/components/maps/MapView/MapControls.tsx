import React from 'react';
import styles from './MapView.module.css';

export interface MapControlsProps {
  zoom: number;
  onZoomChange?: (zoom: number) => void;
  markerCount?: number;
}

/**
 * MapControls component - zoom and view controls
 */
export const MapControls: React.FC<MapControlsProps> = ({
  zoom,
  onZoomChange,
  markerCount = 0,
}) => {
  const handleZoom = (delta: number) => {
    const newZoom = Math.max(1, Math.min(18, zoom + delta));
    onZoomChange?.(newZoom);
  };

  return (
    <div className={styles.controls}>
      <div className={styles.controlGroup}>
        <button
          className={styles.controlButton}
          onClick={() => handleZoom(1)}
          title="Zoom in"
        >
          +
        </button>
        <div className={styles.zoomLevel}>{zoom}</div>
        <button
          className={styles.controlButton}
          onClick={() => handleZoom(-1)}
          title="Zoom out"
        >
          −
        </button>
      </div>

      <div className={styles.controlInfo}>
        <span>{markerCount} markers</span>
      </div>
    </div>
  );
};
