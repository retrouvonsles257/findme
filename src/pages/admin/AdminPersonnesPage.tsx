/**
 * Admin Organisation - Personnes (héritage Opérateur)
 * Réutilise OperatorPersonsPage avec layout Admin.
 */
import React from 'react';
import { AdminOrganisationLayout } from './AdminOrganisationLayout';
import { OperatorPersonsPage } from '../operator/PersonsPage';
import { useI18n } from '../../hooks';

export const AdminOrganisationPersonnesPage: React.FC = () => {
  const { t } = useI18n();
  return (
    <AdminOrganisationLayout title={t('admin.personnes')} activeNav="personnes">
      <OperatorPersonsPage noLayout basePath="/admin" />
    </AdminOrganisationLayout>
  );
};

export default AdminOrganisationPersonnesPage;
