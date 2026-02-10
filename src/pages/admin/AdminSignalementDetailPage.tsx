/**
 * Admin Organisation - Détail signalement (héritage Autorité)
 * Réutilise SignalementDetailPage avec layout Admin et basePath /admin.
 */
import React from 'react';
import { AdminOrganisationLayout } from './AdminOrganisationLayout';
import { SignalementDetailPage } from '../authority/SignalementDetailPage';
import { useI18n } from '../../hooks';

export const AdminOrganisationSignalementDetailPage: React.FC = () => {
  const { t } = useI18n();
  return (
    <AdminOrganisationLayout title={t('admin.signalements')} activeNav="signalements">
      <SignalementDetailPage noLayout basePath="/admin" />
    </AdminOrganisationLayout>
  );
};

export default AdminOrganisationSignalementDetailPage;
