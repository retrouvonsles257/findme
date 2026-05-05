/**
 * Vérifications d'identité citoyens (ex-modérateur), silo Autorité — filtre par organisation si présente.
 */
import React from 'react';
import { AuthorityLayout } from '../../components/layout';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { IdentityVerificationPage } from '../moderator/IdentityVerificationPage';

export const ModerationIdentityVerificationPage: React.FC = () => {
  const currentUser = useAppSelector(selectCurrentUser);
  const organisationId = (currentUser as { organisation_id?: string | null })?.organisation_id ?? null;

  return (
    <AuthorityLayout>
      <IdentityVerificationPage noLayout organisationId={organisationId} />
    </AuthorityLayout>
  );
};

export default ModerationIdentityVerificationPage;
