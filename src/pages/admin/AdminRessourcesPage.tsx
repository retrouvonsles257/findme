/**
 * Admin Organisation - Ressources (héritage NGO)
 * Réutilise NGOResourcesPage avec layout Admin ; charge les ressources depuis ressource_organisation.
 */
import React from 'react';
import { useAppSelector } from '../../store/types';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { AdminOrganisationLayout } from './AdminOrganisationLayout';
import { NGOResourcesPage } from '../ngo/ResourcesPage';
import { useI18n } from '../../hooks';

export const AdminOrganisationRessourcesPage: React.FC = () => {
  const { t } = useI18n();
  const currentUser = useAppSelector(selectCurrentUser);
  const organisationId = currentUser?.organisation_id ?? null;

  return (
    <AdminOrganisationLayout title={t('admin.ressources')} activeNav="ressources">
      <NGOResourcesPage noLayout organisationId={organisationId} />
    </AdminOrganisationLayout>
  );
};

export default AdminOrganisationRessourcesPage;
