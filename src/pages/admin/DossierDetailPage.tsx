/**
 * =====================================================
 * RETROUVONSLES - Admin Dossier Detail Page
 * Vue détaillée alignée sur celle de l'autorité (onglets, infos, photos, signalements, etc.)
 * =====================================================
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/types';
import { AdminOrganisationLayout } from './AdminOrganisationLayout';
import { DossierDetailPage as AuthorityDossierDetailPage } from '../authority/DossierDetailPage';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { NomRole } from '../../@types/enums.types';

export const AdminOrganisationDossierDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useAppSelector(selectCurrentUser);

  if (!currentUser || currentUser.role !== NomRole.ADMIN_ORGANISATION) {
    navigate('/auth/login');
    return null;
  }

  return (
    <AdminOrganisationLayout title="" activeNav="dossiers">
      <AuthorityDossierDetailPage
        noLayout
        backTo="/admin/dossiers"
        basePath="/admin"
      />
    </AdminOrganisationLayout>
  );
};

export default AdminOrganisationDossierDetailPage;
