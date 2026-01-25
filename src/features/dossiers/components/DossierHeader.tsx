import React from 'react';
import type { DossierDisplayData } from '../types';

export interface DossierHeaderProps {
  dossier: DossierDisplayData;
}

export const DossierHeader: React.FC<DossierHeaderProps> = ({ dossier }) => (
  <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
    <h1>{dossier.numero_dossier}</h1>
    <p>{dossier.type_label}</p>
  </div>
);
