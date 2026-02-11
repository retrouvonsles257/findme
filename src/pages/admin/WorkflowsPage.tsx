/**
 * =====================================================
 * RETROUVONSLES - Admin Workflows
 * Configuration des étapes de traitement des dossiers par organisation
 * =====================================================
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GitBranch, Plus, Pencil, Trash2, Loader2, X } from 'lucide-react';
import { useAppSelector } from '../../store/types';
import { AdminTableSkeleton } from './skeletons';
import { AdminOrganisationLayout } from './AdminOrganisationLayout';
import { Button } from '../../components/common/Button';
import { useI18n } from '../../hooks';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { NomRole } from '../../@types/enums.types';
import {
  getWorkflowEtapesOrganisation,
  createWorkflowEtapeOrganisation,
  updateWorkflowEtapeOrganisation,
  deleteWorkflowEtapeOrganisation,
  type WorkflowEtapeOrganisationRow,
} from '../../features/admin-organisation/services';
import styles from './WorkflowsPage.module.css';

export const AdminOrganisationWorkflowsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const currentUser = useAppSelector(selectCurrentUser);
  const orgId = (currentUser as { organisation_id?: string; id_organisation?: string } | null)?.organisation_id
    ?? (currentUser as { organisation_id?: string; id_organisation?: string } | null)?.id_organisation;

  const [loading, setLoading] = useState(true);
  const [steps, setSteps] = useState<WorkflowEtapeOrganisationRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingStep, setEditingStep] = useState<WorkflowEtapeOrganisationRow | null>(null);
  const [form, setForm] = useState({ code: '', libelle: '', ordre: 0, actif: true });
  const [saving, setSaving] = useState(false);

  const loadSteps = useCallback(async () => {
    if (!orgId) return;
    setError(null);
    setLoading(true);
    try {
      const data = await getWorkflowEtapesOrganisation(orgId);
      setSteps(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('admin.workflowErrorLoad');
      setError(msg);
      setSteps([]);
    } finally {
      setLoading(false);
    }
  }, [orgId, t]);

  useEffect(() => {
    if (!currentUser) {
      navigate('/auth/login');
      return;
    }
    const roleName = typeof currentUser.role === 'string' ? currentUser.role : (currentUser.role as { nom_role?: string })?.nom_role;
    if (roleName !== NomRole.ADMIN_ORGANISATION) {
      navigate('/auth/login');
      return;
    }
    if (orgId) loadSteps();
    else setLoading(false);
  }, [currentUser, navigate, orgId, loadSteps]);

  const openCreate = () => {
    setEditingStep(null);
    setForm({ code: '', libelle: '', ordre: steps.length, actif: true });
    setShowModal(true);
  };

  const openEdit = (step: WorkflowEtapeOrganisationRow) => {
    setEditingStep(step);
    setForm({
      code: step.code,
      libelle: step.libelle,
      ordre: step.ordre,
      actif: step.actif,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingStep(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;
    if (!form.code.trim() || !form.libelle.trim()) return;
    setSaving(true);
    try {
      if (editingStep) {
        await updateWorkflowEtapeOrganisation(orgId, editingStep.id, {
          code: form.code.trim(),
          libelle: form.libelle.trim(),
          ordre: form.ordre,
          actif: form.actif,
        });
        // non-blocking i18n toast-style could go here
        closeModal();
        await loadSteps();
      } else {
        await createWorkflowEtapeOrganisation(orgId, {
          code: form.code.trim(),
          libelle: form.libelle.trim(),
          ordre: form.ordre,
          actif: form.actif,
        });
        closeModal();
        await loadSteps();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (step: WorkflowEtapeOrganisationRow) => {
    if (!orgId) return;
    if (!window.confirm(t('admin.workflowConfirmDeleteStep'))) return;
    try {
      await deleteWorkflowEtapeOrganisation(orgId, step.id);
      await loadSteps();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur';
      setError(msg);
    }
  };

  const handleToggleActif = async (step: WorkflowEtapeOrganisationRow) => {
    if (!orgId) return;
    try {
      await updateWorkflowEtapeOrganisation(orgId, step.id, { actif: !step.actif });
      await loadSteps();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur';
      setError(msg);
    }
  };

  if (!currentUser) return null;

  return (
    <AdminOrganisationLayout title={t('admin.workflows')} activeNav="workflows">
      <div className={styles.workflows__container}>
        <div className={styles.workflows__header}>
          <div className={styles.workflows__headerContent}>
            <div className={styles.workflows__headerIcon}>
              <GitBranch />
            </div>
            <div>
              <h1 className={styles.workflows__title}>{t('admin.workflows')}</h1>
              <p className={styles.workflows__subtitle}>{t('admin.workflowEtapesSubtitle')}</p>
            </div>
          </div>
          {orgId && (
            <Button variant="primary" onClick={openCreate}>
              <Plus size={18} />
              {t('admin.workflowAddStep')}
            </Button>
          )}
        </div>

        {error && (
          <div className={styles.workflows__error} role="alert">
            <span>{error}</span>
            <Button variant="secondary" size="sm" onClick={() => { setError(null); loadSteps(); }} style={{ marginTop: 8 }}>
              {t('common.retry')}
            </Button>
          </div>
        )}

        {loading && (
          <div className={styles.workflows__skeletonWrap}>
            <AdminTableSkeleton columns={5} rows={6} />
          </div>
        )}

        {!loading && !orgId && (
          <div className={styles.workflows__empty}>
            <p>{t('admin.workflowErrorLoad')}</p>
          </div>
        )}

        {!loading && orgId && steps.length === 0 && !error && (
          <div className={styles.workflows__empty}>
            <GitBranch size={48} style={{ opacity: 0.6 }} />
            <p>{t('admin.workflowNoSteps')}</p>
            <Button variant="primary" onClick={openCreate}>
              <Plus size={18} />
              {t('admin.workflowAddStep')}
            </Button>
          </div>
        )}

        {!loading && orgId && steps.length > 0 && (
          <div className={styles.workflows__tableWrap}>
            <table className={styles.workflows__table}>
              <thead>
                <tr>
                  <th>{t('admin.workflowStepOrder')}</th>
                  <th>{t('admin.workflowStepCode')}</th>
                  <th>{t('admin.workflowStepLabel')}</th>
                  <th>{t('admin.workflowStepActive')}</th>
                  <th style={{ width: 140 }}>{t('admin.action')}</th>
                </tr>
              </thead>
              <tbody>
                {steps.map((step) => (
                  <tr key={step.id}>
                    <td>{step.ordre}</td>
                    <td><code style={{ fontSize: '0.875rem', background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: 4 }}>{step.code}</code></td>
                    <td>{step.libelle}</td>
                    <td>
                      <button
                        type="button"
                        className={step.actif ? styles.workflows__badgeActive : styles.workflows__badgeInactive}
                        onClick={() => handleToggleActif(step)}
                        title={step.actif ? t('admin.active') : t('admin.disabled')}
                      >
                        {step.actif ? t('admin.active') : t('admin.disabled')}
                      </button>
                    </td>
                    <td>
                      <div className={styles.workflows__actions}>
                        <button
                          type="button"
                          className={`${styles.workflows__btn} ${styles.workflows__btnSm}`}
                          onClick={() => openEdit(step)}
                          aria-label={t('admin.workflowEditStep')}
                        >
                          <Pencil size={14} />
                          {t('admin.workflowEditStep')}
                        </button>
                        <button
                          type="button"
                          className={`${styles.workflows__btn} ${styles.workflows__btnDanger} ${styles.workflows__btnSm}`}
                          onClick={() => handleDelete(step)}
                          aria-label={t('admin.workflowDeleteStep')}
                        >
                          <Trash2 size={14} />
                          {t('admin.workflowDeleteStep')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showModal && (
          <div className={styles.workflows__modal} role="dialog" aria-modal="true">
            <div className={styles.workflows__modalContent}>
              <div className={styles.workflows__modalHeader}>
                <h2>{editingStep ? t('admin.workflowEditStep') : t('admin.workflowAddStep')}</h2>
                <button
                  type="button"
                  className={styles.workflows__closeBtn}
                  onClick={closeModal}
                  title={t('common.close')}
                  aria-label={t('common.close')}
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className={styles.workflows__modalBody}>
                  <div className={styles.workflows__formGroup}>
                    <label className={styles.workflows__label}>{t('admin.workflowStepCode')}</label>
                    <input
                      type="text"
                      className={styles.workflows__input}
                      value={form.code}
                      onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                      placeholder={t('admin.workflowStepCodePlaceholder')}
                      required
                      disabled={!!editingStep}
                    />
                  </div>
                  <div className={styles.workflows__formGroup}>
                    <label className={styles.workflows__label}>{t('admin.workflowStepLabel')}</label>
                    <input
                      type="text"
                      className={styles.workflows__input}
                      value={form.libelle}
                      onChange={(e) => setForm((f) => ({ ...f, libelle: e.target.value }))}
                      placeholder={t('admin.workflowStepLabelPlaceholder')}
                      required
                    />
                  </div>
                  <div className={styles.workflows__formGroup}>
                    <label className={styles.workflows__label}>{t('admin.workflowStepOrder')}</label>
                    <input
                      type="number"
                      min={0}
                      className={styles.workflows__input}
                      value={form.ordre}
                      onChange={(e) => setForm((f) => ({ ...f, ordre: parseInt(e.target.value, 10) || 0 }))}
                    />
                  </div>
                  <div className={styles.workflows__formGroup}>
                    <label className={styles.workflows__checkboxLabel}>
                      <input
                        type="checkbox"
                        className={styles.workflows__checkbox}
                        checked={form.actif}
                        onChange={(e) => setForm((f) => ({ ...f, actif: e.target.checked }))}
                      />
                      {t('admin.workflowStepActive')}
                    </label>
                  </div>
                </div>
                <div className={styles.workflows__modalActions}>
                  <Button type="button" variant="secondary" onClick={closeModal}>
                    {t('admin.cancel')}
                  </Button>
                  <Button type="submit" variant="primary" disabled={saving}>
                    {saving ? t('common.loading') : editingStep ? t('admin.workflowUpdateStep') : t('admin.workflowCreateStep')}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminOrganisationLayout>
  );
};

export default AdminOrganisationWorkflowsPage;
