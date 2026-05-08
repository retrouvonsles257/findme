import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Save, Loader2 } from 'lucide-react';
import { useAppSelector } from '../../store/types';
import { Card, CardBody, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useI18n } from '../../hooks';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { getAdminUserById, updateAdminUser, updateAdminUserRole, getAdminRoles } from '../../features/authority/services';
import type { AdminUserRow, AdminRoleRow } from '../../features/authority/services';
import { logActivity } from '../../services/audit/auditService';
import { NomRole, TypeAction } from '../../@types/enums.types';
import { AdminDetailSkeleton } from 'components/skeletons';
import styles from './organisation/UserDetailPage.module.css';

const STATUT_OPTIONS = ['actif', 'suspendu', 'desactive'] as const;

export const OrganisationUserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const currentUser = useAppSelector(selectCurrentUser);
  const [user, setUser] = useState<AdminUserRow | null>(null);
  const [roles, setRoles] = useState<AdminRoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ nom: '', prenom: '', telephone: '', statut_compte: 'actif', role_nom: '', date_expiration: '' });

  useEffect(() => {
    const orgId = currentUser?.organisation_id;
    if (!orgId || !id) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [data, rolesList] = await Promise.all([getAdminUserById(orgId, id), getAdminRoles()]);
        setRoles(rolesList || []);
        if (data) {
          setUser(data);
          const roleNom = (data.role as { nom_role?: string })?.nom_role || '';
          const exp = data.date_expiration ? new Date(data.date_expiration).toISOString().slice(0, 10) : '';
          setForm({ nom: data.nom || '', prenom: data.prenom || '', telephone: data.telephone || '', statut_compte: data.statut_compte || 'actif', role_nom: roleNom, date_expiration: exp });
        } else {
          setError(t('admin.userNotFound'));
        }
      } catch (e: any) {
        setError(e?.message || t('admin.errorLoadingUser'));
      } finally {
        setLoading(false);
      }
    })();
  }, [currentUser?.organisation_id, id, t]);

  const handleSave = async () => {
    if (!currentUser?.organisation_id || !id) return;
    setSaving(true);
    setError(null);
    try {
      await updateAdminUser(currentUser.organisation_id, id, {
        nom: form.nom,
        prenom: form.prenom,
        telephone: form.telephone || undefined,
        statut_compte: form.statut_compte,
      });
      logActivity({
        type_action: TypeAction.AUTRE,
        action_detaillee: 'modification_utilisateur',
        description: 'Modification des informations utilisateur',
        id_utilisateur: currentUser.id ?? undefined,
        donnees_apres: { user_id: id, statut_compte: form.statut_compte },
      }).catch(() => {});
      if (form.role_nom) {
        await updateAdminUserRole(currentUser.organisation_id, id, form.role_nom, {
          date_expiration: form.date_expiration ? new Date(form.date_expiration).toISOString() : null,
          attribue_par: currentUser.id,
        });
      }
      setEditing(false);
    } catch (e: any) {
      setError(e?.message || t('admin.errorSaving'));
    } finally {
      setSaving(false);
    }
  };

  if (!currentUser?.organisation_id || currentUser.role !== NomRole.AUTORITE) {
    navigate('/auth/login');
    return null;
  }

  const usersList = '/authority/equipe';

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button type="button" className={styles.backBtn} onClick={() => navigate(usersList)}>
          <ArrowLeft size={20} /> {t('common.back')}
        </button>
      </div>
      {loading ? (
        <div className={styles.skeletonWrap}><AdminDetailSkeleton blockCount={3} linesPerBlock={4} /></div>
      ) : error || !user ? (
        <div className={styles.errorBanner} role="alert">
          <p>{error || t('admin.userNotFound')}</p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <div className={styles.cardTitleRow}>
              <h1 className={styles.title}><User size={24} />{editing ? t('admin.editUser') : [user.nom, user.prenom].filter(Boolean).join(' ') || user.email}</h1>
              {!editing ? (
                <Button variant="primary" onClick={() => setEditing(true)}>{t('admin.editUser')}</Button>
              ) : (
                <div className={styles.actions}>
                  <Button variant="secondary" onClick={() => setEditing(false)} disabled={saving}>{t('common.cancel')}</Button>
                  <Button variant="primary" onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 size={18} className={styles.spinner} /> : <Save size={18} />}
                    {t('common.save')}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardBody>
            <div className={styles.grid}>
              <div className={styles.field}><label>{t('admin.fieldEmail')}</label><span className={styles.value}>{user.email}</span></div>
              <div className={styles.field}><label>{t('admin.fieldNom')}</label>{editing ? <input type="text" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} className={styles.input} /> : <span className={styles.value}>{user.nom}</span>}</div>
              <div className={styles.field}><label>{t('admin.fieldPrenom')}</label>{editing ? <input type="text" value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} className={styles.input} /> : <span className={styles.value}>{user.prenom}</span>}</div>
              <div className={styles.field}><label>{t('common.role')}</label>{editing ? <select value={form.role_nom} onChange={e => setForm(f => ({ ...f, role_nom: e.target.value }))} className={styles.select}>{roles.map(r => <option key={r.id} value={r.nom_role}>{t(`admin.role.${r.nom_role}`, t('common.unknown'))}</option>)}</select> : <Badge variant="info">{t(`admin.role.${(user as any).role?.nom_role || 'citoyen'}`, t('common.unknown'))}</Badge>}</div>
              <div className={styles.field}><label>{t('common.status')}</label>{editing ? <select value={form.statut_compte} onChange={e => setForm(f => ({ ...f, statut_compte: e.target.value }))} className={styles.select}>{STATUT_OPTIONS.map(s => <option key={s} value={s}>{t(`admin.status.${s}`, t('common.unknown'))}</option>)}</select> : <Badge variant={user.statut_compte === 'actif' ? 'success' : 'secondary'}>{t(`admin.status.${user.statut_compte}`, t('common.unknown'))}</Badge>}</div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default OrganisationUserDetailPage;
