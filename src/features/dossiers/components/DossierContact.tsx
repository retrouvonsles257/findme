import React from 'react';
import type { DossierDisplayData } from '../types';

export interface DossierContactProps {
  dossier: DossierDisplayData;
}

export const DossierContact: React.FC<DossierContactProps> = ({ dossier }) => (
  <div style={{ padding: '16px' }}>
    <h3>Contacts</h3>
    {dossier.telephone_contact && <p><strong>Tél:</strong> {dossier.telephone_contact}</p>}
    {dossier.email_contact && <p><strong>Email:</strong> {dossier.email_contact}</p>}
  </div>
);
