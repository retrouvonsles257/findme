import React from 'react';
import type { DossierDisplayData } from '../types';

export interface DossierCircumstancesProps {
  dossier: DossierDisplayData;
}

export const DossierCircumstances: React.FC<DossierCircumstancesProps> = ({ dossier }) => (
  <div style={{ padding: '16px' }}>
    <h3>Circonstances</h3>
    <p>{dossier.circonstances}</p>
  </div>
);
