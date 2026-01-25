/**
 * =====================================================
 * RETROUVONSLES - LocationPermission Component
 * Component for requesting location permission
 * =====================================================
 */

import React from 'react';
import { useGeolocation } from '../hooks/useGeolocation';

export interface LocationPermissionProps {
  onPermissionGranted?: () => void;
  className?: string;
}

export const LocationPermission: React.FC<LocationPermissionProps> = ({
  onPermissionGranted,
  className = '',
}) => {
  const { permission, requestPermission } = useGeolocation();

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted && onPermissionGranted) {
      onPermissionGranted();
    }
  };

  return (
    <div className={className}>
      <h3>Location Permission</h3>
      <p>Status: <strong>{permission}</strong></p>

      {permission !== 'granted' && (
        <button
          onClick={handleRequestPermission}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Request Permission
        </button>
      )}

      {permission === 'granted' && (
        <p style={{ color: 'green' }}>✓ Location access is enabled</p>
      )}

      {permission === 'denied' && (
        <p style={{ color: 'red' }}>✗ Location access is denied. Please enable it in settings.</p>
      )}
    </div>
  );
};
