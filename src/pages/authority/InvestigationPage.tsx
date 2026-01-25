/**
 * =====================================================
 * RETROUVONSLES - Investigation Page
 * Vue spécialisée pour l'investigation des dossiers
 * =====================================================
 */

import React, { useState } from 'react';
import { useDossiers } from '../../features/dossiers/hooks/useDossiers';
import { useSignalementsForDossier } from '../../features/signalements/hooks/useSignalementsForDossier';
import { useLocalisationsForDossier } from '../../features/geolocalisation/hooks/useLocalisationsForDossier';
import { DashboardLayout, HeaderAuthority, SidebarAuthority } from '../../components/layout';
import styles from './InvestigationPage.module.css';

export const InvestigationPage: React.FC = () => {
  const { dossiers, isLoading } = useDossiers();
  const { signalements, fetchSignalements } = useSignalementsForDossier();
  const { localisations, fetchLocalisations } = useLocalisationsForDossier();
  
  const [selectedDossier, setSelectedDossier] = useState<string | null>(null);
  const [tab, setTab] = useState<'timeline' | 'preuves' | 'suspects' | 'lieux'>('timeline');

  const dossier = dossiers.find((d) => d.id === selectedDossier);

  // Charger les signalements quand on sélectionne un dossier
  const handleSelectDossier = (dossierId: string) => {
    setSelectedDossier(dossierId);
    fetchSignalements(dossierId);
    fetchLocalisations(dossierId);
  };

  return (
    <DashboardLayout
      header={<HeaderAuthority logo={<span>RetrouvonsLes</span>} />}
      sidebar={<SidebarAuthority />}
    >
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h1>Investigation Détaillée</h1>
          <p className={styles.subtitle}>Outils d'investigation avancée pour les enquêteurs</p>
        </div>

        <div className={styles.content}>
          {/* Left Panel - Dossiers List */}
          <div className={styles.leftPanel}>
            <h2>Dossiers Actifs</h2>
            <div className={styles.dossiersList}>
              {isLoading ? (
                <p>Chargement...</p>
              ) : dossiers.filter((d) => d.statut_dossier === 'en_cours').length > 0 ? (
                dossiers
                  .filter((d) => d.statut_dossier === 'en_cours')
                  .map((d) => (
                    <div
                      key={d.id}
                      className={`${styles.dossierItem} ${selectedDossier === d.id ? styles.active : ''}`}
                      onClick={() => handleSelectDossier(d.id)}
                    >
                      <div className={styles.itemHeader}>
                        <h4>{d.numero_dossier}</h4>
                        <span
                          className={styles.urgenceBadge}
                          style={{
                            backgroundColor:
                              d.niveau_urgence === 'critique'
                                ? '#ff6b6b'
                                : d.niveau_urgence === 'urgent'
                                  ? '#ffa500'
                                  : '#4caf50',
                          }}
                        >
                          {d.niveau_urgence}
                        </span>
                      </div>
                      <p className={styles.itemMeta}>
                        {d.nombre_signalements || 0} signalements
                      </p>
                    </div>
                  ))
              ) : (
                <p className={styles.empty}>Aucun dossier actif</p>
              )}
            </div>
          </div>

          {/* Right Panel - Investigation View */}
          <div className={styles.rightPanel}>
            {dossier ? (
              <>
                {/* Investigation Header */}
                <div className={styles.investigationHeader}>
                  <h2>{dossier.numero_dossier}</h2>
                  <p>{dossier.lieu_disparition || 'Localisation inconnue'}</p>
                </div>

                {/* Tabs */}
                <div className={styles.tabsContainer}>
                  {(['timeline', 'preuves', 'suspects', 'lieux'] as const).map((t) => (
                    <button
                      key={t}
                      className={`${styles.tab} ${tab === t ? styles.active : ''}`}
                      onClick={() => setTab(t)}
                    >
                      {t === 'timeline' && '📅 Timeline'}
                      {t === 'preuves' && '🔍 Preuves'}
                      {t === 'suspects' && '👥 Suspects'}
                      {t === 'lieux' && '📍 Lieux'}
                    </button>
                  ))}
                </div>

                {/* Content */}
                <div className={styles.tabContent}>
                  {tab === 'timeline' && (
                    <div className={styles.timeline}>
                      <div className={styles.timelineItem}>
                        <div className={styles.timelineDate}>
                          {new Date(dossier.date_disparition).toLocaleDateString()}
                        </div>
                        <div className={styles.timelineContent}>
                          <p className={styles.timelineTitle}>Disparition</p>
                          <p className={styles.timelineDesc}>
                            {dossier.circonstances || 'Circonstances non renseignées'}
                          </p>
                        </div>
                      </div>

                      {dossier.date_derniere_observation && (
                        <div className={styles.timelineItem}>
                          <div className={styles.timelineDate}>
                            {new Date(dossier.date_derniere_observation).toLocaleDateString()}
                          </div>
                          <div className={styles.timelineContent}>
                            <p className={styles.timelineTitle}>Dernière observation</p>
                            <p className={styles.timelineDesc}>
                              {dossier.derniere_activite_connue || 'Non renseignée'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {tab === 'preuves' && (
                    <div className={styles.evidenceSection}>
                      <h3>Preuves et Documents</h3>
                      {signalements && signalements.length > 0 ? (
                        <div className={styles.itemsList}>
                          {signalements.map((sig: any) => (
                            <div key={sig.id} className={styles.itemCard}>
                              <h4>{sig.description || 'Preuve sans titre'}</h4>
                              <p><strong>Lieu:</strong> {sig.lieu_observation || 'Non renseigné'}</p>
                              <p><strong>Date:</strong> {new Date(sig.date_observation).toLocaleDateString()}</p>
                              <small>État: {sig.etat}</small>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className={styles.empty}>Aucune preuve documentée</div>
                      )}
                      <button className={styles.addButton}>➕ Ajouter une Preuve</button>
                    </div>
                  )}

                  {tab === 'suspects' && (
                    <div className={styles.suspectsSection}>
                      <h3>Suspects et Personnes d'Intérêt</h3>
                      {signalements && signalements.length > 0 ? (
                        <div className={styles.itemsList}>
                          {signalements.map((sig: any) => (
                            <div key={sig.id} className={styles.itemCard}>
                              <h4>Témoin/Suspect du signalement</h4>
                              <p><strong>Description:</strong> {sig.description || 'Aucune description'}</p>
                              <p><strong>Lieu signalement:</strong> {sig.lieu_observation || 'Non renseigné'}</p>
                              <p><strong>État:</strong> {sig.etat}</p>
                              {sig.auteur && <p><strong>Auteur:</strong> {sig.auteur}</p>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className={styles.empty}>Aucun suspect enregistré</div>
                      )}
                      <button className={styles.addButton}>➕ Ajouter un Suspect</button>
                    </div>
                  )}

                  {tab === 'lieux' && (
                    <div className={styles.locationsSection}>
                      <h3>Lieux d'Intérêt</h3>
                      <div className={styles.locationsList}>
                        <div className={styles.locationItem}>
                          <h4>Lieu de Disparition</h4>
                          <p>{dossier.lieu_disparition || 'Non renseigné'}</p>
                          {dossier.latitude_disparition && dossier.longitude_disparition && (
                            <p className={styles.coordinates}>
                              {dossier.latitude_disparition.toFixed(4)}, {dossier.longitude_disparition.toFixed(4)}
                            </p>
                          )}
                        </div>
                        {localisations && localisations.length > 0 && (
                          <>
                            <div className={styles.divider} />
                            {localisations.map((loc: any, idx: number) => (
                              <div key={idx} className={styles.locationItem}>
                                <h4>Localisation {idx + 1}</h4>
                                <p>{loc.lieu_localisation || 'Sans nom'}</p>
                                {loc.latitude && loc.longitude && (
                                  <p className={styles.coordinates}>
                                    {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                                  </p>
                                )}
                                <small>{new Date(loc.date_localisation).toLocaleDateString()}</small>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                      <button className={styles.addButton}>➕ Ajouter Lieu</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className={styles.noSelection}>
                Sélectionnez un dossier pour commencer l'investigation
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InvestigationPage;
