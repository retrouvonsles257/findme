/**
 * =====================================================
 * UserStats Component
 * =====================================================
 */

import React, { useEffect } from 'react';
import type { UserStatsProps } from '../types';
import { useUserProfile } from '../hooks';
import { getUserActivitySummary, formatContributionScore } from '../services';

export const UserStats: React.FC<UserStatsProps> = ({ userId }) => {
  const { stats, fetchStats } = useUserProfile();

  useEffect(() => {
    if (userId) {
      fetchStats(userId);
    }
  }, [userId, fetchStats]);

  if (!stats) {
    return (
      <div
        style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          color: '#666',
        }}
      >
        Aucune statistique disponible
      </div>
    );
  }

  const statGridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px',
    marginTop: '16px',
  };

  const statCardStyles: React.CSSProperties = {
    padding: '16px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    textAlign: 'center',
    borderLeft: '4px solid #0056b3',
  };

  const statValueStyles: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#0056b3',
    margin: '0 0 4px 0',
  };

  const statLabelStyles: React.CSSProperties = {
    fontSize: '12px',
    color: '#666',
    fontWeight: '500',
    textTransform: 'uppercase',
    margin: 0,
  };

  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: '16px', fontWeight: 600 }}>
        Statistiques de contribution
      </h3>

      <div style={statGridStyles}>
        <div style={statCardStyles}>
          <p style={statValueStyles}>{stats.nombre_signalements}</p>
          <p style={statLabelStyles}>Signalements</p>
        </div>

        <div style={statCardStyles}>
          <p style={statValueStyles}>{stats.nombre_dossiers_crees}</p>
          <p style={statLabelStyles}>Dossiers</p>
        </div>

        <div style={statCardStyles}>
          <p style={statValueStyles}>{stats.nombre_verifications}</p>
          <p style={statLabelStyles}>Vérifications</p>
        </div>

        <div style={statCardStyles}>
          <p style={statValueStyles}>{stats.nombre_cas_resolus}</p>
          <p style={statLabelStyles}>Résolus</p>
        </div>

        <div style={statCardStyles}>
          <p style={statValueStyles}>{Math.round(stats.taux_resolution)}%</p>
          <p style={statLabelStyles}>Taux résolution</p>
        </div>

        <div style={statCardStyles}>
          <p style={statValueStyles}>{stats.score_contribution}</p>
          <p style={statLabelStyles}>Score</p>
        </div>
      </div>

      <div
        style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#f9f9f9',
          borderRadius: '4px',
          fontSize: '14px',
          color: '#666',
        }}
      >
        <strong>Contribution:</strong> {getUserActivitySummary(stats)}
      </div>

      <div
        style={{
          marginTop: '12px',
          padding: '12px',
          backgroundColor: '#f9f9f9',
          borderRadius: '4px',
          fontSize: '14px',
          color: '#666',
        }}
      >
        <strong>Réputation:</strong> {formatContributionScore(stats.score_contribution)}
      </div>
    </div>
  );
};
