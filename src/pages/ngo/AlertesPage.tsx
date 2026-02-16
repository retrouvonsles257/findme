/**
 * =====================================================
 * RETROUVONSLES - NGO Alertes Page
 * Liste des alertes de l'organisation (prévention / sensibilisation)
 * =====================================================
 */

import React from 'react';
import { useAppSelector } from '../../store/types';
import { selectUser } from '../../features/auth/store/authSelectors';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { AlertesPage as AuthorityAlertesPage } from '../authority/AlertesPage';
import { NGOLayout } from './NGOLayout';
import { useI18n } from '../../hooks';

export const NGOAlertesPage: React.FC = () => {
  const { t } = useI18n();
  const authUser = useAppSelector(selectUser) as { organisation_id?: string } | null;
  const currentUser = useAppSelector(selectCurrentUser) as { organisation_id?: string } | null;
  const organisationId = currentUser?.organisation_id ?? authUser?.organisation_id ?? null;

  return (
    <NGOLayout>
      <AuthorityAlertesPage
        noLayout
        basePath="/ngo"
        initialFilters={organisationId ? { id_organisation_responsable: organisationId } : undefined}
      />
    </NGOLayout>
  );
};
