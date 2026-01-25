import React from 'react';
import { useSelector } from 'react-redux';
import { selectStatistics, selectStatisticsLoading } from '../store/dossierSelectors';

export const DossierStatistics: React.FC = () => {
  const statistics = useSelector(selectStatistics);
  const isLoading = useSelector(selectStatisticsLoading);

  if (isLoading) return <div>Chargement...</div>;
  if (!statistics) return <div>Aucune statistique</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', padding: '16px' }}>
      <div style={{ background: '#f3f4f6', padding: '16px', borderRadius: '8px' }}>
        <label>Total:</label>
        <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{statistics.total_dossiers}</p>
      </div>
      <div style={{ background: '#f3f4f6', padding: '16px', borderRadius: '8px' }}>
        <label>Résolus:</label>
        <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{statistics.dossiers_resolus}</p>
      </div>
      <div style={{ background: '#f3f4f6', padding: '16px', borderRadius: '8px' }}>
        <label>En cours:</label>
        <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{statistics.dossiers_en_cours}</p>
      </div>
      <div style={{ background: '#f3f4f6', padding: '16px', borderRadius: '8px' }}>
        <label>Taux de résolution:</label>
        <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{statistics.taux_resolution.toFixed(1)}%</p>
      </div>
    </div>
  );
};
