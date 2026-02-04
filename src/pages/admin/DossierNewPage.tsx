/**
 * =====================================================
 * RETROUVONSLES - Admin New Dossier
 * Création d'un dossier dans l'espace admin (même formulaire que Autorité)
 * =====================================================
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/types';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { NomRole } from '../../@types/enums.types';
import { AdminOrganisationLayout } from './AdminOrganisationLayout';
import { CreateDossierAuthorityPage } from '../authority/CreateDossierAuthorityPage';
import { useI18n } from '../../hooks';

export const AdminOrganisationDossierNewPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const currentUser = useAppSelector(selectCurrentUser);

  useEffect(() => {
    if (!currentUser || currentUser.role !== NomRole.ADMIN_ORGANISATION) {
      navigate('/auth/login');
      return;
    }
  }, [currentUser, navigate]);

  if (!currentUser || currentUser.role !== NomRole.ADMIN_ORGANISATION) {
    return null;
  }

  return (
    <AdminOrganisationLayout title={t('admin.createNewFile')} activeNav="dossiers">
      <CreateDossierAuthorityPage noLayout cancelTo="/admin/dossiers" />
    </AdminOrganisationLayout>
  );
};

export default AdminOrganisationDossierNewPage;
