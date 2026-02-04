/**
 * =====================================================
 * RETROUVONSLES - Admin Workflows Placeholder
 * Configuration des workflows et modèles de dossiers (à venir)
 * =====================================================
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GitBranch, ArrowLeft } from 'lucide-react';
import { useAppSelector } from '../../store/types';
import { AdminOrganisationLayout } from './AdminOrganisationLayout';
import { useI18n } from '../../hooks';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { NomRole } from '../../@types/enums.types';
import styles from './OrganisationSettings.module.css';

export const AdminOrganisationWorkflowsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const currentUser = useAppSelector(selectCurrentUser);

  if (!currentUser || currentUser.role !== NomRole.ADMIN_ORGANISATION) {
    navigate('/auth/login');
    return null;
  }

  return (
    <AdminOrganisationLayout title={t('admin.workflows')} activeNav="workflows">
      <div className={styles.settings}>
        <div className={styles.settings__card}>
          <div className={styles.settings__cardHeader}>
            <GitBranch size={24} className={styles.settings__titleIcon} />
            <h3>{t('admin.workflows')}</h3>
          </div>
          <div className={styles.settings__cardBody}>
            <p className={styles.settings__description} style={{ marginBottom: 16 }}>
              {t('admin.workflowsComingSoon')}
            </p>
            <button
              type="button"
              className={styles.settings__btnSecondary}
              onClick={() => navigate('/admin/parametres')}
            >
              <ArrowLeft size={16} style={{ marginRight: 8 }} />
              {t('admin.backToSettings')}
            </button>
          </div>
        </div>
      </div>
    </AdminOrganisationLayout>
  );
};

export default AdminOrganisationWorkflowsPage;
