/**
 * =====================================================
 * RETROUVONSLES - Admin Profile Page
 * Profil de l'utilisateur connecté (admin organisation)
 * =====================================================
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Building2, Calendar } from 'lucide-react';
import { useAppSelector } from '../../store/types';
import { AdminOrganisationLayout } from './AdminOrganisationLayout';
import { Card, CardBody, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useI18n } from '../../hooks';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { NomRole } from '../../@types/enums.types';
import styles from './UserDetailPage.module.css';

export const AdminOrganisationProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const currentUser = useAppSelector(selectCurrentUser);

  if (!currentUser || currentUser.role !== NomRole.ADMIN_ORGANISATION) {
    navigate('/auth/login');
    return null;
  }

  const fullName = currentUser.nom_complet || currentUser.email || '—';

  return (
    <AdminOrganisationLayout title={t('admin.profile')} activeNav="profile">
      <div className={styles.page}>
        <div className={styles.header}>
          <button type="button" className={styles.backBtn} onClick={() => navigate('/admin/dashboard')}>
            {t('common.back')}
          </button>
        </div>
        <Card>
          <CardHeader>
            <div className={styles.titleRow}>
              <h1 className={styles.title}>
                <User size={24} />
                {t('admin.profile')}
              </h1>
            </div>
          </CardHeader>
          <CardBody>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label><User size={16} /> {t('common.name')}</label>
                <span className={styles.value}>{fullName}</span>
              </div>
              <div className={styles.field}>
                <label><Mail size={16} /> {t('admin.fieldEmail')}</label>
                <span className={styles.value}>{currentUser.email || '—'}</span>
              </div>
              <div className={styles.field}>
                <label><Building2 size={16} /> {t('admin.organisation')}</label>
                <span className={styles.value}>{currentUser.organisation_id || '—'}</span>
              </div>
              <div className={styles.field}>
                <label><Calendar size={16} /> {t('common.role')}</label>
                <span className={styles.value}>{t(`admin.role.${currentUser.role || 'admin_organisation'}`)}</span>
              </div>
            </div>
            <div className={styles.footer}>
              <Button variant="primary" onClick={() => navigate('/admin/parametres')}>
                {t('admin.settings')}
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </AdminOrganisationLayout>
  );
};

export default AdminOrganisationProfilePage;
