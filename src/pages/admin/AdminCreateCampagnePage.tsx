/**
 * Admin Organisation - Création campagne (héritage NGO)
 * Réutilise NGOCreateCampagnePage avec layout Admin.
 */
import React from 'react';
import { AdminOrganisationLayout } from './AdminOrganisationLayout';
import { NGOCreateCampagnePage } from '../ngo/CreateCampagnePage';
import { useI18n } from '../../hooks';

export const AdminOrganisationCreateCampagnePage: React.FC = () => {
  const { t } = useI18n();
  return (
    <AdminOrganisationLayout title={t('admin.campagnes')} activeNav="campagnes">
      <NGOCreateCampagnePage noLayout basePath="/admin" />
    </AdminOrganisationLayout>
  );
};

export default AdminOrganisationCreateCampagnePage;
