/**
 * KPI modération / file (ex-dashboard modérateur), chemins navigation → `/authority/*`.
 */
import React from 'react';
import { AuthorityLayout } from '../../components/layout';
import { ModerationDashboardPage } from './moderation/DashboardPage';

export const ModerationOverviewAuthorityPage: React.FC = () => (
  <AuthorityLayout>
    <ModerationDashboardPage noLayout copyVariant="authority" />
  </AuthorityLayout>
);

export default ModerationOverviewAuthorityPage;
