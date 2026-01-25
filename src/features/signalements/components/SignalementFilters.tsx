/**
 * =====================================================
 * RETROUVONSLES - SignalementFilters Component
 * Advanced filter component
 * =====================================================
 */

import React, { useState } from 'react';
import type { SignalementFilter } from '../types';

export interface SignalementFiltersProps {
  onFilter: (filter: SignalementFilter) => void;
}

export const SignalementFilters: React.FC<SignalementFiltersProps> = ({ onFilter }) => {
  const [filters, setFilters] = useState<SignalementFilter>({});

  const handleFilterChange = (key: keyof SignalementFilter, value: any) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);
    onFilter(newFilters);
  };

  return (
    <div style={{ padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px' }}>
            Search
          </label>
          <input
            type="text"
            placeholder="Description or location..."
            onChange={(e) => handleFilterChange('search', e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px' }}>
            Status
          </label>
          <select
            onChange={(e) => handleFilterChange('etat', e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          >
            <option value="">All</option>
            <option value="nouveau">New</option>
            <option value="en_cours">In Progress</option>
            <option value="valide">Validated</option>
            <option value="rejete">Rejected</option>
            <option value="ferme">Closed</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px' }}>
            Min Score
          </label>
          <input
            type="number"
            min="0"
            max="1"
            step="0.1"
            onChange={(e) => handleFilterChange('score_min', e.target.value ? parseFloat(e.target.value) : undefined)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
          />
        </div>
      </div>
    </div>
  );
};
