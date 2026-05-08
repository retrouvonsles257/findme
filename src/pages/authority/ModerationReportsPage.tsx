/**
 * Rapports sur les signalements (ex-écran modérateur), silo Autorité.
 */
import React from 'react';
import { AuthorityLayout } from '../../components/layout';
import { ReportsPage } from './moderation/Reportspage';

export const ModerationReportsPage: React.FC = () => (
  <AuthorityLayout>
    <ReportsPage noLayout />
  </AuthorityLayout>
);

export default ModerationReportsPage;
