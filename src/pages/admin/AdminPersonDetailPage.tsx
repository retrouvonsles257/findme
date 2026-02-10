/**
 * Admin Organisation - Détail personne (héritage Opérateur)
 * Réutilise OperatorPersonDetailPage avec layout Admin.
 */
import React from 'react';
import { AdminOrganisationLayout } from './AdminOrganisationLayout';
import { OperatorPersonDetailPage } from '../operator/PersonDetailPage';
import { useI18n } from '../../hooks';

export const AdminOrganisationPersonDetailPage: React.FC = () => {
  const { t } = useI18n();
  return (
    <AdminOrganisationLayout title={t('admin.personnes')} activeNav="personnes">
      <OperatorPersonDetailPage noLayout basePath="/admin" />
    </AdminOrganisationLayout>
  );
};

export default AdminOrganisationPersonDetailPage;
