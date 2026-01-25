/**
 * =====================================================
 * RETROUVONSLES - Operator Dossier Detail Page
 * Vue détaillée d'un dossier pour l'opérateur
 * =====================================================
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useI18n } from '../../hooks';
import { useDossierDetail } from '../../features/dossiers/hooks/useDossierDetail';
import { useSignalementsForDossier } from '../../features/signalements/hooks/useSignalementsForDossier';
import { useLocalisationsForDossier } from '../../features/geolocalisation/hooks/useLocalisationsForDossier';
import { OperatorLayout } from './OperatorLayout';
import { 
  FileText, 
  ArrowLeft, 
  Edit3, 
  Loader2,
  Info,
  MapPin,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  BarChart3
} from 'lucide-react';
import styles from './DossierDetailPage.module.css';

export const OperatorDossierDetailPage: React.FC = () => {
  const { dossierId } = useParams<{ dossierId: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { dossier, isLoading, fetchDossier } = useDossierDetail();
  const { signalements, fetchSignalements } = useSignalementsForDossier();
  const { localisations, fetchLocalisations } = useLocalisationsForDossier();
  const [activeTab, setActiveTab] = useState<'info' | 'signalements' | 'localisations'>('info');

  useEffect(() => {
    if (dossierId) {
      fetchDossier(dossierId);
      fetchSignalements(dossierId);
      fetchLocalisations(dossierId);
    }
  }, [dossierId, fetchDossier, fetchSignalements, fetchLocalisations]);

  const getStatusColor = (status: string) => {
    if (status === 'en_cours') return '#ea580c';
    if (status.includes('retrouve')) return '#10b981';
    return '#64748b';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'en_cours') return <Clock size={18} />;
    if (status.includes('retrouve')) return <CheckCircle2 size={18} />;
    return <XCircle size={18} />;
  };

  const tabs = [
    { key: 'info', label: 'Informations', icon: Info },
    { key: 'signalements', label: 'Signalements', icon: AlertCircle },
    { key: 'localisations', label: 'Localisations', icon: MapPin }
  ];

  return (
    <OperatorLayout title={dossier?.numero_dossier || t('operator.dossierDetailTitle')}>
      {isLoading ? (
        <div className={styles['operator-dossier-detail__loading-state']}>
          <Loader2 className={styles['operator-dossier-detail__spinner']} />
          <p className={styles['operator-dossier-detail__loading-text']}>{t('common.loading')}</p>
        </div>
      ) : dossier ? (
        <>
          {/* Header */}
          <div className={styles['operator-dossier-detail__header']}>
            <div className={styles['operator-dossier-detail__header-top']}>
              <button 
                className={styles['operator-dossier-detail__back-button']} 
                onClick={() => navigate('/operator/my-dossiers')}
              >
                <ArrowLeft size={18} />
                <span>{t('operator.backToDossiers')}</span>
              </button>
            </div>

            <div className={styles.dossierDetail__headerMain}>
              <div className={styles.dossierDetail__headerLeft}>
                <div className={styles.dossierDetail__headerIcon}>
                  <FileText />
                </div>
                <div>
                  <h3 className={styles.dossierDetail__dossierNumber}>{dossier.numero_dossier}</h3>
                  <p className={styles.dossierDetail__subtitle}>Dossier de disparition</p>
                </div>
              </div>
              <div className={styles.dossierDetail__headerRight}>
                <div 
                  className={styles.dossierDetail__statusBadge}
                  style={{ backgroundColor: `${getStatusColor(dossier.statut_dossier)}15` }}
                >
                  {getStatusIcon(dossier.statut_dossier)}
                  <span style={{ color: getStatusColor(dossier.statut_dossier) }}>
                    {dossier.statut_dossier}
                  </span>
                </div>
                <button 
                  className={styles.dossierDetail__editBtn} 
                  onClick={() => navigate(`/operator/edit-dossier/${dossier.id}`)}
                >
                  <Edit3 size={18} />
                  <span>Éditer</span>
                </button>
              </div>
            </div>
          </div>

            {/* Tabs */}
            <div className={styles.dossierDetail__tabs}>
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.key}
                    className={`${styles.dossierDetail__tab} ${activeTab === tab.key ? styles['dossierDetail__tab--active'] : ''}`}
                    onClick={() => setActiveTab(tab.key as any)}
                  >
                    <IconComponent size={18} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div className={styles.dossierDetail__content}>
              {activeTab === 'info' && (
                <div className={styles.dossierDetail__infoGrid}>
                  {/* Informations de Disparition */}
                  <div className={styles.dossierDetail__card}>
                    <div className={styles.dossierDetail__cardHeader}>
                      <Calendar className={styles.dossierDetail__cardIcon} />
                      <h3 className={styles.dossierDetail__cardTitle}>Informations de Disparition</h3>
                    </div>
                    <div className={styles.dossierDetail__cardBody}>
                      <div className={styles.dossierDetail__infoItem}>
                        <label className={styles.dossierDetail__infoLabel}>Date Disparition:</label>
                        <p className={styles.dossierDetail__infoValue}>
                          {new Date(dossier.date_disparition).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className={styles.dossierDetail__infoItem}>
                        <label className={styles.dossierDetail__infoLabel}>Lieu Disparition:</label>
                        <p className={styles.dossierDetail__infoValue}>
                          {dossier.lieu_disparition || 'Non renseigné'}
                        </p>
                      </div>
                      <div className={styles.dossierDetail__infoItem}>
                        <label className={styles.dossierDetail__infoLabel}>Circonstances:</label>
                        <p className={styles.dossierDetail__infoValue}>
                          {dossier.circonstances || 'Non renseigné'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Contacts */}
                  <div className={styles.dossierDetail__card}>
                    <div className={styles.dossierDetail__cardHeader}>
                      <Phone className={styles.dossierDetail__cardIcon} />
                      <h3 className={styles.dossierDetail__cardTitle}>Contacts</h3>
                    </div>
                    <div className={styles.dossierDetail__cardBody}>
                      <div className={styles.dossierDetail__infoItem}>
                        <label className={styles.dossierDetail__infoLabel}>Contact Famille:</label>
                        <p className={styles.dossierDetail__infoValue}>
                          {dossier.contact_famille_principale || 'Non renseigné'}
                        </p>
                      </div>
                      <div className={styles.dossierDetail__infoItem}>
                        <label className={styles.dossierDetail__infoLabel}>
                          <Phone size={14} />
                          Téléphone:
                        </label>
                        <p className={styles.dossierDetail__infoValue}>
                          {dossier.telephone_contact || 'Non renseigné'}
                        </p>
                      </div>
                      <div className={styles.dossierDetail__infoItem}>
                        <label className={styles.dossierDetail__infoLabel}>
                          <Mail size={14} />
                          Email:
                        </label>
                        <p className={styles.dossierDetail__infoValue}>
                          {dossier.email_contact || 'Non renseigné'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Statistiques */}
                  <div className={styles.dossierDetail__card}>
                    <div className={styles.dossierDetail__cardHeader}>
                      <BarChart3 className={styles.dossierDetail__cardIcon} />
                      <h3 className={styles.dossierDetail__cardTitle}>Statistiques</h3>
                    </div>
                    <div className={styles.dossierDetail__statsGrid}>
                      <div className={styles.dossierDetail__statItem}>
                        <AlertCircle className={styles.dossierDetail__statIcon} />
                        <div>
                          <span className={styles.dossierDetail__statLabel}>Signalements</span>
                          <span className={styles.dossierDetail__statValue}>{signalements.length}</span>
                        </div>
                      </div>
                      <div className={styles.dossierDetail__statItem}>
                        <MapPin className={styles.dossierDetail__statIcon} />
                        <div>
                          <span className={styles.dossierDetail__statLabel}>Localisations</span>
                          <span className={styles.dossierDetail__statValue}>{localisations.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'signalements' && (
                <div className={styles.dossierDetail__tabContent}>
                  <div className={styles.dossierDetail__tabHeader}>
                    <AlertCircle className={styles.dossierDetail__tabHeaderIcon} />
                    <h3 className={styles.dossierDetail__tabTitle}>Signalements Liés</h3>
                  </div>
                  {signalements.length > 0 ? (
                    <div className={styles.dossierDetail__itemsGrid}>
                      {signalements.map((sig: any) => (
                        <div key={sig.id} className={styles.dossierDetail__itemCard}>
                          <h4 className={styles.dossierDetail__itemTitle}>
                            {sig.description || 'Signalement sans titre'}
                          </h4>
                          <div className={styles.dossierDetail__itemMeta}>
                            <div className={styles.dossierDetail__itemMetaItem}>
                              <MapPin size={14} />
                              <span>{sig.lieu_observation || 'Non renseigné'}</span>
                            </div>
                            <div className={styles.dossierDetail__itemMetaItem}>
                              <Calendar size={14} />
                              <span>{new Date(sig.date_observation).toLocaleDateString('fr-FR')}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.dossierDetail__emptyState}>
                      <AlertCircle className={styles.dossierDetail__emptyIcon} />
                      <p className={styles.dossierDetail__emptyText}>Aucun signalement</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'localisations' && (
                <div className={styles.dossierDetail__tabContent}>
                  <div className={styles.dossierDetail__tabHeader}>
                    <MapPin className={styles.dossierDetail__tabHeaderIcon} />
                    <h3 className={styles.dossierDetail__tabTitle}>Localisations Enregistrées</h3>
                  </div>
                  {localisations.length > 0 ? (
                    <div className={styles.dossierDetail__itemsGrid}>
                      {localisations.map((loc: any) => (
                        <div key={loc.id} className={styles.dossierDetail__itemCard}>
                          <h4 className={styles.dossierDetail__itemTitle}>
                            {loc.lieu_localisation || 'Localisation'}
                          </h4>
                          <div className={styles.dossierDetail__itemMeta}>
                            <div className={styles.dossierDetail__itemMetaItem}>
                              <Calendar size={14} />
                              <span>{new Date(loc.date_localisation).toLocaleDateString('fr-FR')}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.dossierDetail__emptyState}>
                      <MapPin className={styles.dossierDetail__emptyIcon} />
                      <p className={styles.dossierDetail__emptyText}>Aucune localisation</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className={styles.dossierDetail__notFound}>
            <FileText className={styles.dossierDetail__notFoundIcon} />
            <p className={styles.dossierDetail__notFoundText}>Dossier non trouvé</p>
          </div>
        )}
    </OperatorLayout>
  );
};

export default OperatorDossierDetailPage;