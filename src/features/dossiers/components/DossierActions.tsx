import React from 'react';
import type { DossierDisplayData } from '../types';

export interface DossierActionsProps {
  dossier: DossierDisplayData;
}

export const DossierActions: React.FC<DossierActionsProps> = ({ dossier }) => (
  <div style={{ display: 'flex', gap: '8px', padding: '16px' }}>
    <button>Modifier</button>
    <button>Supprimer</button>
  </div>
);
