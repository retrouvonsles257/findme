/**
 * Admin Organisation - Modération des photos (héritage Modérateur)
 * Réutilise PhotosModerationPage (moderator) avec layout Admin.
 */
import React from 'react';
import { AdminOrganisationLayout } from './AdminOrganisationLayout';
import { PhotosModerationPage } from '../moderator/PhotosModerationPage';
import { useI18n } from '../../hooks';

export const AdminOrganisationPhotosModerationPage: React.FC = () => {
  const { t } = useI18n();
  return (
    <AdminOrganisationLayout title={t('admin.photosModeration')} activeNav="photos-moderation">
      <PhotosModerationPage noLayout />
    </AdminOrganisationLayout>
  );
};

export default AdminOrganisationPhotosModerationPage;
