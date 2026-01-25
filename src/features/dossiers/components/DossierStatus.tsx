import React from 'react';
import type { DossierDisplayData } from '../types';
import { useDossierUpdate } from '../hooks';

export interface DossierStatusProps {
  dossier: DossierDisplayData;
  onStatusChange?: (newStatus: string) => void;
}

export const DossierStatus: React.FC<DossierStatusProps> = ({ dossier, onStatusChange }) => {
  const { updateStatus, isUpdating } = useDossierUpdate();

  const handleStatusChange = async (newStatus: string) => {
    await updateStatus(dossier.id, newStatus as any);
    onStatusChange?.(newStatus);
  };

  return (
    <div style={{ padding: '16px', background: '#f3f4f6', borderRadius: '8px' }}>
      <label>Statut:</label>
      <select value={dossier.statut_dossier} onChange={(e) => handleStatusChange(e.target.value)} disabled={isUpdating}>
        <option value="en_cours">En cours</option>
        <option value="retrouve_vivant">Retrouvé vivant</option>
        <option value="retrouve_decede">Retrouvé décédé</option>
        <option value="suspendu">Suspendu</option>
      </select>
    </div>
  );
};
