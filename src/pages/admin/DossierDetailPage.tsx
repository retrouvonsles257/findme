/**
 * =====================================================
 * RETROUVONSLES - Admin Dossier Detail Page
 * Consultation d'un dossier de l'organisation
 * =====================================================
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Folder, Calendar, MapPin, User, Loader2 } from 'lucide-react';
import { useAppSelector } from '../../store/types';
import { AdminOrganisationLayout } from './AdminOrganisationLayout';
import { Card, CardBody, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useI18n } from '../../hooks';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { NomRole } from '../../@types/enums.types';
import { getAdminDossierById } from '../../features/admin-organisation/services';
import type { AdminDossierRow } from '../../features/admin-organisation/services';
import styles from './DossierDetailPage.module.css';

export const AdminOrganisationDossierDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const currentUser = useAppSelector(selectCurrentUser);
  const [dossier, setDossier] = useState<AdminDossierRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const orgId = currentUser?.organisation_id;
    if (!orgId || !id) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAdminDossierById(orgId, id);
        setDossier(data || null);
        if (!data) setError(t('admin.dossierNotFound'));
      } catch (e: any) {
        setError(e?.message || t('admin.errorLoadingDossier'));
      } finally {
        setLoading(false);
      }
    })();
  }, [currentUser?.organisation_id, id, t]);

  if (!currentUser || currentUser.role !== NomRole.ADMIN_ORGANISATION) {
    navigate('/auth/login');
    return null;
  }

  const personne = dossier?.personne as { nom?: string; prenom?: string; nom_complet?: string } | undefined;
  const nomPersonne =
    personne?.nom_complet ||
    [personne?.nom, personne?.prenom].filter(Boolean).join(' ').trim() ||
    '—';

  return (
    <AdminOrganisationLayout title={dossier?.numero_dossier || t('admin.dossier')} activeNav="dossiers">
      <div className={styles.page}>
        <div className={styles.header}>
          <button type="button" className={styles.backBtn} onClick={() => navigate('/admin/dossiers')}>
            <ArrowLeft size={20} />
            {t('common.back')}
          </button>
        </div>

        {loading ? (
          <div className={styles.loading}>
            <Loader2 className={styles.spinner} size={32} />
            <p>{t('common.loading')}</p>
          </div>
        ) : error || !dossier ? (
          <Card>
            <CardBody>
              <p className={styles.error}>{error || t('admin.noDossiersFound')}</p>
              <Button variant="secondary" onClick={() => navigate('/admin/dossiers')}>
                {t('common.back')}
              </Button>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className={styles.titleRow}>
                <h1 className={styles.title}>
                  <Folder size={24} />
                  {dossier.numero_dossier || `#${dossier.id.slice(0, 8)}`}
                </h1>
                <div className={styles.badges}>
                  <Badge variant="info">{t(`admin.status.${dossier.statut_dossier}`)}</Badge>
                  <Badge variant="warning">{t(`admin.urgence.${dossier.niveau_urgence}`)}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              <div className={styles.grid}>
                <div className={styles.field}>
                  <label><User size={16} /> {t('common.name')}</label>
                  <span className={styles.value}>{nomPersonne}</span>
                </div>
                <div className={styles.field}>
                  <label><Calendar size={16} /> {t('admin.date')}</label>
                  <span className={styles.value}>
                    {dossier.date_disparition
                      ? new Date(dossier.date_disparition).toLocaleDateString()
                      : '—'}
                  </span>
                </div>
                <div className={styles.field}>
                  <label><MapPin size={16} /> {t('common.location')}</label>
                  <span className={styles.value}>
                    {[dossier.ville_disparition, dossier.lieu_disparition, dossier.region_disparition]
                      .filter(Boolean)
                      .join(', ') || '—'}
                  </span>
                </div>
                <div className={styles.fieldFull}>
                  <label>{t('admin.description')}</label>
                  <p className={styles.circonstances}>{dossier.circonstances || '—'}</p>
                </div>
              </div>
              <div className={styles.footer}>
                <Button variant="secondary" onClick={() => navigate('/admin/dossiers')}>
                  {t('common.back')}
                </Button>
                <Button variant="primary" onClick={() => navigate(`/admin/dossiers/${dossier.id}/edit`)}>
                  {t('admin.edit')} {t('admin.dossier')}
                </Button>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </AdminOrganisationLayout>
  );
};

export default AdminOrganisationDossierDetailPage;
