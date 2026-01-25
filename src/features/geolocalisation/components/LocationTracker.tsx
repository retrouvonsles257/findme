/**
 * =====================================================
 * RETROUVONSLES - LocationTracker Component
 * Component for tracking and managing locations
 * =====================================================
 */

import React, { useEffect } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';
import styles from './LocationTracker.module.css';

export interface LocationTrackerProps {
  onLocationChange?: (lat: number, lng: number) => void;
  autoStart?: boolean;
  className?: string;
}

export const LocationTracker: React.FC<LocationTrackerProps> = ({
  onLocationChange,
  autoStart = false,
  className = '',
}) => {
  const {
    currentLocation,
    isTracking,
    error,
    startTracking,
    stopTracking,
    permission,
    requestPermission,
  } = useGeolocation(autoStart);

  useEffect(() => {
    if (currentLocation && onLocationChange) {
      onLocationChange(currentLocation.latitude, currentLocation.longitude);
    }
  }, [currentLocation, onLocationChange]);

  const handleStartTracking = async () => {
    if (permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) {
        return;
      }
    }
    startTracking();
  };

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.header}>
        <h3>Location Tracking</h3>
        <div className={styles.status}>
          {isTracking && <span className={styles.statusActive}>● Tracking Active</span>}
          {!isTracking && <span className={styles.statusInactive}>○ Not Tracking</span>}
        </div>
      </div>

      {error && (
        <div className={styles.error}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {currentLocation && (
        <div className={styles.locationInfo}>
          <div className={styles.coord}>
            <span className={styles.label}>Latitude:</span>
            <span className={styles.value}>{currentLocation.latitude.toFixed(6)}</span>
          </div>
          <div className={styles.coord}>
            <span className={styles.label}>Longitude:</span>
            <span className={styles.value}>{currentLocation.longitude.toFixed(6)}</span>
          </div>
          <div className={styles.coord}>
            <span className={styles.label}>Accuracy:</span>
            <span className={styles.value}>{currentLocation.accuracy.toFixed(2)}m</span>
          </div>
          {currentLocation.altitude && (
            <div className={styles.coord}>
              <span className={styles.label}>Altitude:</span>
              <span className={styles.value}>{currentLocation.altitude.toFixed(2)}m</span>
            </div>
          )}
        </div>
      )}

      {!currentLocation && !isTracking && (
        <div className={styles.noData}>
          <p>No location data yet</p>
          <p className={styles.permissionStatus}>Permission: {permission}</p>
        </div>
      )}

      <div className={styles.controls}>
        {!isTracking ? (
          <button className={styles.btnStart} onClick={handleStartTracking}>
            Start Tracking
          </button>
        ) : (
          <button className={styles.btnStop} onClick={stopTracking}>
            Stop Tracking
          </button>
        )}
      </div>
    </div>
  );
};
