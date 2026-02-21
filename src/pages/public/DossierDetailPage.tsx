import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useI18n } from '../../hooks';
import { supabase } from '../../config';
import { StatutDossier } from '../../@types/enums.types';
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
  niveau_urgence?: any;
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
  etat_validation?: string | null;
}

export const DossierDetailPage: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [signalements, setSignalements] = useState<Signalement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!id) {
          setError(t('public.detail.dossier_not_found'));
          return;
        }

        // Load dossier (modèle officiel)
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

        // Load signalements
        const { data: signalData, error: signalErr } = await (supabase as any)
          .from('signalement')
          .select('id, description, date_observation, lieu_observation, ville_observation, region_observation, etat_validation')
          .eq('id_dossier', id)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case StatutDossier.EN_COURS:
        return '#e74c3c';
      case StatutDossier.RETROUVE_VIVANT:
      case StatutDossier.RETROUVE_DECEDE:
        return '#27ae60';
      case StatutDossier.CLASSE_SANS_SUITE:
      case StatutDossier.SUSPENDU:
      case StatutDossier.TRANSFERE:
        return '#95a5a6';
      default:
        return '#7f8c8d';
    }
  };

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

  if (loading) {
    return (
      <div className={styles.detailPage}>
        <div className={styles.container}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
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
          <div className={styles.errorContainer}>
            <p className={styles.errorMessage}>{error}</p>
            <button 
              className={styles.backBtn}
              onClick={() => navigate('/disparitions')}
            >
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
          className={styles.backBtn}
          onClick={() => navigate('/disparitions')}
        >
          ← {t('public.detail.back')}
        </button>

        <div className={styles.detailContent}>
          <div className={styles.photoSection}>
            {dossier.personne?.photo_principale && (
              <img 
                src={dossier.personne.photo_principale} 
                alt={dossier.personne?.nom_complet || ''}
                className={styles.photoImage}
              />
            )}
            <div className={styles.photoOverlay}></div>
          </div>

          <div className={styles.infoSection}>
            <div className={styles.header}>
              <h1>
                {dossier.personne?.nom_complet ||
                  `${dossier.personne?.prenom || ''} ${dossier.personne?.nom || ''}`.trim()}
              </h1>
              <span 
                className={styles.statusBadge}
                style={{ backgroundColor: getStatusColor(dossier.statut_dossier) }}
              >
                {getStatusLabel(dossier.statut_dossier)}
              </span>
            </div>

            <div className={styles.basicInfo}>
              <div className={styles.infoRow}>
                <strong>{t('public.detail.age')}:</strong>
                <span>
                  {dossier.personne?.date_naissance
                    ? `${Math.max(0, Math.floor((Date.now() - new Date(dossier.personne.date_naissance).getTime()) / 31557600000))} ans`
                    : '—'}
                </span>
              </div>
              <div className={styles.infoRow}>
                <strong>{t('public.detail.location')}:</strong>
                <span>
                  {[dossier.lieu_disparition, dossier.ville_disparition, dossier.region_disparition, dossier.pays_disparition]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </div>
              <div className={styles.infoRow}>
                <strong>{t('public.detail.missing_date')}:</strong>
                <span>{new Date(dossier.date_disparition).toLocaleDateString()}</span>
              </div>
            </div>

            {dossier.circonstances && (
              <div className={styles.description}>
                <h3>{t('public.detail.description')}</h3>
                <p>{dossier.circonstances}</p>
              </div>
            )}

            <div className={styles.actionButtons}>
              <button className={styles.reportBtn} onClick={() => navigate('/auth/login')}>
                {t('public.detail.report_sighting')}
              </button>
              <button className={styles.shareBtn}>
                {t('public.detail.share')}
              </button>
            </div>
          </div>
        </div>

        <div className={styles.tabsSection}>
          <div className={styles.tabs}>
            <button 
              className={`${styles.tab} ${activeTab === 'details' ? styles.active : ''}`}
              onClick={() => setActiveTab('details')}
            >
              {t('public.detail.tabs.details')}
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'signals' ? styles.active : ''}`}
              onClick={() => setActiveTab('signals')}
            >
              {t('public.detail.tabs.signals')} ({signalements.length})
            </button>
          </div>

          <div className={styles.tabContent}>
            {activeTab === 'details' && (
              <div className={styles.detailsTab}>
                <h3>{t('public.detail.full_details')}</h3>
                <div className={styles.detailsList}>
                  <div className={styles.detailItem}>
                    <strong>{t('public.detail.id')}:</strong>
                    <span>{dossier.id}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <strong>{t('public.detail.status')}:</strong>
                    <span>{getStatusLabel(dossier.statut_dossier)}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'signals' && (
              <div className={styles.signalsTab}>
                <h3>{t('public.detail.reports')} ({signalements.length})</h3>
                {signalements.length === 0 ? (
                  <p className={styles.emptyMessage}>{t('public.detail.no_signals')}</p>
                ) : (
                  <div className={styles.signalsList}>
                    {signalements.map(signal => (
                      <div key={signal.id} className={styles.signalItem}>
                        <div className={styles.signalHeader}>
                          <p className={styles.signalDate}>
                            {new Date(signal.date_observation).toLocaleDateString()}
                          </p>
                        </div>
                        <p className={styles.signalLocation}>
                          <strong>{t('public.detail.location')}:</strong>{' '}
                          {[signal.lieu_observation, signal.ville_observation, signal.region_observation]
                            .filter(Boolean)
                            .join(', ') || '—'}
                        </p>
                        <p className={styles.signalDescription}>
                          {signal.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DossierDetailPage;
