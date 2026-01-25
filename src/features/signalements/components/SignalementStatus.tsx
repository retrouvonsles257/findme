/**
 * =====================================================
 * RETROUVONSLES - SignalementStatus Component
 * Status display component
 * =====================================================
 */

import React from 'react';
import { getEtatLabel, getEtatColor } from '../services/signalementService';

export interface SignalementStatusProps {
  etat: string;
  score?: number;
}

export const SignalementStatus: React.FC<SignalementStatusProps> = ({ etat, score }) => {
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <div
        style={{
          padding: '6px 12px',
          backgroundColor: getEtatColor(etat),
          color: 'white',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '600',
        }}
      >
        {getEtatLabel(etat)}
      </div>
      {score !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              width: '60px',
              height: '8px',
              backgroundColor: '#ddd',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${score * 100}%`,
                backgroundColor: score > 0.7 ? '#10b981' : score > 0.4 ? '#f59e0b' : '#ef4444',
              }}
            />
          </div>
          <span style={{ fontSize: '12px', color: '#666' }}>
            {(score * 100).toFixed(0)}%
          </span>
        </div>
      )}
    </div>
  );
};
