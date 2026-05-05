/**
 * =====================================================
 * RETROUVONSLES - Admin Add Users (batch)
 * Inviter ou créer plusieurs utilisateurs en une fois
 * =====================================================
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  UserPlus,
  Mail,
  Loader2,
  Shield,
  UserCog,
  Lock,
  Trash2,
  Plus,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useAppSelector } from '../../store/types';
import { AdminOrganisationLayout } from './AdminOrganisationLayout';
import { Card, CardBody, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useI18n } from '../../hooks';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { NomRole } from '../../@types/enums.types';
import { inviteUserByEmail, createUserManually } from '../../features/admin-organisation/services';
import styles from './UserNewPage.module.css';

type RowMode = 'invite' | 'create';

/** Profils métier transmis à l’Edge Function (mappés vers `autorite` + `autorite_echelon`). */
type AutoriteInviteRole =
  | 'officier_police'
  | 'agent_gendarmerie'
  | 'responsable_ong'
  | 'operateur_saisie'
  | 'moderateur';

interface UserRow {
  id: string;
  email: string;
  role: AutoriteInviteRole;
  mode: RowMode;
  password: string;
}

interface BatchResult {
  invited: number;
  created: number;
  failed: { email: string; error: string }[];
}

const ROLE_OPTIONS: AutoriteInviteRole[] = [
  'officier_police',
  'agent_gendarmerie',
  'responsable_ong',
  'operateur_saisie',
  'moderateur',
];

const DEFAULT_INVITE_ROLE: AutoriteInviteRole = 'operateur_saisie';

const MIN_PASSWORD_LENGTH = 8;

function generateRowId() {
  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const AdminOrganisationUserNewPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const currentUser = useAppSelector(selectCurrentUser);
  const [rows, setRows] = useState<UserRow[]>(() => [
    { id: generateRowId(), email: '', role: DEFAULT_INVITE_ROLE, mode: 'invite', password: '' },
  ]);
  const [sending, setSending] = useState(false);
  const [batchResult, setBatchResult] = useState<BatchResult | null>(null);

  const addRow = useCallback(() => {
    setRows((prev) => [
      ...prev,
      { id: generateRowId(), email: '', role: DEFAULT_INVITE_ROLE, mode: 'invite', password: '' },
    ]);
  }, []);

  const removeRow = useCallback((id: string) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));
  }, []);

  const updateRow = useCallback((id: string, patch: Partial<UserRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }, []);

  const handleProcessAll = useCallback(async () => {
    if (!currentUser?.organisation_id) return;
    const valid = rows.filter((r) => r.email.trim());
    if (valid.length === 0) return;
    const createRows = valid.filter((r) => r.mode === 'create');
    const badPassword = createRows.some((r) => r.password.length < MIN_PASSWORD_LENGTH);
    if (badPassword) return;

    setSending(true);
    setBatchResult(null);
    const result: BatchResult = { invited: 0, created: 0, failed: [] };

    for (const row of valid) {
      const email = row.email.trim();
      try {
        if (row.mode === 'invite') {
          const res = await inviteUserByEmail(currentUser.organisation_id, email, row.role);
          if (res.success) result.invited += 1;
          else result.failed.push({ email, error: res.error || t('admin.inviteError') });
        } else {
          const res = await createUserManually(
            currentUser.organisation_id,
            email,
            row.role,
            row.password
          );
          if (res.success) result.created += 1;
          else result.failed.push({ email, error: res.error || t('admin.createError') });
        }
      } catch (err: any) {
        result.failed.push({ email, error: err?.message || 'Error' });
      }
    }

    setBatchResult(result);
    setSending(false);
  }, [currentUser?.organisation_id, rows, t]);

  if (!currentUser || currentUser.role !== NomRole.ADMIN_SYSTEME) {
    navigate('/auth/login');
    return null;
  }

  const validRows = rows.filter((r) => r.email.trim());
  const canSubmit =
    validRows.length > 0 &&
    validRows.filter((r) => r.mode === 'create').every((r) => r.password.length >= MIN_PASSWORD_LENGTH);

  if (batchResult !== null) {
    const { invited, created, failed } = batchResult;
    const hasSuccess = invited > 0 || created > 0;
    return (
      <AdminOrganisationLayout title={t('admin.addUser')} activeNav="utilisateurs">
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <button
                type="button"
                className={styles.backBtn}
                onClick={() => navigate('/admin/utilisateurs')}
                aria-label={t('common.back')}
              >
                <ArrowLeft size={20} />
                {t('common.back')}
              </button>
            </div>
          </div>
          <Card>
            <CardBody>
              <div className={styles.resultBlock}>
                <h2 className={styles.resultTitle}>{t('admin.batchResultTitle')}</h2>
                <div className={styles.resultStats}>
                  {invited > 0 && (
                    <div className={styles.resultStat}>
                      <Mail className={styles.resultStatIcon} />
                      <span>{t('admin.batchInvited').replace('{{count}}', String(invited))}</span>
                    </div>
                  )}
                  {created > 0 && (
                    <div className={styles.resultStat}>
                      <UserCog className={styles.resultStatIcon} />
                      <span>{t('admin.batchCreated').replace('{{count}}', String(created))}</span>
                    </div>
                  )}
                  {failed.length > 0 && (
                    <div className={`${styles.resultStat} ${styles.resultStatError}`}>
                      <XCircle className={styles.resultStatIcon} />
                      <span>{t('admin.batchFailed').replace('{{count}}', String(failed.length))}</span>
                    </div>
                  )}
                </div>
                {failed.length > 0 && (
                  <ul className={styles.resultFailedList} aria-label={t('admin.batchFailed') || 'Échecs'} role="alert">
                    {failed.map((f, i) => (
                      <li key={i}>
                        <strong>{f.email}</strong>: {f.error}
                      </li>
                    ))}
                  </ul>
                )}
                <div className={styles.resultActions}>
                  {hasSuccess && (
                    <Button variant="primary" onClick={() => navigate('/admin/utilisateurs')}>
                      {t('admin.utilisateurs')}
                    </Button>
                  )}
                  <Button
                    variant={hasSuccess ? 'secondary' : 'primary'}
                    onClick={() => {
                      setBatchResult(null);
                      if (hasSuccess)
                        setRows([{ id: generateRowId(), email: '', role: DEFAULT_INVITE_ROLE, mode: 'invite', password: '' }]);
                    }}
                  >
                    {hasSuccess ? t('admin.addRow') : t('common.back')}
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </AdminOrganisationLayout>
    );
  }

  return (
    <AdminOrganisationLayout title={t('admin.addUser')} activeNav="utilisateurs">
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => navigate('/admin/utilisateurs')}
              aria-label={t('common.back')}
            >
              <ArrowLeft size={20} />
              {t('common.back')}
            </button>
            <div className={styles.headerIcon}>
              <UserPlus size={24} />
            </div>
            <div>
              <h1 className={styles.title}>{t('admin.addUser')}</h1>
              <p className={styles.subtitle}>{t('admin.noRowsHint')}</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader className={styles.cardHeaderOverrides}>
            <div className={styles.tableHeaderRow}>
              <h2 className={styles.cardTitle}>
                {t('admin.addUser')} <span className={styles.rowCount}>({rows.length})</span>
              </h2>
              <Button type="button" variant="secondary" size="sm" onClick={addRow}>
                <Plus size={18} />
                {t('admin.addRow')}
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <div className={styles.tableWrap}>
              <div className={styles.tableHeader}>
                <div className={styles.thEmail}><Mail size={14} /> {t('admin.fieldEmail')}</div>
                <div className={styles.thRole}><Shield size={14} /> {t('common.role')}</div>
                <div className={styles.thType}>{t('admin.typeInvite')} / {t('admin.typeCreate')}</div>
                <div className={styles.thPassword}><Lock size={14} /> {t('admin.temporaryPassword')}</div>
                <div className={styles.thActions}>{t('common.actions')}</div>
              </div>
              <div className={styles.tableBody}>
                {rows.map((row) => (
                  <div key={row.id} className={styles.tableRow}>
                    <div className={styles.tdEmail} data-label={t('admin.fieldEmail')}>
                      <input
                        type="email"
                        value={row.email}
                        onChange={(e) => updateRow(row.id, { email: e.target.value })}
                        placeholder={t('admin.enterEmail')}
                        className={styles.input}
                      />
                    </div>
                    <div className={styles.tdRole} data-label={t('common.role')}>
                      <select
                        value={row.role}
                        onChange={(e) => updateRow(row.id, { role: e.target.value as AutoriteInviteRole })}
                        className={styles.select}
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r} value={r}>{t(`admin.role.${r}`, t('common.unknown'))}</option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.tdType} data-label={`${t('admin.typeInvite')} / ${t('admin.typeCreate')}`}>
                      <select
                        value={row.mode}
                        onChange={(e) => updateRow(row.id, { mode: e.target.value as RowMode, password: '' })}
                        className={styles.select}
                      >
                        <option value="invite">{t('admin.inviteByEmailOption')}</option>
                        <option value="create">{t('admin.createManuallyOption')}</option>
                      </select>
                    </div>
                    <div className={styles.tdPassword} data-label={t('admin.temporaryPassword')}>
                      {row.mode === 'create' ? (
                        <input
                          type="password"
                          value={row.password}
                          onChange={(e) => updateRow(row.id, { password: e.target.value })}
                          placeholder={t('admin.temporaryPassword')}
                          className={styles.input}
                          minLength={MIN_PASSWORD_LENGTH}
                          autoComplete="new-password"
                        />
                      ) : (
                        <span className={styles.passwordPlaceholder}>—</span>
                      )}
                    </div>
                    <div className={styles.tdActions} data-label={t('common.actions')}>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => removeRow(row.id)}
                        title={t('admin.removeRow')}
                        aria-label={t('admin.removeRow')}
                        disabled={rows.length <= 1}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.footerActions}>
              <Button type="button" variant="secondary" onClick={() => navigate('/admin/utilisateurs')}>
                {t('common.cancel')}
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleProcessAll}
                disabled={!canSubmit || sending}
              >
                {sending ? <Loader2 size={18} className={styles.spinner} /> : <UserPlus size={18} />}
                {sending ? t('common.loading') : t('admin.processAll')}
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </AdminOrganisationLayout>
  );
};

export default AdminOrganisationUserNewPage;
