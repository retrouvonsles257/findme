/**
 * =====================================================
 * RETROUVONSLES - StatsExport Component
 * Export statistics to various formats
 * =====================================================
 */

import React, { useState } from 'react';
import { useStatistiques } from '../hooks';
import type { StatsExportProps } from '../types';

export const StatsExport: React.FC<StatsExportProps> = ({
  stats,
  isLoading = false,
}) => {
  const { exportData } = useStatistiques();
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'json' | 'pdf' | 'xlsx'>('csv');

  const handleExport = () => {
    if (stats) {
      exportData(selectedFormat);
    }
  };

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
        Exporter les Statistiques
      </h3>
      
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <select
          value={selectedFormat}
          onChange={(e) => setSelectedFormat(e.target.value as any)}
          style={{
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontFamily: 'inherit',
          }}
        >
          <option value="csv">CSV</option>
          <option value="json">JSON</option>
          <option value="pdf">PDF</option>
          <option value="xlsx">Excel</option>
        </select>
        
        <button
          onClick={handleExport}
          disabled={isLoading}
          style={{
            padding: '8px 16px',
            backgroundColor: '#0056b3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {isLoading ? 'Export...' : 'Exporter'}
        </button>
      </div>
    </div>
  );
};