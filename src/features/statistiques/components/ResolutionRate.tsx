/**
 * =====================================================
 * RETROUVONSLES - ResolutionRate Component
 * Shows case resolution metrics and rates
 * =====================================================
 */

import React from 'react';
import { formatPercentage } from '../services';
import type { ResolutionRateProps } from '../types';

export const ResolutionRate: React.FC<ResolutionRateProps> = ({
  stats,
  isLoading = false,
}) => {
  if (isLoading) return <div style={{ padding: '20px' }}>Chargement...</div>;
  if (!stats) return null;

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
        Taux de Résolution
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#0056b3' }}>
            {formatPercentage(stats.taux_resolution_global)}
          </div>
          <div style={{ fontSize: '12px', color: '#999' }}>Taux Global</div>
        </div>
        
        <div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#28a745' }}>
            {stats.personnes_retrouvees}
          </div>
          <div style={{ fontSize: '12px', color: '#999' }}>Retrouvées</div>
        </div>
        
        <div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#dc3545' }}>
            {stats.personnes_decedees}
          </div>
          <div style={{ fontSize: '12px', color: '#999' }}>Décédées</div>
        </div>
        
        <div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ffc107' }}>
            {stats.cas_en_cours}
          </div>
          <div style={{ fontSize: '12px', color: '#999' }}>En Cours</div>
        </div>
      </div>
    </div>
  );
};