import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../config/supabase.config';
import styles from './DossierDetailPage.module.css';

interface Dossier {
  id: string;
  nom: string;
  prenom: string;
  age: number;
  description: string;
  localisation: string;
  photo_url?: string;
  statut: 'active' | 'resolved' | 'closed';
  date_creation: string;
  date_disparition: string;
}

interface Signalement {
  id: string;
  description: string;
  localisation: string;
  date_observation: string;
}

interface Avis {
  id: string;
  contenu: string;
  date_avis: string;
}

export const DossierDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [signalements, setSignalements] = useState<Signalement[]>([]);
  const [avis, setAvis] = useState<Avis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!id) {
          setError(t('detail.dossier_not_found'));
          return;
        }

        // Load dossier
        const { data: dossierData, error: dossierErr } = await supabase
          .from('dossiers')
          .select('*')
          .eq('id', id)
          .single();

        if (dossierErr) throw dossierErr;
        if (!dossierData) {
          setError(t('detail.dossier_not_found'));
          return;
        }

        setDossier(dossierData as Dossier);

        // Load signalements
        const { data: signalData, error: signalErr } = await supabase
          .from('signalement')
          .select('*')
          .eq('dossier_id', id)
          .order('date_observation', { ascending: false });

        if (!signalErr && signalData) {
          setSignalements(signalData as Signalement[]);
        }

        // Load avis
        const { data: avisData, error: avisErr } = await supabase
          .from('avis')
          .select('*')
          .eq('dossier_id', id)
          .order('date_avis', { ascending: false });

        if (!avisErr && avisData) {
          setAvis(avisData as Avis[]);
        }
      } catch (err) {
        console.error('Error loading dossier details:', err);
        setError(t('detail.error_loading'));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, t]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#e74c3c';
      case 'resolved':
        return '#27ae60';
      case 'closed':
        return '#95a5a6';
      default:
        return '#7f8c8d';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return t('status.active');
      case 'resolved':
        return t('status.resolved');
      case 'closed':
        return t('status.closed');
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
            <p>{t('detail.loading')}</p>
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
              {t('detail.back')}
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
          ← {t('detail.back')}
        </button>

        <div className={styles.detailContent}>
          <div className={styles.photoSection}>
            {dossier.photo_url && (
              <img 
                src={dossier.photo_url} 
                alt={`${dossier.prenom} ${dossier.nom}`}
                className={styles.photoImage}
              />
            )}
            <div className={styles.photoOverlay}></div>
          </div>

          <div className={styles.infoSection}>
            <div className={styles.header}>
              <h1>{dossier.prenom} {dossier.nom}</h1>
              <span 
                className={styles.statusBadge}
                style={{ backgroundColor: getStatusColor(dossier.statut) }}
              >
                {getStatusLabel(dossier.statut)}
              </span>
            </div>

            <div className={styles.basicInfo}>
              <div className={styles.infoRow}>
                <strong>{t('detail.age')}:</strong>
                <span>{dossier.age} ans</span>
              </div>
              <div className={styles.infoRow}>
                <strong>{t('detail.location')}:</strong>
                <span>{dossier.localisation}</span>
              </div>
              <div className={styles.infoRow}>
                <strong>{t('detail.missing_date')}:</strong>
                <span>{new Date(dossier.date_disparition).toLocaleDateString()}</span>
              </div>
              <div className={styles.infoRow}>
                <strong>{t('detail.reported_date')}:</strong>
                <span>{new Date(dossier.date_creation).toLocaleDateString()}</span>
              </div>
            </div>

            {dossier.description && (
              <div className={styles.description}>
                <h3>{t('detail.description')}</h3>
                <p>{dossier.description}</p>
              </div>
            )}

            <div className={styles.actionButtons}>
              <button className={styles.reportBtn}>
                {t('detail.report_sighting')}
              </button>
              <button className={styles.shareBtn}>
                {t('detail.share')}
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
              {t('detail.tabs.details')}
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'signals' ? styles.active : ''}`}
              onClick={() => setActiveTab('signals')}
            >
              {t('detail.tabs.signals')} ({signalements.length})
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'opinions' ? styles.active : ''}`}
              onClick={() => setActiveTab('opinions')}
            >
              {t('detail.tabs.opinions')} ({avis.length})
            </button>
          </div>

          <div className={styles.tabContent}>
            {activeTab === 'details' && (
              <div className={styles.detailsTab}>
                <h3>{t('detail.full_details')}</h3>
                <div className={styles.detailsList}>
                  <div className={styles.detailItem}>
                    <strong>{t('detail.id')}:</strong>
                    <span>{dossier.id}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <strong>{t('detail.name')}:</strong>
                    <span>{dossier.nom}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <strong>{t('detail.firstname')}:</strong>
                    <span>{dossier.prenom}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <strong>{t('detail.status')}:</strong>
                    <span>{getStatusLabel(dossier.statut)}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'signals' && (
              <div className={styles.signalsTab}>
                <h3>{t('detail.reports')} ({signalements.length})</h3>
                {signalements.length === 0 ? (
                  <p className={styles.emptyMessage}>{t('detail.no_signals')}</p>
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
                          <strong>{t('detail.location')}:</strong> {signal.localisation}
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

            {activeTab === 'opinions' && (
              <div className={styles.opinionsTab}>
                <h3>{t('detail.community_observations')} ({avis.length})</h3>
                {avis.length === 0 ? (
                  <p className={styles.emptyMessage}>{t('detail.no_opinions')}</p>
                ) : (
                  <div className={styles.avisList}>
                    {avis.map(avis_item => (
                      <div key={avis_item.id} className={styles.avisItem}>
                        <p className={styles.avisDate}>
                          {new Date(avis_item.date_avis).toLocaleDateString()}
                        </p>
                        <p className={styles.avisContent}>
                          {avis_item.contenu}
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
