/**
 * =====================================================
 * RETROUVONSLES - StatsByType Component
 * Statistics by case type
 * =====================================================
 */

import React from 'react';
import { useStatsByType } from '../hooks';
import { formatPercentage } from '../services';

export const StatsByType: React.FC = () => {
  const { caseTypeData, isLoading } = useStatsByType();

  if (isLoading) return <div style={{ padding: '20px' }}>Chargement...</div>;

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
        Distribution par Type
      </h3>
      
      {caseTypeData.length === 0 ? (
        <div style={{ color: '#999' }}>Aucune données</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {caseTypeData.map((item) => (
            <div key={item.type} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{item.type}</span>
              <span style={{ fontWeight: 'bold' }}>
                {item.count} cas - {formatPercentage(item.rate)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};