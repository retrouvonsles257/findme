/**
 * Admin Organisation - Détail alerte (héritage Autorité)
 * Réutilise AlerteDetailPage avec layout Admin et basePath /admin.
 */
import React from 'react';
import { AdminOrganisationLayout } from './AdminOrganisationLayout';
import { AlerteDetailPage } from '../authority/AlerteDetailPage';
import { useI18n } from '../../hooks';

export const AdminOrganisationAlerteDetailPage: React.FC = () => {
  const { t } = useI18n();
  return (
    <AdminOrganisationLayout title={t('admin.alertes')} activeNav="alertes">
      <AlerteDetailPage noLayout basePath="/admin" />
    </AdminOrganisationLayout>
  );
};

export default AdminOrganisationAlerteDetailPage;
