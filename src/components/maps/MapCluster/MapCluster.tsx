import React, { useState, useMemo } from 'react';
import styles from './MapCluster.module.css';

export interface MapClusterPoint {
  id: string;
  lat: number;
  lng: number;
  label: string;
  data?: Record<string, any>;
}

export interface MapClusterProps {
  points: MapClusterPoint[];
  maxZoom?: number;
  clusterRadius?: number;
  onClusterClick?: (cluster: MapClusterData) => void;
  onPointClick?: (point: MapClusterPoint) => void;
}

export interface MapClusterData {
  id: string;
  lat: number;
  lng: number;
  count: number;
  points: MapClusterPoint[];
}

/**
 * MapCluster component for grouping nearby map markers
 */
export const MapCluster: React.FC<MapClusterProps> = ({
  points,
  maxZoom = 12,
  clusterRadius = 80,
  onClusterClick,
  onPointClick,
}) => {
  const [selectedCluster, setSelectedCluster] = useState<MapClusterData | null>(null);
  const [zoom, setZoom] = useState(6);

  const clusters = useMemo(() => {
    if (zoom >= maxZoom) {
      // Return individual points as clusters with count 1
      return points.map((point, idx) => ({
        id: point.id,
        lat: point.lat,
        lng: point.lng,
        count: 1,
        points: [point],
      }));
    }

    const clustered: MapClusterData[] = [];
    const processed = new Set<string>();

    points.forEach((point) => {
      if (processed.has(point.id)) return;

      const cluster: MapClusterData = {
        id: point.id,
        lat: point.lat,
        lng: point.lng,
        count: 1,
        points: [point],
      };

      points.forEach((other) => {
        if (processed.has(other.id) || other.id === point.id) return;

        const distance = Math.sqrt(
          Math.pow(point.lat - other.lat, 2) +
            Math.pow(point.lng - other.lng, 2)
        );

        if (distance < clusterRadius / 111) {
          cluster.count++;
          cluster.points.push(other);
          processed.add(other.id);
        }
      });

      processed.add(point.id);
      clustered.push(cluster);
    });

    return clustered;
  }, [points, zoom, maxZoom, clusterRadius]);

  const handleClusterClick = (cluster: MapClusterData) => {
    setSelectedCluster(cluster);
    onClusterClick?.(cluster);
  };

  return (
    <div className={styles.mapCluster}>
      <div className={styles.mapContainer}>
        {/* Map placeholder */}
        <div className={styles.map}>
          {clusters.map((cluster) => (
            <div
              key={cluster.id}
              className={`${styles.marker} ${
                selectedCluster?.id === cluster.id ? styles.selected : ''
              }`}
              style={{
                left: `${((cluster.lng + 180) / 360) * 100}%`,
                top: `${((90 - cluster.lat) / 180) * 100}%`,
              }}
              onClick={() => handleClusterClick(cluster)}
            >
              {cluster.count > 1 && (
                <div className={styles.clusterBadge}>{cluster.count}</div>
              )}
              {cluster.points.length === 1 && (
                <span className={styles.tooltip}>
                  {cluster.points[0].label}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedCluster && (
        <div className={styles.details}>
          <div className={styles.detailsHeader}>
            <h4>
              {selectedCluster.count > 1 ? 'Cluster' : 'Marker'} Details
            </h4>
            <button
              className={styles.closeBtn}
              onClick={() => setSelectedCluster(null)}
            >
              ×
            </button>
          </div>
          <div className={styles.detailsList}>
            {selectedCluster.points.map((point) => (
              <div
                key={point.id}
                className={styles.detailItem}
                onClick={() => onPointClick?.(point)}
              >
                {point.label}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.controls}>
        <button
          onClick={() => setZoom(Math.max(1, zoom - 1))}
          className={styles.button}
        >
          −
        </button>
        <span className={styles.zoomLevel}>Zoom: {zoom}</span>
        <button
          onClick={() => setZoom(Math.min(18, zoom + 1))}
          className={styles.button}
        >
          +
        </button>
      </div>
    </div>
  );
};
