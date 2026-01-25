/**
 * =====================================================
 * RETROUVONSLES - StatsFilters Component
 * Filter controls for statistics
 * =====================================================
 */

import React, { useState } from 'react';
import type { StatFilterProps } from '../types';

export const StatsFilters: React.FC<StatFilterProps> = ({
  onFilterChange,
  initialFilter = {},
}) => {
  const [debut, setDebut] = useState(initialFilter.date_debut || '');
  const [fin, setFin] = useState(initialFilter.date_fin || '');
  const [region, setRegion] = useState(initialFilter.region || '');

  const handleApply = () => {
    onFilterChange({
      date_debut: debut,
      date_fin: fin,
      region: region || undefined,
    });
  };

  return (
    <div style={{
      padding: '16px',
      backgroundColor: '#f5f5f5',
      borderRadius: '6px',
      marginBottom: '16px',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '12px',
    }}>
      <div>
        <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
          Date début
        </label>
        <input
          type="date"
          value={debut}
          onChange={(e) => setDebut(e.target.value)}
          style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }}
        />
      </div>
      
      <div>
        <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
          Date fin
        </label>
        <input
          type="date"
          value={fin}
          onChange={(e) => setFin(e.target.value)}
          style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }}
        />
      </div>
      
      <div>
        <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
          Région
        </label>
        <input
          type="text"
          placeholder="Région..."
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          style={{ width: '100%', padding: '6px', boxSizing: 'border-box' }}
        />
      </div>
      
      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
        <button
          onClick={handleApply}
          style={{
            width: '100%',
            padding: '6px',
            backgroundColor: '#0056b3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Appliquer
        </button>
      </div>
    </div>
  );
};