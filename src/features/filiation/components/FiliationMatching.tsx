/**
 * =====================================================
 * RETROUVONSLES - FiliationMatching Component
 * Component for finding and analyzing potential family matches
 * =====================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { FiliationMatch } from '../types';
import * as filiationService from '../services';

export interface FiliationMatchingProps {
  idPersonne: string;
  onMatchSelected?: (match: FiliationMatch) => void;
}

export const FiliationMatching: React.FC<FiliationMatchingProps> = ({
  idPersonne,
  onMatchSelected,
}) => {
  const [matches, setMatches] = useState<FiliationMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scoreFilter, setScoreFilter] = useState(60);

  const loadMatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const potentialMatches = await filiationService.findFamilyMembersByCharacteristics(
        idPersonne,
      );
      setMatches(potentialMatches as any);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [idPersonne]);

  useEffect(() => {
    loadMatches();
  }, [idPersonne, scoreFilter, loadMatches]);

  if (loading) {
    return <div style={{ padding: '16px' }}>Recherche de correspondances...</div>;
  }

  return (
    <div style={{ padding: '16px' }}>
      <h3>Correspondances potentielles</h3>

      {error && (
        <div style={{ padding: '12px', background: '#fee2e2', color: '#dc2626', borderRadius: '4px', marginBottom: '16px' }}>
          Erreur: {error}
        </div>
      )}

      <div style={{ marginBottom: '16px' }}>
        <label>Score minimum: {scoreFilter}%</label>
        <input
          type="range"
          min="0"
          max="100"
          value={scoreFilter}
          onChange={(e) => setScoreFilter(parseInt(e.target.value))}
          style={{ width: '100%', marginTop: '8px' }}
        />
      </div>

      <div>
        {matches.length === 0 ? (
          <p>Aucune correspondance trouvée</p>
        ) : (
          matches.map((match) => (
            <div
              key={match.id}
              onClick={() => onMatchSelected?.(match)}
              style={{
                padding: '12px',
                margin: '8px 0',
                background: '#f3f4f6',
                borderRadius: '4px',
                cursor: 'pointer',
                border: '1px solid #d1d5db',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>Potentiel lien familial</div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    {match.typeMatch.join(', ')}
                  </div>
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#3b82f6' }}>
                  {match.scoreCompatibilite}%
                </div>
              </div>
              {match.caracteristiquesCommunes.length > 0 && (
                <div style={{ marginTop: '8px', fontSize: '14px' }}>
                  <strong>Caractéristiques communes:</strong> {match.caracteristiquesCommunes.join(', ')}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FiliationMatching;
