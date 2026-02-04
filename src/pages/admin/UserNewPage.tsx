/**
 * =====================================================
 * RETROUVONSLES - Admin Invite User Page
 * Invitation d'un nouveau membre par email
 * =====================================================
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Mail, Loader2, Shield } from 'lucide-react';
import { useAppSelector } from '../../store/types';
import { AdminOrganisationLayout } from './AdminOrganisationLayout';
import { Card, CardBody, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useI18n } from '../../hooks';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { NomRole } from '../../@types/enums.types';
import { inviteUserByEmail } from '../../features/admin-organisation/services';
import styles from './UserNewPage.module.css';

const ROLE_OPTIONS: NomRole[] = [
  NomRole.OFFICIER_POLICE,
  NomRole.AGENT_GENDARMERIE,
  NomRole.RESPONSABLE_ONG,
  NomRole.OPERATEUR_SAISIE,
  NomRole.MODERATEUR,
];

export const AdminOrganisationUserNewPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const currentUser = useAppSelector(selectCurrentUser);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<NomRole>(NomRole.OPERATEUR_SAISIE);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !currentUser?.organisation_id) return;
    setSending(true);
    setError(null);
    try {
      const result = await inviteUserByEmail(
        currentUser.organisation_id,
        email.trim(),
        role
      );
      if (result.success) {
        setSent(true);
      } else {
        setError(result.error || t('admin.inviteError'));
      }
    } catch (err: any) {
      setError(err?.message || t('admin.inviteError'));
    } finally {
      setSending(false);
    }
  };

  if (!currentUser || currentUser.role !== NomRole.ADMIN_ORGANISATION) {
    navigate('/auth/login');
    return null;
  }

  if (sent) {
    return (
      <AdminOrganisationLayout title={t('admin.inviteUser')} activeNav="utilisateurs">
        <div className={styles.page}>
          <button type="button" className={styles.backBtn} onClick={() => navigate('/admin/utilisateurs')}>
            <ArrowLeft size={20} />
            {t('common.back')}
          </button>
          <Card>
            <CardBody>
              <div className={styles.success}>
                <UserPlus size={48} className={styles.successIcon} />
                <h2>{t('admin.inviteSent')}</h2>
                <p>{t('admin.inviteSentTo')}{t('common.colon')} {email}</p>
                <Button variant="primary" onClick={() => navigate('/admin/utilisateurs')}>
                  {t('admin.utilisateurs')}
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </AdminOrganisationLayout>
    );
  }

  return (
    <AdminOrganisationLayout title={t('admin.inviteUser')} activeNav="utilisateurs">
      <div className={styles.page}>
        <div className={styles.header}>
          <button type="button" className={styles.backBtn} onClick={() => navigate('/admin/utilisateurs')} title={t('common.back')} aria-label={t('common.back')}>
            <ArrowLeft size={20} />
            {t('common.back')}
          </button>
        </div>
        <Card className={styles.card}>
          <CardHeader>
            <h1 className={styles.title}>
              <UserPlus size={24} className={styles.titleIcon} />
              {t('admin.inviteUser')}
            </h1>
            <p className={styles.subtitle}>{t('admin.inviteUserDescription')}</p>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className={styles.form}>
              {error && (
                <div className={styles.error} role="alert">
                  {error}
                </div>
              )}
              <div className={styles.field}>
                <label htmlFor="email">
                  <Mail size={16} className={styles.labelIcon} />
                  {t('admin.fieldEmail')}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t('admin.enterEmail')}
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="role">
                  <Shield size={16} className={styles.labelIcon} />
                  {t('common.role')}
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={e => setRole(e.target.value as NomRole)}
                  className={styles.select}
                >
                  {ROLE_OPTIONS.map(r => (
                    <option key={r} value={r}>{t(`admin.role.${r}`, t('common.unknown'))}</option>
                  ))}
                </select>
              </div>
              <div className={styles.actions}>
                <Button type="button" variant="secondary" onClick={() => navigate('/admin/utilisateurs')}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" variant="primary" disabled={sending}>
                  {sending ? <Loader2 size={18} className={styles.spinner} /> : <Mail size={18} />}
                  {t('admin.inviteByEmail')}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </AdminOrganisationLayout>
  );
};

export default AdminOrganisationUserNewPage;
