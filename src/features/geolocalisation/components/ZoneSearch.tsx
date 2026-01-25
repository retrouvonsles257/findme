/**
 * =====================================================
 * RETROUVONSLES - ZoneSearch Component
 * Component for searching and filtering zones
 * =====================================================
 */

import React, { useState, useCallback } from 'react';

export interface ZoneSearchProps {
  onSearch?: (query: string) => void;
  onFilterByRadius?: (radius: number) => void;
  className?: string;
}

export const ZoneSearch: React.FC<ZoneSearchProps> = ({
  onSearch,
  onFilterByRadius,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [radius, setRadius] = useState(50);

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (onSearch) {
        onSearch(query);
      }
    },
    [onSearch],
  );

  const handleRadiusChange = useCallback(
    (value: number) => {
      setRadius(value);
      if (onFilterByRadius) {
        onFilterByRadius(value);
      }
    },
    [onFilterByRadius],
  );

  return (
    <div className={className}>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
            Search Zones
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Zone name..."
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
        </div>

        <div style={{ minWidth: '200px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
            Radius: {radius}km
          </label>
          <input
            type="range"
            min="1"
            max="500"
            value={radius}
            onChange={(e) => handleRadiusChange(parseInt(e.target.value, 10))}
            style={{ width: '100%' }}
          />
        </div>
      </div>
    </div>
  );
};
