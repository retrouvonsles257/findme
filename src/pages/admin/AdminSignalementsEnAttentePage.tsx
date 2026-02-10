/**
 * Admin Organisation - Signalements en attente (héritage Opérateur)
 * Réutilise SignalementsEnAttentePage (operator) avec layout Admin.
 */
import React from 'react';
import { AdminOrganisationLayout } from './AdminOrganisationLayout';
import { SignalementsEnAttentePage } from '../operator/SignalementsEnAttentePage';
import { useI18n } from '../../hooks';

export const AdminOrganisationSignalementsEnAttentePage: React.FC = () => {
  const { t } = useI18n();
  return (
    <AdminOrganisationLayout title={t('admin.signalementsEnAttente')} activeNav="signalements-en-attente">
      <SignalementsEnAttentePage noLayout />
    </AdminOrganisationLayout>
  );
};

export default AdminOrganisationSignalementsEnAttentePage;
