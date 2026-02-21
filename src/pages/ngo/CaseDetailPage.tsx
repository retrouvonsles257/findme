/**
 * =====================================================
 * RETROUVONSLES - NGO Case Detail Page
 * Vue détaillée d'un dossier (lecture seule + lien Modifier si organisation)
 * =====================================================
 */

import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, FileText, MapPin, User, Phone, Mail, Calendar } from 'lucide-react';
import { useDossierDetail } from '../../features/dossiers/hooks/useDossierDetail';
import { useAppSelector } from '../../store/types';
import { selectUser } from '../../features/auth/store/authSelectors';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { NGOLayout } from './NGOLayout';
import { AdminDetailSkeleton } from '../admin/skeletons';
import { useI18n } from '../../hooks';
import styles from './CaseDetailPage.module.css';

export const NGOCaseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { dossier, isLoading, error, fetchDossier } = useDossierDetail();
  const authUser = useAppSelector(selectUser) as { organisation_id?: string } | null;
  const currentUser = useAppSelector(selectCurrentUser) as { organisation_id?: string } | null;
  const organisationId = currentUser?.organisation_id ?? authUser?.organisation_id ?? null;

  useEffect(() => {
    if (id) fetchDossier(id);
  }, [id, fetchDossier]);

  const canEdit =
    organisationId &&
    dossier &&
    (dossier as any).id_organisation_responsable === organisationId;

  const personne = dossier && (dossier as any).personne;
  const nomComplet =
    personne?.nom_complet ||
    (personne ? `${personne.prenom || ''} ${personne.nom || ''}`.trim() : '') ||
    '—';

  if (isLoading) {
    return (
      <NGOLayout>
        <div className={styles.skeletonWrap}>
          <AdminDetailSkeleton blockCount={3} linesPerBlock={4} />
        </div>
      </NGOLayout>
    );
  }

  if (error || !dossier) {
    return (
      <NGOLayout>
        <div className={styles.error}>
          <p>{error || t('common.errorLoadingData')}</p>
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
            onClick={() => navigate('/ngo/cases')}
            aria-label={t('common.back')}
          >
            <ArrowLeft size={18} />
            {t('common.back')}
          </button>
          {canEdit && (
            <button
              type="button"
              className={styles.editBtn}
              onClick={() => navigate(`/ngo/cases/${id}/edit`)}
            >
              <Edit size={18} />
              {t('common.edit')}
            </button>
          )}
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <FileText size={24} />
            <h2>{dossier.numero_dossier}</h2>
            <span
              className={styles.badge}
              data-status={(dossier as any).statut_dossier || 'en_cours'}
            >
              {(dossier as any).statut_dossier || 'en_cours'}
            </span>
          </div>

          <section className={styles.section}>
            <h3><User size={18} /> {t('ngo.personInfo')}</h3>
            <p className={styles.value}>{nomComplet}</p>
          </section>

          <section className={styles.section}>
            <h3><Calendar size={18} /> {t('ngo.missingDate')}</h3>
            <p className={styles.value}>
              {dossier.date_disparition
                ? new Date(dossier.date_disparition).toLocaleDateString('fr-FR')
                : '—'}
            </p>
          </section>

          <section className={styles.section}>
            <h3><MapPin size={18} /> {t('common.location')}</h3>
            <p className={styles.value}>
              {[dossier.lieu_disparition, dossier.ville_disparition, dossier.region_disparition]
                .filter(Boolean)
                .join(', ') || '—'}
            </p>
          </section>

          <section className={styles.section}>
            <h3><FileText size={18} /> Circonstances</h3>
            <p className={styles.value}>{dossier.circonstances || '—'}</p>
          </section>

          <section className={styles.section}>
            <h3><Phone size={18} /> {t('ngo.contactFamily')}</h3>
            <p className={styles.value}>
              {(dossier as any).contact_famille_principale || '—'}
            </p>
            <p className={styles.value}>
              <Phone size={14} /> {(dossier as any).telephone_contact || '—'}
            </p>
            <p className={styles.value}>
              <Mail size={14} /> {(dossier as any).email_contact || '—'}
            </p>
          </section>
        </div>
      </div>
    </NGOLayout>
  );
};
