/**
 * =====================================================
 * RETROUVONSLES - LocationHistory Component
 * Component for viewing location history
 * =====================================================
 */

import React, { useEffect } from 'react';
import { useLocationTracking } from '../hooks/useLocationTracking';

export interface LocationHistoryProps {
  dossierId?: string;
  limit?: number;
  className?: string;
}

export const LocationHistory: React.FC<LocationHistoryProps> = ({
  dossierId,
  limit = 20,
  className = '',
}) => {
  const { locationHistory, isLoading, error, getLocationHistory, deleteLocation } =
    useLocationTracking();

  useEffect(() => {
    if (dossierId) {
      getLocationHistory(dossierId, limit);
    }
  }, [dossierId, limit, getLocationHistory]);

  const handleDelete = async (locationId: string) => {
    if (window.confirm('Are you sure you want to delete this location?')) {
      await deleteLocation(locationId);
    }
  };

  if (isLoading) {
    return <div className={className}>Loading location history...</div>;
  }

  if (error) {
    return <div className={className} style={{ color: 'red' }}>Error: {error}</div>;
  }

  return (
    <div className={className}>
      <h3>Location History</h3>

      {locationHistory.length === 0 ? (
        <p>No locations recorded yet</p>
      ) : (
        <div>
          <p>Total locations: {locationHistory.length}</p>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ccc' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Type</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Latitude</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Longitude</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>City</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Date</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {locationHistory.map((loc) => (
                <tr key={loc.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px' }}>{loc.type_localisation}</td>
                  <td style={{ padding: '8px' }}>{loc.latitude.toFixed(4)}</td>
                  <td style={{ padding: '8px' }}>{loc.longitude.toFixed(4)}</td>
                  <td style={{ padding: '8px' }}>{loc.ville || '-'}</td>
                  <td style={{ padding: '8px' }}>
                    {new Date(loc.date_localisation).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '8px' }}>
                    <button
                      onClick={() => handleDelete(loc.id)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
