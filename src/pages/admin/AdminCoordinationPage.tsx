/**
 * Admin Organisation - Coordination (héritage Autorité)
 * Réutilise CoordinationPage Authority avec layout Admin.
 */
import React from 'react';
import { AdminOrganisationLayout } from './AdminOrganisationLayout';
import { CoordinationPage } from '../authority/CoordinationPage';
import { useI18n } from '../../hooks';

export const AdminOrganisationCoordinationPage: React.FC = () => {
  const { t } = useI18n();
  return (
    <AdminOrganisationLayout title={t('admin.coordination')} activeNav="coordination">
      <CoordinationPage noLayout />
    </AdminOrganisationLayout>
  );
};

export default AdminOrganisationCoordinationPage;
