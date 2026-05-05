/**
 * Admin Organisation - Personnes (contenu aligné sur le silo Autorité).
 */
import React from 'react';
import { AdminOrganisationLayout } from './AdminOrganisationLayout';
import { PersonsPage } from '../authority/PersonsPage';
import { useI18n } from '../../hooks';

export const AdminOrganisationPersonnesPage: React.FC = () => {
  const { t } = useI18n();
  return (
    <AdminOrganisationLayout title={t('admin.personnes')} activeNav="personnes">
      <PersonsPage noLayout basePath="/admin" />
    </AdminOrganisationLayout>
  );
};

export default AdminOrganisationPersonnesPage;
