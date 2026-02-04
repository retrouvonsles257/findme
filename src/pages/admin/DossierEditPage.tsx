/**
 * =====================================================
 * RETROUVONSLES - Admin Dossier Edit Page
 * Modification d'un dossier de l'organisation
 * =====================================================
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Folder, Loader2, Save } from 'lucide-react';
import { useAppSelector } from '../../store/types';
import { AdminOrganisationLayout } from './AdminOrganisationLayout';
import { Card, CardBody, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useI18n } from '../../hooks';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { NomRole } from '../../@types/enums.types';
import {
  getAdminDossierById,
  updateAdminDossier,
  type AdminDossierRow,
  type AdminDossierUpdatePayload,
} from '../../features/admin-organisation/services';
import styles from './DossierDetailPage.module.css';

const STATUT_OPTIONS = [
  'en_cours',
  'retrouve_vivant',
  'retrouve_decede',
  'suspendu',
  'classe_sans_suite',
  'transfere',
] as const;

const URGENCE_OPTIONS = ['critique', 'urgent', 'normal', 'faible'] as const;

export const AdminOrganisationDossierEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const currentUser = useAppSelector(selectCurrentUser);
  const [dossier, setDossier] = useState<AdminDossierRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<AdminDossierUpdatePayload>({
    date_disparition: '',
    statut_dossier: 'en_cours',
    niveau_urgence: 'normal',
    lieu_disparition: '',
    ville_disparition: '',
    region_disparition: '',
    circonstances: '',
  });

  const loadDossier = useCallback(async () => {
    const orgId = currentUser?.organisation_id;
    if (!orgId || !id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminDossierById(orgId, id);
      if (data) {
        setDossier(data);
        setForm({
          date_disparition: data.date_disparition || '',
          statut_dossier: data.statut_dossier || 'en_cours',
          niveau_urgence: data.niveau_urgence || 'normal',
          lieu_disparition: data.lieu_disparition ?? '',
          ville_disparition: data.ville_disparition ?? '',
          region_disparition: data.region_disparition ?? '',
          circonstances: data.circonstances ?? '',
        });
      } else {
        setError(t('admin.dossierNotFound'));
      }
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e ? (e as { message: string }).message : '';
      setError(msg || t('admin.errorLoadingDossier'));
    } finally {
      setLoading(false);
    }
  }, [currentUser?.organisation_id, id, t]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== NomRole.ADMIN_ORGANISATION) {
      navigate('/auth/login');
      return;
    }
    loadDossier();
  }, [currentUser, navigate, loadDossier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const orgId = currentUser?.organisation_id;
    if (!orgId || !id) return;
    setSaving(true);
    setError(null);
    try {
      await updateAdminDossier(orgId, id, form);
      navigate(`/admin/dossiers/${id}`);
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : '';
      setError(msg || t('admin.errorSaving'));
    } finally {
      setSaving(false);
    }
  };

  if (!currentUser || currentUser.role !== NomRole.ADMIN_ORGANISATION) {
    return null;
  }

  return (
    <AdminOrganisationLayout title={t('admin.editDossier')} activeNav="dossiers">
      <div className={styles.page}>
        <div className={styles.header}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => navigate(`/admin/dossiers/${id}`)}
            title={t('common.back')}
            aria-label={t('common.back')}
          >
            <ArrowLeft size={20} />
            {t('common.back')}
          </button>
        </div>

        {loading ? (
          <div className={styles.loading}>
            <Loader2 className={styles.spinner} size={32} />
            <p>{t('common.loading')}</p>
          </div>
        ) : error && !dossier ? (
          <Card>
            <CardBody>
              <p className={styles.error}>{error}</p>
              <Button variant="secondary" onClick={() => navigate('/admin/dossiers')}>
                {t('common.back')}
              </Button>
            </CardBody>
          </Card>
        ) : dossier ? (
          <Card>
            <CardHeader>
              <h1 className={styles.title}>
                <Folder size={24} />
                {dossier.numero_dossier || `${t('admin.dossierNumberPrefix')}${dossier.id.slice(0, 8)}`}{t('common.titleSeparator')}{t('admin.editDossier')}
              </h1>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleSubmit} className={styles.grid}>
                {error && (
                  <p className={styles.error} style={{ gridColumn: '1 / -1' }}>
                    {error}
                  </p>
                )}
                <div className={styles.field}>
                  <label>{t('admin.date')}</label>
                  <input
                    type="datetime-local"
                    value={form.date_disparition ? form.date_disparition.slice(0, 16) : ''}
                    onChange={e => setForm({ ...form, date_disparition: e.target.value || '' })}
                    className={styles.input}
                  />
                </div>
                <div className={styles.field}>
                  <label>{t('admin.statusLabel')}</label>
                  <select
                    value={form.statut_dossier}
                    onChange={e => setForm({ ...form, statut_dossier: e.target.value })}
                    className={styles.input}
                  >
                    {STATUT_OPTIONS.map(s => (
                      <option key={s} value={s}>
                        {t(`admin.status.${s}`, t('common.unknown'))}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>{t('admin.urgenceLabel')}</label>
                  <select
                    value={form.niveau_urgence}
                    onChange={e => setForm({ ...form, niveau_urgence: e.target.value })}
                    className={styles.input}
                  >
                    {URGENCE_OPTIONS.map(u => (
                      <option key={u} value={u}>
                        {t(`admin.urgence.${u}`, t('common.unknown'))}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>{t('admin.ville')}</label>
                  <input
                    type="text"
                    value={form.ville_disparition ?? ''}
                    onChange={e => setForm({ ...form, ville_disparition: e.target.value })}
                    className={styles.input}
                    placeholder={t('admin.villePlaceholder')}
                  />
                </div>
                <div className={styles.field}>
                  <label>{t('admin.region')}</label>
                  <input
                    type="text"
                    value={form.region_disparition ?? ''}
                    onChange={e => setForm({ ...form, region_disparition: e.target.value })}
                    className={styles.input}
                    placeholder={t('admin.regionPlaceholder')}
                  />
                </div>
                <div className={styles.field}>
                  <label>{t('admin.lieu')}</label>
                  <input
                    type="text"
                    value={form.lieu_disparition ?? ''}
                    onChange={e => setForm({ ...form, lieu_disparition: e.target.value })}
                    className={styles.input}
                    placeholder={t('admin.lieuPlaceholder')}
                  />
                </div>
                <div className={styles.fieldFull}>
                  <label>{t('admin.description')}</label>
                  <textarea
                    value={form.circonstances ?? ''}
                    onChange={e => setForm({ ...form, circonstances: e.target.value })}
                    className={styles.textarea}
                    rows={5}
                    placeholder={t('admin.circonstancesPlaceholder')}
                  />
                </div>
                <div className={styles.footer} style={{ gridColumn: '1 / -1' }}>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => navigate(`/admin/dossiers/${id}`)}
                  >
                    {t('admin.cancel')}
                  </Button>
                  <Button type="submit" variant="primary" disabled={saving}>
                    <Save size={18} />
                    {saving ? t('admin.saving') : t('admin.saveChanges')}
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        ) : null}
      </div>
    </AdminOrganisationLayout>
  );
};

export default AdminOrganisationDossierEditPage;
