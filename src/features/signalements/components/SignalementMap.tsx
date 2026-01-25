/**
 * =====================================================
 * RETROUVONSLES - SignalementMap Component
 * Map display of signalements
 * =====================================================
 */

import React, { useEffect } from 'react';
import { useSignalements } from '../hooks/useSignalements';

export interface SignalementMapProps {
  onSelectSignalement?: (id: string) => void;
}

export const SignalementMap: React.FC<SignalementMapProps> = ({ onSelectSignalement }) => {
  const { signalements, isLoading, error, fetchSignalements } = useSignalements();

  useEffect(() => {
    fetchSignalements();
  }, [fetchSignalements]);

  if (isLoading) return <div style={{ padding: '20px' }}>Loading map...</div>;
  if (error) return <div style={{ color: 'red', padding: '20px' }}>Error: {error}</div>;

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px', height: '400px' }}>
      <p>Map integration would be implemented here using Mapbox or Google Maps</p>
      <p>Total signalements to display: {signalements.length}</p>
      <div style={{ marginTop: '12px' }}>
        {signalements.slice(0, 5).map((sig) => (
          <div
            key={sig.id}
            onClick={() => onSelectSignalement?.(sig.id)}
            style={{
              padding: '8px',
              margin: '4px 0',
              backgroundColor: 'white',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {sig.lieu_observation}
          </div>
        ))}
      </div>
    </div>
  );
};
