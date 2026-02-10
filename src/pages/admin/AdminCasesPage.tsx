/**
 * Admin Organisation - Cas / Dossiers NGO (héritage NGO)
 * Réutilise NGOCasesPage avec layout Admin.
 */
import React from 'react';
import { AdminOrganisationLayout } from './AdminOrganisationLayout';
import { NGOCasesPage } from '../ngo/CasesPage';
import { useI18n } from '../../hooks';

export const AdminOrganisationCasesPage: React.FC = () => {
  const { t } = useI18n();
  return (
    <AdminOrganisationLayout title={t('admin.cas')} activeNav="cas">
      <NGOCasesPage noLayout basePath="/admin" />
    </AdminOrganisationLayout>
  );
};

export default AdminOrganisationCasesPage;
