/**
 * Admin Organisation - Signalements (héritage Autorité)
 * Réutilise SignalementsPage Authority avec layout Admin, données filtrées par organisation.
 */
import React from 'react';
import { AdminOrganisationLayout } from './AdminOrganisationLayout';
import { SignalementsPage } from '../authority/SignalementsPage';
import { useI18n } from '../../hooks';

export const AdminOrganisationSignalementsPage: React.FC = () => {
  const { t } = useI18n();
  return (
    <AdminOrganisationLayout title={t('admin.signalements')} activeNav="signalements">
      <SignalementsPage noLayout basePath="/admin" />
    </AdminOrganisationLayout>
  );
};

export default AdminOrganisationSignalementsPage;
