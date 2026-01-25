import React, { useMemo } from 'react';
import styles from './HeatMap.module.css';
import { HeatMapLayer } from './HeatMapLayer';

export interface HeatMapProps {
  data: Array<{
    lat: number;
    lng: number;
    intensity: number;
  }>;
  center?: [number, number];
  zoom?: number;
  gradient?: string[];
  radius?: number;
  blur?: number;
  maxZoom?: number;
  minOpacity?: number;
}

/**
 * HeatMap component for visualizing data density with color intensity
 */
export const HeatMap: React.FC<HeatMapProps> = ({
  data,
  center = [3.848, 11.5021],
  zoom = 6,
  gradient = ['#0000ff', '#00ffff', '#00ff00', '#ffff00', '#ff0000'],
  radius = 25,
  blur = 15,
  maxZoom = 18,
  minOpacity = 0.5,
}) => {
  const processedData = useMemo(() => {
    return data.map(point => ({
      lat: point.lat,
      lng: point.lng,
      intensity: point.intensity,
    }));
  }, [data]);

  const stats = useMemo(() => {
    if (!processedData.length) return { min: 0, max: 0, count: 0 };
    const intensities = processedData.map(p => p.intensity);
    return {
      min: Math.min(...intensities),
      max: Math.max(...intensities),
      count: processedData.length,
    };
  }, [processedData]);

  return (
    <div className={styles.heatMapContainer}>
      <div className={styles.heatMap}>
        <HeatMapLayer
          data={processedData}
          center={center}
          zoom={zoom}
          gradient={gradient}
          radius={radius}
          blur={blur}
          maxZoom={maxZoom}
          minOpacity={minOpacity}
        />
      </div>

      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Points:</span>
          <span className={styles.statValue}>{stats.count}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Intensity:</span>
          <span className={styles.statValue}>
            {stats.min.toFixed(1)} - {stats.max.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
};
