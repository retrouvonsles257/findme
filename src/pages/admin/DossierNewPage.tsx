/**
 * =====================================================
 * RETROUVONSLES - Admin New Dossier (placeholder)
 * La création de dossier se fait depuis l'interface Autorité
 * =====================================================
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Folder, ExternalLink } from 'lucide-react';
import { useAppSelector } from '../../store/types';
import { AdminOrganisationLayout } from './AdminOrganisationLayout';
import { Card, CardBody, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useI18n } from '../../hooks';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { NomRole } from '../../@types/enums.types';
import styles from './DossierNewPage.module.css';

export const AdminOrganisationDossierNewPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const currentUser = useAppSelector(selectCurrentUser);

  if (!currentUser || currentUser.role !== NomRole.ADMIN_ORGANISATION) {
    navigate('/auth/login');
    return null;
  }

  return (
    <AdminOrganisationLayout title={t('admin.newDossier')} activeNav="dossiers">
      <div className={styles.page}>
        <div className={styles.header}>
          <button type="button" className={styles.backBtn} onClick={() => navigate('/admin/dossiers')}>
            <ArrowLeft size={20} />
            {t('common.back')}
          </button>
        </div>
        <Card>
          <CardHeader>
            <h1 className={styles.title}>
              <Folder size={24} />
              {t('admin.newDossier')}
            </h1>
          </CardHeader>
          <CardBody>
            <p className={styles.message}>{t('admin.createDossierViaAuthority')}</p>
            <div className={styles.actions}>
              <Button variant="secondary" onClick={() => navigate('/admin/dossiers')}>
                {t('common.back')}
              </Button>
              <Button variant="primary" onClick={() => navigate('/authority/dossiers/new')}>
                <ExternalLink size={18} />
                {t('admin.goToAuthorityInterface')}
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </AdminOrganisationLayout>
  );
};

export default AdminOrganisationDossierNewPage;
