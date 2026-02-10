/**
 * Admin Organisation - Alertes (héritage Autorité)
 * Réutilise AlertesPage Authority avec layout Admin, données filtrées par organisation.
 */
import React from 'react';
import { AdminOrganisationLayout } from './AdminOrganisationLayout';
import { AlertesPage } from '../authority/AlertesPage';
import { useI18n } from '../../hooks';

export const AdminOrganisationAlertesPage: React.FC = () => {
  const { t } = useI18n();
  return (
    <AdminOrganisationLayout title={t('admin.alertes')} activeNav="alertes">
      <AlertesPage noLayout basePath="/admin" />
    </AdminOrganisationLayout>
  );
};

export default AdminOrganisationAlertesPage;
