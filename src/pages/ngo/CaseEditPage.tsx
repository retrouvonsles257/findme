/**
 * =====================================================
 * RETROUVONSLES - NGO Case Edit Page
 * Modification des dossiers créés par l'organisation ONG (champs autorisés)
 * =====================================================
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useAppSelector } from '../../store/types';
import { selectUser } from '../../features/auth/store/authSelectors';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import {
  getAdminDossierById,
  updateAdminDossier,
  type AdminDossierUpdatePayload,
} from '../../features/admin-organisation/services';
import { NGOLayout } from './NGOLayout';
import { useI18n } from '../../hooks';
import { Card, CardBody, CardHeader } from '../../components/common/Card';
import { AdminDetailSkeleton } from '../admin/skeletons';
import styles from './CaseEditPage.module.css';

const URGENCE_OPTIONS = ['critique', 'urgent', 'normal', 'faible'] as const;

export const NGOCaseEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const authUser = useAppSelector(selectUser) as { organisation_id?: string } | null;
  const currentUser = useAppSelector(selectCurrentUser) as { organisation_id?: string } | null;
  const organisationId = currentUser?.organisation_id ?? authUser?.organisation_id ?? null;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<AdminDossierUpdatePayload>({
    date_disparition: '',
    niveau_urgence: 'normal',
    lieu_disparition: '',
    ville_disparition: '',
    region_disparition: '',
    pays_disparition: 'Cameroun',
    circonstances: '',
    contact_famille_principale: '',
    telephone_contact: '',
    email_contact: '',
  });

  const loadDossier = useCallback(async () => {
    if (!organisationId || !id) {
      setLoading(false);
      if (!organisationId) setError(t('ngo.noOrganisation'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminDossierById(organisationId, id);
      if (data) {
        setForm({
          date_disparition: data.date_disparition?.slice(0, 16) ?? '',
          niveau_urgence: (data.niveau_urgence as any) ?? 'normal',
          lieu_disparition: data.lieu_disparition ?? '',
          ville_disparition: data.ville_disparition ?? '',
          region_disparition: data.region_disparition ?? '',
          pays_disparition: data.pays_disparition ?? 'Cameroun',
          circonstances: data.circonstances ?? '',
          contact_famille_principale: data.contact_famille_principale ?? '',
          telephone_contact: data.telephone_contact ?? '',
          email_contact: data.email_contact ?? '',
        });
      } else {
        setError(t('common.errorLoadingData'));
      }
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e ? (e as { message: string }).message : '';
      setError(msg || t('common.errorLoadingData'));
    } finally {
      setLoading(false);
    }
  }, [organisationId, id, t]);

  useEffect(() => {
    loadDossier();
  }, [loadDossier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organisationId || !id) return;
    setSaving(true);
    setError(null);
    try {
      const payload: AdminDossierUpdatePayload = {
        date_disparition: form.date_disparition ? new Date(form.date_disparition).toISOString() : undefined,
        niveau_urgence: form.niveau_urgence,
        lieu_disparition: form.lieu_disparition,
        ville_disparition: form.ville_disparition,
        region_disparition: form.region_disparition,
        pays_disparition: form.pays_disparition,
        circonstances: form.circonstances,
        contact_famille_principale: form.contact_famille_principale || null,
        telephone_contact: form.telephone_contact || null,
        email_contact: form.email_contact || null,
      };
      await updateAdminDossier(organisationId, id, payload);
      navigate(`/ngo/cases/${id}`);
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : '';
      setError(msg || t('common.errorLoadingData'));
    } finally {
      setSaving(false);
    }
  };

  if (!organisationId) {
    return (
      <NGOLayout>
        <div className={styles.error}>
          <p>{t('ngo.noOrganisation')}</p>
          <button type="button" className={styles.backBtn} onClick={() => navigate('/ngo/cases')}>
            <ArrowLeft size={18} /> {t('common.back')}
          </button>
        </div>
      </NGOLayout>
    );
  }

  if (loading) {
    return (
      <NGOLayout>
        <div className={styles.skeletonWrap}>
          <AdminDetailSkeleton blockCount={3} linesPerBlock={4} />
        </div>
      </NGOLayout>
    );
  }

  if (error && !form.date_disparition) {
    return (
      <NGOLayout>
        <div className={styles.error}>
          <p>{error}</p>
          <button type="button" className={styles.backBtn} onClick={() => navigate('/ngo/cases')}>
            <ArrowLeft size={18} /> {t('common.back')}
          </button>
        </div>
      </NGOLayout>
    );
  }

  return (
    <NGOLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => navigate(`/ngo/cases/${id}`)}
            aria-label={t('common.back')}
          >
            <ArrowLeft size={18} />
            {t('common.back')}
          </button>
        </div>

        <Card>
          <CardHeader>
            <h1 className={styles.title}>{t('ngo.editCase')}</h1>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className={styles.form}>
              {error && <p className={styles.formError}>{error}</p>}

              <div className={styles.field}>
                <label>{t('ngo.missingDate')}</label>
                <input
                  type="datetime-local"
                  value={form.date_disparition ? String(form.date_disparition).slice(0, 16) : ''}
                  onChange={e => setForm({ ...form, date_disparition: e.target.value })}
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label>{t('ngo.urgency')}</label>
                <select
                  value={form.niveau_urgence}
                  onChange={e => setForm({ ...form, niveau_urgence: e.target.value as any })}
                  className={styles.input}
                >
                  {URGENCE_OPTIONS.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label>{t('common.location')}</label>
                <input
                  type="text"
                  value={form.lieu_disparition ?? ''}
                  onChange={e => setForm({ ...form, lieu_disparition: e.target.value })}
                  className={styles.input}
                  placeholder="Lieu / adresse"
                />
              </div>

              <div className={styles.field}>
                <label>Ville</label>
                <input
                  type="text"
                  value={form.ville_disparition ?? ''}
                  onChange={e => setForm({ ...form, ville_disparition: e.target.value })}
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label>Région</label>
                <input
                  type="text"
                  value={form.region_disparition ?? ''}
                  onChange={e => setForm({ ...form, region_disparition: e.target.value })}
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label>Pays</label>
                <input
                  type="text"
                  value={form.pays_disparition ?? ''}
                  onChange={e => setForm({ ...form, pays_disparition: e.target.value })}
                  className={styles.input}
                />
              </div>

              <div className={styles.fieldFull}>
                <label>Circonstances</label>
                <textarea
                  value={form.circonstances ?? ''}
                  onChange={e => setForm({ ...form, circonstances: e.target.value })}
                  className={styles.textarea}
                  rows={4}
                  placeholder="Décrire les circonstances de la disparition"
                />
              </div>

              <div className={styles.field}>
                <label>{t('ngo.contactFamily')}</label>
                <input
                  type="text"
                  value={form.contact_famille_principale ?? ''}
                  onChange={e => setForm({ ...form, contact_famille_principale: e.target.value })}
                  className={styles.input}
                  placeholder="Nom du contact famille"
                />
              </div>

              <div className={styles.field}>
                <label>{t('common.phone')}</label>
                <input
                  type="text"
                  value={form.telephone_contact ?? ''}
                  onChange={e => setForm({ ...form, telephone_contact: e.target.value })}
                  className={styles.input}
                  placeholder="Téléphone"
                />
              </div>

              <div className={styles.field}>
                <label>{t('common.email')}</label>
                <input
                  type="email"
                  value={form.email_contact ?? ''}
                  onChange={e => setForm({ ...form, email_contact: e.target.value })}
                  className={styles.input}
                  placeholder="Email"
                />
              </div>

              <div className={styles.footer}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => navigate(`/ngo/cases/${id}`)}
                >
                  {t('common.cancel')}
                </button>
                <button type="submit" className={styles.submitBtn} disabled={saving}>
                  {saving ? <Loader2 size={18} className={styles.spinner} /> : <Save size={18} />}
                  {saving ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </NGOLayout>
  );
};
