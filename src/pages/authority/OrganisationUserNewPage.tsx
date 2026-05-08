import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Mail, Loader2, Shield, UserCog, Lock, Trash2, Plus, XCircle } from 'lucide-react';
import { useAppSelector } from '../../store/types';
import { Card, CardBody, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useI18n } from '../../hooks';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { NomRole } from '../../@types/enums.types';
import { inviteUserByEmail, createUserManually } from '../../features/authority/services';
import styles from './organisation/UserNewPage.module.css';

type RowMode = 'invite' | 'create';
type AutoriteEchelon = 1 | 2 | 3 | 4;

interface UserRow {
  id: string;
  email: string;
  autoriteEchelon: AutoriteEchelon;
  mode: RowMode;
  password: string;
}

interface BatchResult {
  invited: number;
  created: number;
  failed: { email: string; error: string }[];
}

const ECHELON_OPTIONS: AutoriteEchelon[] = [1, 2, 3, 4];
const DEFAULT_AUTORITE_ECHELON: AutoriteEchelon = 1;
const MIN_PASSWORD_LENGTH = 8;

function generateRowId() {
  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const OrganisationUserNewPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const currentUser = useAppSelector(selectCurrentUser);
  const [rows, setRows] = useState<UserRow[]>([{ id: generateRowId(), email: '', autoriteEchelon: DEFAULT_AUTORITE_ECHELON, mode: 'invite', password: '' }]);
  const [sending, setSending] = useState(false);
  const [batchResult, setBatchResult] = useState<BatchResult | null>(null);

  const addRow = useCallback(() => {
    setRows(prev => [...prev, { id: generateRowId(), email: '', autoriteEchelon: DEFAULT_AUTORITE_ECHELON, mode: 'invite', password: '' }]);
  }, []);
  const removeRow = useCallback((id: string) => setRows(prev => (prev.length <= 1 ? prev : prev.filter(r => r.id !== id))), []);
  const updateRow = useCallback((id: string, patch: Partial<UserRow>) => {
    setRows(prev => prev.map(r => (r.id === id ? { ...r, ...patch } : r)));
  }, []);

  const handleProcessAll = useCallback(async () => {
    if (!currentUser?.organisation_id) return;
    const valid = rows.filter(r => r.email.trim());
    if (valid.length === 0) return;
    if (valid.filter(r => r.mode === 'create').some(r => r.password.length < MIN_PASSWORD_LENGTH)) return;

    setSending(true);
    setBatchResult(null);
    const result: BatchResult = { invited: 0, created: 0, failed: [] };
    for (const row of valid) {
      const email = row.email.trim();
      try {
        if (row.mode === 'invite') {
          const res = await inviteUserByEmail(currentUser.organisation_id, email, row.autoriteEchelon);
          if (res.success) result.invited += 1;
          else result.failed.push({ email, error: res.error || t('admin.inviteError') });
        } else {
          const res = await createUserManually(currentUser.organisation_id, email, row.autoriteEchelon, row.password);
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

  if (!currentUser?.organisation_id || currentUser.role !== NomRole.AUTORITE) {
    navigate('/auth/login');
    return null;
  }

  const usersList = '/authority/equipe';
  const validRows = rows.filter(r => r.email.trim());
  const canSubmit = validRows.length > 0 && validRows.filter(r => r.mode === 'create').every(r => r.password.length >= MIN_PASSWORD_LENGTH);

  if (batchResult) {
    const { invited, created, failed } = batchResult;
    const hasSuccess = invited > 0 || created > 0;
    return (
      <div className={styles.container}>
        <button type="button" className={styles.backBtn} onClick={() => navigate(usersList)}>
          <ArrowLeft size={20} /> {t('common.back')}
        </button>
        <Card>
          <CardBody>
            <h2 className={styles.resultTitle}>{t('admin.batchResultTitle')}</h2>
            <div className={styles.resultStats}>
              {invited > 0 && <div className={styles.resultStat}><Mail className={styles.resultStatIcon} /><span>{t('admin.batchInvited').replace('{{count}}', String(invited))}</span></div>}
              {created > 0 && <div className={styles.resultStat}><UserCog className={styles.resultStatIcon} /><span>{t('admin.batchCreated').replace('{{count}}', String(created))}</span></div>}
              {failed.length > 0 && <div className={`${styles.resultStat} ${styles.resultStatError}`}><XCircle className={styles.resultStatIcon} /><span>{t('admin.batchFailed').replace('{{count}}', String(failed.length))}</span></div>}
            </div>
            <div className={styles.resultActions}>
              {hasSuccess && <Button variant="primary" onClick={() => navigate(usersList)}>{t('admin.utilisateurs')}</Button>}
              <Button variant={hasSuccess ? 'secondary' : 'primary'} onClick={() => setBatchResult(null)}>
                {hasSuccess ? t('admin.addRow') : t('common.back')}
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <button type="button" className={styles.backBtn} onClick={() => navigate(usersList)}>
        <ArrowLeft size={20} /> {t('common.back')}
      </button>
      <Card>
        <CardHeader className={styles.cardHeaderOverrides}>
          <div className={styles.tableHeaderRow}>
            <h2 className={styles.cardTitle}>{t('admin.addUser')} <span className={styles.rowCount}>({rows.length})</span></h2>
            <Button type="button" variant="secondary" size="sm" onClick={addRow}><Plus size={18} />{t('admin.addRow')}</Button>
          </div>
        </CardHeader>
        <CardBody>
          <div className={styles.tableBody}>
            {rows.map(row => (
              <div key={row.id} className={styles.tableRow}>
                <input type="email" value={row.email} onChange={e => updateRow(row.id, { email: e.target.value })} placeholder={t('admin.enterEmail')} className={styles.input} />
                <select value={row.autoriteEchelon} onChange={e => updateRow(row.id, { autoriteEchelon: Number(e.target.value) as AutoriteEchelon })} className={styles.select}>
                  {ECHELON_OPTIONS.map(e => <option key={e} value={e}>{t(`authority.echelonFunction.${e}`, t('common.unknown'))}</option>)}
                </select>
                <select value={row.mode} onChange={e => updateRow(row.id, { mode: e.target.value as RowMode, password: '' })} className={styles.select}>
                  <option value="invite">{t('admin.inviteByEmailOption')}</option>
                  <option value="create">{t('admin.createManuallyOption')}</option>
                </select>
                {row.mode === 'create' ? (
                  <input type="password" value={row.password} onChange={e => updateRow(row.id, { password: e.target.value })} className={styles.input} minLength={MIN_PASSWORD_LENGTH} />
                ) : <span className={styles.passwordPlaceholder}>-</span>}
                <button type="button" className={styles.actionBtn} onClick={() => removeRow(row.id)} disabled={rows.length <= 1}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <div className={styles.footerActions}>
            <Button type="button" variant="secondary" onClick={() => navigate(usersList)}>{t('common.cancel')}</Button>
            <Button type="button" variant="primary" onClick={handleProcessAll} disabled={!canSubmit || sending}>
              {sending ? <Loader2 size={18} className={styles.spinner} /> : <UserPlus size={18} />}
              {sending ? t('common.loading') : t('admin.processAll')}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default OrganisationUserNewPage;
