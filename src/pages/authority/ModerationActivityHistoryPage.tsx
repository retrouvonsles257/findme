/**
 * Historique d'activité (ex-modérateur), silo Autorité.
 */
import React from 'react';
import { AuthorityLayout } from '../../components/layout';
import { ActivityHistoryPage } from './moderation/ActivityHistoryPage';

export const ModerationActivityHistoryPage: React.FC = () => (
  <AuthorityLayout>
    <ActivityHistoryPage noLayout />
  </AuthorityLayout>
);

export default ModerationActivityHistoryPage;
