/**
 * =====================================================
 * RETROUVONSLES - AlerteZoneSelector Component
 * Sélection des zones géographiques de diffusion
 * =====================================================
 */

import React, { useState } from 'react';
import styles from './AlerteList.module.css';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface Zone {
  id: string;
  nom: string;
  coordonnees?: [number, number];
  population?: number;
}

export interface AlerteZoneSelectorProps {
  onZonesSelected: (zones: Zone[]) => void;
  selectedZones?: string[];
  multiSelect?: boolean;
}

// ============================================
// DEFAULT ZONES
// ============================================

const DEFAULT_ZONES: Zone[] = [
  { id: 'douala', nom: 'Douala', coordonnees: [4.0511, 9.767], population: 4000000 },
  { id: 'yaounde', nom: 'Yaoundé', coordonnees: [3.8667, 11.5167], population: 3000000 },
  { id: 'kumba', nom: 'Kumba', coordonnees: [5.628, 9.441], population: 400000 },
  { id: 'bamenda', nom: 'Bamenda', coordonnees: [5.9631, 10.1591], population: 600000 },
  { id: 'limbe', nom: 'Limbé', coordonnees: [4.016, 9.247], population: 200000 },
  { id: 'buea', nom: 'Buéa', coordonnees: [4.1542, 9.2432], population: 300000 },
];

// ============================================
// COMPONENT
// ============================================

export const AlerteZoneSelector: React.FC<AlerteZoneSelectorProps> = ({
  onZonesSelected,
  selectedZones = [],
  multiSelect = true,
}) => {
  const [selected, setSelected] = useState<string[]>(selectedZones);
  const [searchTerm, setSearchTerm] = useState('');

  // ========== HANDLERS ==========

  const handleZoneToggle = (zoneId: string) => {
    let newSelected: string[];

    if (!multiSelect) {
      newSelected = selected.includes(zoneId) ? [] : [zoneId];
    } else {
      newSelected = selected.includes(zoneId)
        ? selected.filter((id) => id !== zoneId)
        : [...selected, zoneId];
    }

    setSelected(newSelected);
    onZonesSelected(
      DEFAULT_ZONES.filter((zone) => newSelected.includes(zone.id)),
    );
  };

  const handleSelectAll = () => {
    if (selected.length === DEFAULT_ZONES.length) {
      setSelected([]);
      onZonesSelected([]);
    } else {
      setSelected(DEFAULT_ZONES.map((z) => z.id));
      onZonesSelected(DEFAULT_ZONES);
    }
  };

  const handleClear = () => {
    setSelected([]);
    setSearchTerm('');
    onZonesSelected([]);
  };

  const filteredZones = DEFAULT_ZONES.filter((zone) =>
    zone.nom.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // ========== RENDER ==========

  return (
    <div className={styles.zoneSelector}>
      <h3 className={styles.zoneSelectorTitle}>Sélectionner les zones</h3>

      {/* Search */}
      <div className={styles.zoneSearch}>
        <input
          type="text"
          placeholder="Rechercher une zone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.zoneSearchInput}
        />
      </div>

      {/* Actions */}
      <div className={styles.zoneActions}>
        <button
          onClick={handleSelectAll}
          className={styles.zoneActionButton}
        >
          {selected.length === DEFAULT_ZONES.length ? 'Désélectionner tout' : 'Sélectionner tout'}
        </button>
        {selected.length > 0 && (
          <button
            onClick={handleClear}
            className={`${styles.zoneActionButton} ${styles.secondary}`}
          >
            Effacer
          </button>
        )}
      </div>

      {/* Zones Grid */}
      <div className={styles.zonesGrid}>
        {filteredZones.map((zone) => (
          <div
            key={zone.id}
            className={`${styles.zoneCard} ${
              selected.includes(zone.id) ? styles.selected : ''
            }`}
            onClick={() => handleZoneToggle(zone.id)}
            role="checkbox"
            aria-checked={selected.includes(zone.id)}
            tabIndex={0}
          >
            <input
              type="checkbox"
              checked={selected.includes(zone.id)}
              onChange={() => handleZoneToggle(zone.id)}
              className={styles.zoneCheckbox}
            />
            <div className={styles.zoneInfo}>
              <h4 className={styles.zoneName}>{zone.nom}</h4>
              {zone.population && (
                <p className={styles.zonePopulation}>
                  👥 {(zone.population / 1000000).toFixed(1)}M habitants
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Selected Count */}
      {selected.length > 0 && (
        <div className={styles.zoneCount}>
          {selected.length} zone(s) sélectionnée(s)
        </div>
      )}
    </div>
  );
};

AlerteZoneSelector.displayName = 'AlerteZoneSelector';
