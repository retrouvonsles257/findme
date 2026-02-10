/**
 * Admin Organisation - Photos en attente (héritage Opérateur)
 * Réutilise PhotosEnAttentePage (operator) avec layout Admin.
 */
import React from 'react';
import { AdminOrganisationLayout } from './AdminOrganisationLayout';
import { PhotosEnAttentePage } from '../operator/PhotosEnAttentePage';
import { useI18n } from '../../hooks';

export const AdminOrganisationPhotosEnAttentePage: React.FC = () => {
  const { t } = useI18n();
  return (
    <AdminOrganisationLayout title={t('admin.photosEnAttente')} activeNav="photos-en-attente">
      <PhotosEnAttentePage noLayout basePath="/admin" />
    </AdminOrganisationLayout>
  );
};

export default AdminOrganisationPhotosEnAttentePage;
