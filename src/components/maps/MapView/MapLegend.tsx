import React from 'react';
import styles from './MapView.module.css';

export interface MapLegendProps {
  visibleLayers: string[];
  onLayerToggle?: (layer: string) => void;
}

/**
 * MapLegend component - shows available layers and their colors
 */
export const MapLegend: React.FC<MapLegendProps> = ({
  visibleLayers,
  onLayerToggle,
}) => {
  const layers = [
    { id: 'missing', label: 'Missing Persons', color: '#ef4444' },
    { id: 'sighting', label: 'Sightings', color: '#3b82f6' },
    { id: 'organization', label: 'Organizations', color: '#8b5cf6' },
    { id: 'alert', label: 'Alerts', color: '#f59e0b' },
  ];

  return (
    <div className={styles.legend}>
      <h4 className={styles.legendTitle}>Layers</h4>
      <div className={styles.legendItems}>
        {layers.map((layer) => (
          <label key={layer.id} className={styles.legendItem}>
            <input
              type="checkbox"
              checked={visibleLayers.includes(layer.id)}
              onChange={() => onLayerToggle?.(layer.id)}
              className={styles.legendCheckbox}
            />
            <span
              className={styles.legendColor}
              style={{ backgroundColor: layer.color }}
            />
            <span className={styles.legendLabel}>{layer.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
};
