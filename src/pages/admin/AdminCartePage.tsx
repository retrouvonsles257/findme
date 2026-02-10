/**
 * Admin Organisation - Carte (héritage Autorité)
 * Réutilise MapViewPage Authority avec layout Admin, données filtrées par organisation.
 */
import React from 'react';
import { AdminOrganisationLayout } from './AdminOrganisationLayout';
import { MapViewPage } from '../authority/MapViewPage';
import { useI18n } from '../../hooks';

export const AdminOrganisationCartePage: React.FC = () => {
  const { t } = useI18n();
  return (
    <AdminOrganisationLayout title={t('admin.carte')} activeNav="carte">
      <MapViewPage noLayout />
    </AdminOrganisationLayout>
  );
};

export default AdminOrganisationCartePage;
