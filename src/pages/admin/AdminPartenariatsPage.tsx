/**
 * Admin Organisation - Partenariats (héritage NGO)
 * Réutilise NGOPartnershipsPage avec layout Admin ; charge les partenariats depuis partenariat_organisation.
 */
import React from 'react';
import { useAppSelector } from '../../store/types';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { AdminOrganisationLayout } from './AdminOrganisationLayout';
import { NGOPartnershipsPage } from '../ngo/PartnershipsPage';
import { useI18n } from '../../hooks';

export const AdminOrganisationPartenariatsPage: React.FC = () => {
  const { t } = useI18n();
  const currentUser = useAppSelector(selectCurrentUser);
  const organisationId = currentUser?.organisation_id ?? null;

  return (
    <AdminOrganisationLayout title={t('admin.partenariats')} activeNav="partenariats">
      <NGOPartnershipsPage noLayout organisationId={organisationId} />
    </AdminOrganisationLayout>
  );
};

export default AdminOrganisationPartenariatsPage;
