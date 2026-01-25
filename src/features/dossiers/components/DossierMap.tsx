import React from 'react';
import type { DossierDisplayData } from '../types';

export interface DossierMapProps {
  dossier: DossierDisplayData;
}

export const DossierMap: React.FC<DossierMapProps> = ({ dossier }) => (
  <div style={{ padding: '16px', minHeight: '300px', background: '#e5e7eb', borderRadius: '8px' }}>
    <h3>Localisation</h3>
    {dossier.lieu_disparition && <p>{dossier.lieu_disparition}</p>}
  </div>
);
