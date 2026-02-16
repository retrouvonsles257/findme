/**
 * RETROUVONSLES - NGO Profile Page
 * Affichage des informations du profil utilisateur ONG
 */

import React from 'react';
import { User, Mail, Building } from 'lucide-react';
import { NGOLayout } from '../../components/layout';
import { useAppSelector } from '../../store/types';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { useI18n } from '../../hooks';
import styles from './ProfilePage.module.css';

export const NGOProfilePage: React.FC = () => {
  const currentUser = useAppSelector(selectCurrentUser);
  const { t } = useI18n();

  const nomComplet = (currentUser as any)?.nom_complet || currentUser?.email || '—';
  const email = currentUser?.email || '—';
  const organisationId = (currentUser as any)?.organisation_id;

  return (
    <NGOLayout>
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>{t('common.profile')}</h1>
          <p className={styles.pageSubtitle}>
            {t('ngo.profileSubtitle')}
          </p>
        </div>

        <div className={styles.card}>
          <div className={styles.avatarSection}>
            <div className={styles.avatar}>
              {nomComplet !== '—' ? nomComplet.charAt(0).toUpperCase() : '?'}
            </div>
            <div className={styles.profileInfo}>
              <h2 className={styles.profileName}>{nomComplet}</h2>
              <span className={styles.profileRole}>ONG</span>
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.fields}>
            <div className={styles.field}>
              <User size={18} className={styles.fieldIcon} />
              <div>
                <span className={styles.fieldLabel}>{t('ngo.profileFullName')}</span>
                <span className={styles.fieldValue}>{nomComplet}</span>
              </div>
            </div>
            <div className={styles.field}>
              <Mail size={18} className={styles.fieldIcon} />
              <div>
                <span className={styles.fieldLabel}>Email</span>
                <span className={styles.fieldValue}>{email}</span>
              </div>
            </div>
            {organisationId && (
              <div className={styles.field}>
                <Building size={18} className={styles.fieldIcon} />
                <div>
                  <span className={styles.fieldLabel}>{t('ngo.profileOrganisation')}</span>
                  <span className={styles.fieldValue}>ID: {organisationId}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </NGOLayout>
  );
};
