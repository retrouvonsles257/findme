/**
 * Admin Organisation - Campagnes (héritage NGO)
 * Réutilise NGOCampagnesPage avec layout Admin.
 */
import React from 'react';
import { AdminOrganisationLayout } from './AdminOrganisationLayout';
import { NGOCampagnesPage } from '../ngo/CampagnesPage';
import { useI18n } from '../../hooks';

export const AdminOrganisationCampagnesPage: React.FC = () => {
  const { t } = useI18n();
  return (
    <AdminOrganisationLayout title={t('admin.campagnes')} activeNav="campagnes">
      <NGOCampagnesPage noLayout basePath="/admin" />
    </AdminOrganisationLayout>
  );
};

export default AdminOrganisationCampagnesPage;
