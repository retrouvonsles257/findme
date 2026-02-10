/**
 * Admin Organisation - Création dossier cas humanitaire (héritage NGO)
 * Réutilise NGOCreateCasePage avec layout Admin.
 */
import React from 'react';
import { AdminOrganisationLayout } from './AdminOrganisationLayout';
import { NGOCreateCasePage } from '../ngo/CreateCasePage';
import { useI18n } from '../../hooks';

export const AdminOrganisationCreateCasePage: React.FC = () => {
  const { t } = useI18n();
  return (
    <AdminOrganisationLayout title={t('admin.cas')} activeNav="cas">
      <NGOCreateCasePage noLayout basePath="/admin" />
    </AdminOrganisationLayout>
  );
};

export default AdminOrganisationCreateCasePage;
