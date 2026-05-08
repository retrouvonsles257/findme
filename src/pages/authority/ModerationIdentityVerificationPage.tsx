/**
 * Vérifications d'identité citoyens (ex-modérateur), silo Autorité — filtre par organisation si présente.
 */
import React from 'react';
import { AuthorityLayout } from '../../components/layout';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { IdentityVerificationPage } from './moderation/IdentityVerificationPage';

export interface ModerationIdentityVerificationPageProps {
  noLayout?: boolean;
}

export const ModerationIdentityVerificationPage: React.FC<ModerationIdentityVerificationPageProps> = ({ noLayout = false }) => {
  const currentUser = useAppSelector(selectCurrentUser);
  const organisationId = (currentUser as { organisation_id?: string | null })?.organisation_id ?? null;
  const content = <IdentityVerificationPage noLayout organisationId={organisationId} />;

  if (noLayout) return content;
  return <AuthorityLayout>{content}</AuthorityLayout>;
};

export default ModerationIdentityVerificationPage;
