/**
 * =====================================================
 * RETROUVONSLES - Admin Report Detail Page
 * Consultation d'un signalement et validation (approuver / rejeter)
 * =====================================================
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  Loader2,
  Folder,
} from 'lucide-react';
import { useAppSelector } from '../../store/types';
import { AdminOrganisationLayout } from './AdminOrganisationLayout';
import { Card, CardBody, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useI18n } from '../../hooks';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { NomRole } from '../../@types/enums.types';
import {
  getAdminSignalementById,
  updateSignalementValidation,
} from '../../features/admin-organisation/services';
import type { AdminSignalementRow } from '../../features/admin-organisation/services';
import styles from './RapportDetailPage.module.css';

const STATUT_MAP: Record<string, 'approuve' | 'en_attente' | 'rejete'> = {
  valide: 'approuve',
  en_attente: 'en_attente',
  invalide: 'rejete',
  spam: 'rejete',
  doublonne: 'rejete',
};

export const AdminOrganisationRapportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const currentUser = useAppSelector(selectCurrentUser);
  const [rapport, setRapport] = useState<AdminSignalementRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioning, setActioning] = useState<'approve' | 'reject' | null>(null);

  useEffect(() => {
    const orgId = currentUser?.organisation_id;
    if (!orgId || !id) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAdminSignalementById(orgId, id);
        setRapport(data || null);
        if (!data) setError(t('admin.reportNotFound'));
      } catch (e: any) {
        setError(e?.message || t('admin.errorLoadingReport'));
      } finally {
        setLoading(false);
      }
    })();
  }, [currentUser?.organisation_id, id, t]);

  const handleApprove = async () => {
    if (!currentUser?.id || !id) return;
    setActioning('approve');
    try {
      await updateSignalementValidation(id, 'valide', currentUser.id);
      const data = await getAdminSignalementById(currentUser.organisation_id!, id);
      setRapport(data || null);
    } catch (e: any) {
      setError(e?.message || t('admin.errorLoadingReport'));
    } finally {
      setActioning(null);
    }
  };

  const handleReject = async () => {
    if (!currentUser?.id || !id) return;
    setActioning('reject');
    try {
      await updateSignalementValidation(id, 'invalide', currentUser.id);
      const data = await getAdminSignalementById(currentUser.organisation_id!, id);
      setRapport(data || null);
    } catch (e: any) {
      setError(e?.message || t('admin.errorLoadingReport'));
    } finally {
      setActioning(null);
    }
  };

  if (!currentUser || currentUser.role !== NomRole.ADMIN_ORGANISATION) {
    navigate('/auth/login');
    return null;
  }

  const statut = rapport ? STATUT_MAP[(rapport as any).statut_validation] || 'en_attente' : 'en_attente';
  const dossier = (rapport as any)?.dossier;
  const utilisateur = (rapport as any)?.utilisateur;
  const auteur = utilisateur
    ? `${utilisateur.nom || ''} ${utilisateur.prenom || ''}`.trim() || utilisateur.email || t('common.notAvailable')
    : t('common.notAvailable');

  return (
    <AdminOrganisationLayout title={t('admin.rapports')} activeNav="rapports">
      <div className={styles.page}>
        <div className={styles.header}>
          <button type="button" className={styles.backBtn} onClick={() => navigate('/admin/rapports')} title={t('common.back')} aria-label={t('common.back')}>
            <ArrowLeft size={20} />
            {t('common.back')}
          </button>
        </div>

        {loading ? (
          <div className={styles.loading}>
            <Loader2 className={styles.spinner} size={32} />
            <p>{t('common.loading')}</p>
          </div>
        ) : error || !rapport ? (
          <Card>
            <CardBody>
              <p className={styles.error}>{error || t('admin.noReportsFound')}</p>
              <Button variant="secondary" onClick={() => navigate('/admin/rapports')}>
                {t('common.back')}
              </Button>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className={styles.titleRow}>
                <h1 className={styles.title}>
                  <FileText size={24} />
                  {(rapport as any).numero_signalement || `${t('admin.reportNumberPrefix')}${rapport.id.slice(0, 8)}`}
                </h1>
                <Badge
                  variant={
                    statut === 'approuve' ? 'success' : statut === 'rejete' ? 'danger' : 'warning'
                  }
                >
                  {statut === 'approuve'
                    ? t('admin.approved')
                    : statut === 'rejete'
                    ? t('admin.rejected')
                    : t('admin.pending')}
                </Badge>
              </div>
            </CardHeader>
            <CardBody>
              <div className={styles.grid}>
                <div className={styles.field}>
                  <label><Folder size={16} /> {t('admin.dossier')}</label>
                  <span className={styles.value}>
                    {dossier?.numero_dossier || (rapport as any).id_dossier || t('common.notAvailable')}
                  </span>
                </div>
                <div className={styles.field}>
                  <label><User size={16} /> {t('admin.author')}</label>
                  <span className={styles.value}>{auteur}</span>
                </div>
                <div className={styles.field}>
                  <label><Calendar size={16} /> {t('admin.date')}</label>
                  <span className={styles.value}>
                    {(rapport as any).date_observation
                      ? new Date((rapport as any).date_observation).toLocaleString()
                      : t('common.notAvailable')}
                  </span>
                </div>
                <div className={styles.fieldFull}>
                  <label>{t('admin.description')}</label>
                  <p className={styles.description}>{rapport.description || t('common.notAvailable')}</p>
                </div>
              </div>

              {statut === 'en_attente' && (
                <div className={styles.actions}>
                  <Button
                    variant="primary"
                    onClick={handleApprove}
                    disabled={!!actioning}
                    title={t('admin.approveReport')}
                    aria-label={t('admin.approveReport')}
                  >
                    {actioning === 'approve' ? (
                      <Loader2 size={18} className={styles.spinner} />
                    ) : (
                      <CheckCircle size={18} />
                    )}
                    {t('admin.approveReport')}
                  </Button>
                  <Button
                    variant="danger"
                    onClick={handleReject}
                    disabled={!!actioning}
                    title={t('admin.rejectReport')}
                    aria-label={t('admin.rejectReport')}
                  >
                    {actioning === 'reject' ? (
                      <Loader2 size={18} className={styles.spinner} />
                    ) : (
                      <XCircle size={18} />
                    )}
                    {t('admin.rejectReport')}
                  </Button>
                </div>
              )}

              <div className={styles.footer}>
                <Button variant="secondary" onClick={() => navigate('/admin/rapports')}>
                  {t('common.back')}
                </Button>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </AdminOrganisationLayout>
  );
};

export default AdminOrganisationRapportDetailPage;
