/**
 * =====================================================
 * RETROUVONSLES - Dossier Detail Page
 * Vue détaillée d'un dossier de disparition
 * =====================================================
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDossierDetail } from '../../features/dossiers/hooks/useDossierDetail';
import { useSignalementsForDossier } from '../../features/signalements/hooks/useSignalementsForDossier';
import { useLocalisationsForDossier } from '../../features/geolocalisation/hooks/useLocalisationsForDossier';
import { useHistoriqueDossier } from '../../features/dossiers/hooks/useHistoriqueDossier';
import { DashboardLayout, HeaderAuthority, SidebarAuthority } from '../../components/layout';
import styles from './DossierDetailPage.module.css';

export const DossierDetailPage: React.FC = () => {
  const { dossierId } = useParams<{ dossierId: string }>();
  const navigate = useNavigate();
  const { dossier, isLoading, fetchDossier } = useDossierDetail();
  const { signalements, fetchSignalements } = useSignalementsForDossier();
  const { localisations, fetchLocalisations } = useLocalisationsForDossier();
  const { historique, fetchHistorique } = useHistoriqueDossier();
  const [activeTab, setActiveTab] = useState<'info' | 'signalements' | 'localisations' | 'historique'>('info');

  useEffect(() => {
    if (dossierId) {
      fetchDossier(dossierId);
      fetchSignalements(dossierId);
      fetchLocalisations(dossierId);
      fetchHistorique(dossierId);
    }
  }, [dossierId, fetchDossier, fetchSignalements, fetchLocalisations, fetchHistorique]);

  return (
    <DashboardLayout
      header={<HeaderAuthority logo={<span>RetrouvonsLes</span>} />}
      sidebar={<SidebarAuthority />}
    >
      <div className={styles.container}>
        {isLoading ? (
          <div className={styles.loading}>Chargement du dossier...</div>
        ) : dossier ? (
          <>
            {/* Header */}
            <div className={styles.header}>
              <div className={styles.headerLeft}>
                <button className={styles.backButton} onClick={() => navigate(-1)}>
                  ← Retour
                </button>
                <div className={styles.titleSection}>
                  <h1>{dossier.numero_dossier}</h1>
                  <p className={styles.subtitle}>Dossier de disparition</p>
                </div>
              </div>
              <div className={styles.headerRight}>
                <span
                  className={styles.statusBadge}
                  style={{
                    backgroundColor:
                      dossier.statut_dossier === 'en_cours'
                        ? '#ffc107'
                        : dossier.statut_dossier.includes('retrouve')
                          ? '#4caf50'
                          : '#999',
                  }}
                >
                  {dossier.statut_dossier}
                </span>
                <span
                  className={styles.urgenceBadge}
                  style={{
                    backgroundColor:
                      dossier.niveau_urgence === 'critique'
                        ? '#ff6b6b'
                        : dossier.niveau_urgence === 'urgent'
                          ? '#ffa500'
                          : '#4caf50',
                  }}
                >
                  {dossier.niveau_urgence}
                </span>
              </div>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
              {(['info', 'signalements', 'localisations', 'historique'] as const).map((tab) => (
                <button
                  key={tab}
                  className={`${styles.tab} ${activeTab === tab ? styles.active : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'info' && 'Informations'}
                  {tab === 'signalements' && 'Signalements'}
                  {tab === 'localisations' && 'Localisations'}
                  {tab === 'historique' && 'Historique'}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className={styles.content}>
              {activeTab === 'info' && (
                <div className={styles.infoSection}>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoBlock}>
                      <h3>Informations de Disparition</h3>
                      <div className={styles.infoItem}>
                        <label>Date Disparition:</label>
                        <p>{new Date(dossier.date_disparition).toLocaleDateString()}</p>
                      </div>
                      <div className={styles.infoItem}>
                        <label>Lieu Disparition:</label>
                        <p>{dossier.lieu_disparition || 'Non renseigné'}</p>
                      </div>
                      <div className={styles.infoItem}>
                        <label>Circonstances:</label>
                        <p>{dossier.circonstances || 'Non renseigné'}</p>
                      </div>
                      <div className={styles.infoItem}>
                        <label>Type Disparition:</label>
                        <p>{dossier.type_disparition || 'Non renseigné'}</p>
                      </div>
                    </div>

                    <div className={styles.infoBlock}>
                      <h3>Contact & Responsables</h3>
                      <div className={styles.infoItem}>
                        <label>Enquêteur:</label>
                        <p>{dossier.enqueteur_responsable || 'Non assigné'}</p>
                      </div>
                      <div className={styles.infoItem}>
                        <label>Contact Famille:</label>
                        <p>{dossier.contact_famille_principale || 'Non renseigné'}</p>
                      </div>
                      <div className={styles.infoItem}>
                        <label>Téléphone:</label>
                        <p>{dossier.telephone_contact || 'Non renseigné'}</p>
                      </div>
                      <div className={styles.infoItem}>
                        <label>Email:</label>
                        <p>{dossier.email_contact || 'Non renseigné'}</p>
                      </div>
                    </div>

                    <div className={styles.infoBlock}>
                      <h3>Statistiques</h3>
                      <div className={styles.statGrid}>
                        <div className={styles.stat}>
                          <span className={styles.statLabel}>Signalements</span>
                          <span className={styles.statValue}>
                            {dossier.nombre_signalements || 0}
                          </span>
                        </div>
                        <div className={styles.stat}>
                          <span className={styles.statLabel}>Alertes</span>
                          <span className={styles.statValue}>
                            {dossier.nombre_alertes_diffusees || 0}
                          </span>
                        </div>
                        <div className={styles.stat}>
                          <span className={styles.statLabel}>Vues Fiche</span>
                          <span className={styles.statValue}>
                            {dossier.nombre_vues_fiche || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.actions}>
                    <button className={styles.btn} onClick={() => navigate(`/authority/dossiers/${dossierId}/edit`)}>
                      ✏️ Éditer
                    </button>
                    <button className={styles.btn}>🚨 Créer Alerte</button>
                    <button className={styles.btn}>📊 Analyse IA</button>
                  </div>
                </div>
              )}

              {activeTab === 'signalements' && (
                <div className={styles.tabContent}>
                  <h3>Signalements Liés</h3>
                  {signalements.length > 0 ? (
                    <div className={styles.itemsList}>
                      {signalements.map((sig: any) => (
                        <div key={sig.id} className={styles.itemCard}>
                          <div className={styles.itemHeader}>
                            <h4>{sig.description || 'Signalement sans titre'}</h4>
                            <span className={styles.badge} style={{
                              backgroundColor: sig.etat === 'valide' ? '#28a745' : sig.etat === 'invalide' ? '#dc3545' : '#ffc107'
                            }}>
                              {sig.etat}
                            </span>
                          </div>
                          <p><strong>Lieu:</strong> {sig.lieu_observation || 'Non renseigné'}</p>
                          <p><strong>Date:</strong> {new Date(sig.date_observation).toLocaleDateString()}</p>
                          {sig.auteur && <p><strong>Auteur:</strong> {sig.auteur}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.empty}>Aucun signalement associé</div>
                  )}
                </div>
              )}

              {activeTab === 'localisations' && (
                <div className={styles.tabContent}>
                  <h3>Localisations Enregistrées</h3>
                  {localisations.length > 0 ? (
                    <div className={styles.itemsList}>
                      {localisations.map((loc: any) => (
                        <div key={loc.id} className={styles.itemCard}>
                          <div className={styles.itemHeader}>
                            <h4>Localisation</h4>
                            <span className={styles.badge} style={{ backgroundColor: '#007bff' }}>
                              {new Date(loc.date_localisation).toLocaleDateString()}
                            </span>
                          </div>
                          <p><strong>Lieu:</strong> {loc.lieu_localisation || 'Non renseigné'}</p>
                          {loc.latitude && loc.longitude && (
                            <p><strong>Coordonnées:</strong> {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}</p>
                          )}
                          {loc.rayon_recherche && <p><strong>Rayon recherche:</strong> {loc.rayon_recherche} km</p>}
                          {loc.description && <p><strong>Description:</strong> {loc.description}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.empty}>Aucune localisation enregistrée</div>
                  )}
                </div>
              )}

              {activeTab === 'historique' && (
                <div className={styles.tabContent}>
                  <h3>Historique des Modifications</h3>
                  {historique.length > 0 ? (
                    <div className={styles.timeline}>
                      {historique.map((entry: any) => (
                        <div key={entry.id} className={styles.timelineItem}>
                          <div className={styles.timelineDate}>
                            {new Date(entry.date_modification).toLocaleDateString()}
                          </div>
                          <div className={styles.timelineContent}>
                            <p><strong>{entry.action}</strong></p>
                            <p>{entry.description}</p>
                            {entry.modified_by && <small>Par: {entry.modified_by}</small>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.timeline}>
                      <div className={styles.timelineItem}>
                        <div className={styles.timelineDate}>
                          {new Date(dossier?.created_at || new Date()).toLocaleDateString()}
                        </div>
                        <div className={styles.timelineContent}>
                          <p>Dossier créé</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className={styles.notFound}>Dossier non trouvé</div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DossierDetailPage;
