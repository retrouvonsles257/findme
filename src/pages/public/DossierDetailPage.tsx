import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Share2,
  Eye,
  User,
  FileText,
} from 'lucide-react';
import { useI18n } from '../../hooks';
import { supabase } from '../../config';
import { StatutDossier } from '../../@types/enums.types';
import { PUBLIC_ROUTES } from '../../routes/routes.config';
import styles from './DossierDetailPage.module.css';

interface Dossier {
  id: string;
  date_disparition: string;
  lieu_disparition: string;
  ville_disparition?: string | null;
  region_disparition?: string | null;
  pays_disparition?: string | null;
  circonstances: string;
  statut_dossier: string;
  niveau_urgence?: unknown;
  numero_dossier?: string | null;
  personne?: {
    nom?: string | null;
    prenom?: string | null;
    nom_complet?: string | null;
    date_naissance?: string | null;
    photo_principale?: string | null;
  } | null;
}

interface Signalement {
  id: string;
  description: string;
  date_observation: string;
  lieu_observation?: string | null;
  ville_observation?: string | null;
  region_observation?: string | null;
  statut_validation?: string | null;
  visible_detail_public?: boolean | null;
}

function getStatusClass(status: string): string {
  switch (status) {
    case StatutDossier.EN_COURS:
      return styles.statusActive;
    case StatutDossier.RETROUVE_VIVANT:
    case StatutDossier.RETROUVE_DECEDE:
      return styles.statusResolved;
    default:
      return styles.statusClosed;
  }
}

export const DossierDetailPage: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [signalements, setSignalements] = useState<Signalement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'signals'>('details');
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!id) {
          setError(t('public.detail.dossier_not_found'));
          return;
        }

        const { data: dossierData, error: dossierErr } = await (supabase as any)
          .from('dossier_disparition')
          .select(`
            id,
            numero_dossier,
            date_disparition,
            lieu_disparition,
            ville_disparition,
            region_disparition,
            pays_disparition,
            circonstances,
            statut_dossier,
            niveau_urgence,
            visible_public,
            personne:id_personne (
              nom,
              prenom,
              nom_complet,
              date_naissance,
              photo_principale
            )
          `)
          .eq('id', id)
          .eq('visible_public', true)
          .single();

        if (dossierErr) throw dossierErr;
        if (!dossierData) {
          setError(t('public.detail.dossier_not_found'));
          return;
        }

        setDossier(dossierData as Dossier);

        const { data: signalData, error: signalErr } = await (supabase as any)
          .from('signalement')
          .select(
            'id, description, date_observation, lieu_observation, ville_observation, region_observation, statut_validation, visible_detail_public',
          )
          .eq('id_dossier', id)
          .eq('statut_validation', 'valide')
          .eq('visible_detail_public', true)
          .order('date_observation', { ascending: false });

        if (!signalErr && signalData) {
          setSignalements(signalData as Signalement[]);
        }
      } catch (err) {
        console.error('Error loading dossier details:', err);
        setError(t('public.detail.error_loading'));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, t]);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case StatutDossier.EN_COURS:
        return t('public.status.active');
      case StatutDossier.RETROUVE_VIVANT:
      case StatutDossier.RETROUVE_DECEDE:
        return t('public.status.resolved');
      case StatutDossier.CLASSE_SANS_SUITE:
      case StatutDossier.SUSPENDU:
      case StatutDossier.TRANSFERE:
        return t('public.status.closed');
      default:
        return status;
    }
  };

  const personName =
    dossier?.personne?.nom_complet ||
    `${dossier?.personne?.prenom || ''} ${dossier?.personne?.nom || ''}`.trim() ||
    '—';

  const locationLine = dossier
    ? [dossier.lieu_disparition, dossier.ville_disparition, dossier.region_disparition, dossier.pays_disparition]
        .filter(Boolean)
        .join(', ')
    : '';

  const ageYears = dossier?.personne?.date_naissance
    ? Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(dossier.personne.date_naissance).getTime()) / 31557600000,
        ),
      )
    : null;

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    const title = personName;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareFeedback(t('public.detail.share_copied'));
      window.setTimeout(() => setShareFeedback(null), 2500);
    } catch {
      /* annulé par l'utilisateur */
    }
  }, [personName, t]);

  if (loading) {
    return (
      <div className={styles.detailPage}>
        <div className={styles.container}>
          <div className={styles.stateCard}>
            <div className={styles.spinner} aria-hidden />
            <p>{t('public.detail.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !dossier) {
    return (
      <div className={styles.detailPage}>
        <div className={styles.container}>
          <div className={styles.stateCard}>
            <p className={styles.errorMessage}>{error}</p>
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => navigate(PUBLIC_ROUTES.DISPARITIONS)}
            >
              <ArrowLeft size={18} aria-hidden />
              {t('public.detail.back')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.detailPage}>
      <div className={styles.container}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => navigate(PUBLIC_ROUTES.DISPARITIONS)}
        >
          <ArrowLeft size={18} aria-hidden />
          {t('public.detail.back')}
        </button>

        <article className={styles.heroCard}>
          <div className={styles.photoWrap}>
            {dossier.personne?.photo_principale ? (
              <img
                src={dossier.personne.photo_principale}
                alt={personName}
                className={styles.photoImage}
              />
            ) : (
              <div className={styles.photoPlaceholder} aria-hidden>
                <User size={48} strokeWidth={1.25} />
              </div>
            )}
          </div>

          <div className={styles.heroBody}>
            <div className={styles.heroTop}>
              <h1 className={styles.personName}>{personName}</h1>
              <span className={`${styles.statusBadge} ${getStatusClass(dossier.statut_dossier)}`}>
                {getStatusLabel(dossier.statut_dossier)}
              </span>
            </div>

            {dossier.numero_dossier && (
              <p className={styles.caseRef}>
                <FileText size={14} aria-hidden />
                {dossier.numero_dossier}
              </p>
            )}

            <ul className={styles.metaList}>
              <li>
                <User size={16} aria-hidden />
                <span>
                  <strong>{t('public.detail.age')}</strong>
                  {ageYears != null ? ` ${t('public.detail.age_years', { count: ageYears })}` : ' —'}
                </span>
              </li>
              <li>
                <MapPin size={16} aria-hidden />
                <span>
                  <strong>{t('public.detail.location')}</strong> {locationLine || '—'}
                </span>
              </li>
              <li>
                <Calendar size={16} aria-hidden />
                <span>
                  <strong>{t('public.detail.missing_date')}</strong>{' '}
                  {new Date(dossier.date_disparition).toLocaleDateString()}
                </span>
              </li>
            </ul>

            {dossier.circonstances && (
              <div className={styles.circumstances}>
                <h2>{t('public.detail.description')}</h2>
                <p>{dossier.circonstances}</p>
              </div>
            )}

            <div className={styles.actionRow}>
              <Link to={PUBLIC_ROUTES.CONTRIBUTE} className={styles.primaryAction}>
                <Eye size={18} aria-hidden />
                {t('public.detail.report_sighting')}
              </Link>
              <button type="button" className={styles.secondaryAction} onClick={handleShare}>
                <Share2 size={18} aria-hidden />
                {shareFeedback ?? t('public.detail.share')}
              </button>
            </div>
          </div>
        </article>

        <section className={styles.tabsPanel} aria-label={t('public.detail.full_details')}>
          <div className={styles.tabs} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'details'}
              className={`${styles.tab} ${activeTab === 'details' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('details')}
            >
              {t('public.detail.tabs.details')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'signals'}
              className={`${styles.tab} ${activeTab === 'signals' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('signals')}
            >
              {t('public.detail.tabs.signals')} ({signalements.length})
            </button>
          </div>

          <div className={styles.tabPanel} role="tabpanel">
            {activeTab === 'details' && (
              <dl className={styles.detailsGrid}>
                <div className={styles.detailBlock}>
                  <dt>{t('public.detail.status')}</dt>
                  <dd>{getStatusLabel(dossier.statut_dossier)}</dd>
                </div>
                <div className={styles.detailBlock}>
                  <dt>{t('public.detail.id')}</dt>
                  <dd className={styles.monoId}>{dossier.id}</dd>
                </div>
              </dl>
            )}

            {activeTab === 'signals' && (
              <>
                <h3 className={styles.panelTitle}>
                  {t('public.detail.reports')} ({signalements.length})
                </h3>
                {signalements.length === 0 ? (
                  <p className={styles.emptyMessage}>{t('public.detail.no_signals')}</p>
                ) : (
                  <ul className={styles.signalsList}>
                    {signalements.map((signal) => (
                      <li key={signal.id} className={styles.signalCard}>
                        <time className={styles.signalDate} dateTime={signal.date_observation}>
                          {new Date(signal.date_observation).toLocaleDateString()}
                        </time>
                        <p className={styles.signalLocation}>
                          <MapPin size={14} aria-hidden />
                          {[signal.lieu_observation, signal.ville_observation, signal.region_observation]
                            .filter(Boolean)
                            .join(', ') || '—'}
                        </p>
                        <p className={styles.signalDescription}>{signal.description}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default DossierDetailPage;
