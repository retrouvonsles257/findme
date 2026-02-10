/**
 * Admin Organisation - Création alerte (héritage Autorité)
 * Réutilise CreateAlertePage avec layout Admin et basePath /admin.
 */
import React from 'react';
import { AdminOrganisationLayout } from './AdminOrganisationLayout';
import { CreateAlertePage } from '../authority/CreateAlertePage';
import { useI18n } from '../../hooks';

export const AdminOrganisationCreateAlertePage: React.FC = () => {
  const { t } = useI18n();
  return (
    <AdminOrganisationLayout title={t('admin.alertes')} activeNav="alertes">
      <CreateAlertePage noLayout basePath="/admin" />
    </AdminOrganisationLayout>
  );
};

export default AdminOrganisationCreateAlertePage;
