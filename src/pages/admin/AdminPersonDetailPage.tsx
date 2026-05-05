/**
 * Admin Organisation - Détail personne (contenu aligné sur le silo Autorité).
 */
import React from 'react';
import { AdminOrganisationLayout } from './AdminOrganisationLayout';
import { PersonDetailPage } from '../authority/PersonDetailPage';
import { useI18n } from '../../hooks';

export const AdminOrganisationPersonDetailPage: React.FC = () => {
  const { t } = useI18n();
  return (
    <AdminOrganisationLayout title={t('admin.personnes')} activeNav="personnes">
      <PersonDetailPage noLayout basePath="/admin" />
    </AdminOrganisationLayout>
  );
};

export default AdminOrganisationPersonDetailPage;
