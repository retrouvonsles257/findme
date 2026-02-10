/**
 * Admin Organisation - Vérification d'identité (héritage Modérateur)
 * Charge les demandes depuis demande_verification_identite (org + globales).
 */
import React from 'react';
import { useAppSelector } from '../../store/types';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { AdminOrganisationLayout } from './AdminOrganisationLayout';
import { IdentityVerificationPage } from '../moderator/IdentityVerificationPage';
import { useI18n } from '../../hooks';

export const AdminOrganisationVerificationIdentitePage: React.FC = () => {
  const { t } = useI18n();
  const currentUser = useAppSelector(selectCurrentUser);
  const organisationId = currentUser?.organisation_id ?? null;

  return (
    <AdminOrganisationLayout title={t('admin.verificationIdentite')} activeNav="verification-identite">
      <IdentityVerificationPage noLayout organisationId={organisationId} />
    </AdminOrganisationLayout>
  );
};

export default AdminOrganisationVerificationIdentitePage;
