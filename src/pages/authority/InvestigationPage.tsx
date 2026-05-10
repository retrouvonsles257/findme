/**
 * =====================================================
 * RETROUVONSLES - Investigation Page
 * Vue spécialisée pour l'investigation des dossiers
 * Boutons fonctionnels connectés à Supabase
 * =====================================================
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { NomRole } from '../../@types/enums.types';
import { useDossiers } from '../../features/dossiers/hooks/useDossiers';
import { useSignalementsForDossier } from '../../features/signalements/hooks/useSignalementsForDossier';
import { useLocalisationsForDossier } from '../../features/geolocalisation/hooks/useLocalisationsForDossier';
import { supabase } from '../../config';
import { useNotification } from '../../contexts';
import { AuthorityLayout } from '../../components/layout';
import { useI18n } from '../../hooks';
import { AdminDetailSkeleton } from 'components/skeletons';
import {
  Search,
  Calendar,
  FileText,
  MapPin,
  Users,
  Plus,
  Eye,
  AlertTriangle,
  User,
} from 'lucide-react';
import styles from './InvestigationPage.module.css';

type TabType = 'timeline' | 'preuves' | 'suspects' | 'lieux';

interface NewPreuve {
  titre: string;
  description: string;
  type: string;
}

interface NewLocalisation {
  lieu: string;
  latitude: string;
  longitude: string;
  description: string;
}

interface NewSuspect {
  nom: string;
  description: string;
  relation: string;
}

const OPEN_DOSSIER_STATUTS = new Set(['en_cours', 'actif', 'recherche_active']);

export const InvestigationPage: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { t, language } = useI18n();
  const currentUser = useAppSelector(selectCurrentUser);
  const dossierCriteria = useMemo(() => {
    const orgId = (currentUser as { organisation_id?: string | null })?.organisation_id;
    if (currentUser?.role === NomRole.AUTORITE && orgId) {
      return { organisation_id: orgId };
    }
    return undefined;
  }, [currentUser?.role, (currentUser as { organisation_id?: string | null })?.organisation_id]);
  const { dossiers, isLoading } = useDossiers({ initialCriteria: dossierCriteria });
  const { signalements, fetchSignalements } = useSignalementsForDossier();
  const { localisations, fetchLocalisations } = useLocalisationsForDossier();

  const [selectedDossier, setSelectedDossier] = useState<string | null>(null);
  const [tab, setTab] = useState<TabType>('timeline');

  // Modal states
  const [showAddPreuveModal, setShowAddPreuveModal] = useState(false);
  const [showAddLocalisationModal, setShowAddLocalisationModal] = useState(false);
  const [showAddSuspectModal, setShowAddSuspectModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [newPreuve, setNewPreuve] = useState<NewPreuve>({ titre: '', description: '', type: 'document' });
  const [newLocalisation, setNewLocalisation] = useState<NewLocalisation>({ lieu: '', latitude: '', longitude: '', description: '' });
  const [newSuspect, setNewSuspect] = useState<NewSuspect>({ nom: '', description: '', relation: '' });

  const dossier = dossiers.find((d) => d.id === selectedDossier);

  // Charger les signalements quand on sélectionne un dossier
  const handleSelectDossier = (dossierId: string) => {
    setSelectedDossier(dossierId);
    fetchSignalements(dossierId);
    fetchLocalisations(dossierId);
  };

  // Ajouter une preuve/signalement
  const handleAddPreuve = useCallback(async () => {
    if (!selectedDossier || !newPreuve.description) {
      addNotification({
        title: t('authority.investigation.messages.error'),
        message: t('authority.investigation.messages.fillRequiredFields'),
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;

      const { error } = await (supabase as any)
        .from('signalement')
        .insert({
          id_dossier: selectedDossier,
          description: `[${newPreuve.type.toUpperCase()}] ${newPreuve.titre}\n\n${newPreuve.description}`,
          id_utilisateur: user?.id,
          statut_validation: 'en_verification',
          date_observation: new Date().toISOString(),
          niveau_certitude: 'probable',
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      addNotification({
        title: t('authority.investigation.messages.evidenceAdded'),
        message: t('authority.investigation.messages.evidenceAddedSuccess'),
        type: 'success',
      });

      // Refresh
      fetchSignalements(selectedDossier);
      setShowAddPreuveModal(false);
      setNewPreuve({ titre: '', description: '', type: 'document' });
    } catch (err: any) {
      addNotification({
        title: t('authority.investigation.messages.error'),
        message: err.message || t('authority.investigation.messages.addEvidenceError'),
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedDossier, newPreuve, addNotification, fetchSignalements, t]);

  // Ajouter une localisation
  const handleAddLocalisation = useCallback(async () => {
    if (!selectedDossier || !newLocalisation.lieu) {
      addNotification({
        title: t('authority.investigation.messages.error'),
        message: t('authority.investigation.messages.fillLocation'),
        type: 'error',
      });
      return;
    }

    if (!newLocalisation.latitude || !newLocalisation.longitude) {
      addNotification({
        title: t('authority.investigation.messages.error'),
        message: t('authority.investigation.messages.coordinatesRequired'),
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;

      const { error } = await (supabase as any)
        .from('localisation')
        .insert({
          id_dossier: selectedDossier,
          latitude: parseFloat(newLocalisation.latitude),
          longitude: parseFloat(newLocalisation.longitude),
          // Schéma SQL: pas de lieu_localisation / id_utilisateur. On utilise adresse + enregistree_par.
          adresse: newLocalisation.lieu,
          description: newLocalisation.description,
          date_localisation: new Date().toISOString(),
          source_localisation: 'autre',
          fiabilite_source: 'moyenne',
          type_localisation: 'autre',
          enregistree_par: user?.id,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      addNotification({
        title: t('authority.investigation.messages.locationAdded'),
        message: t('authority.investigation.messages.locationAddedSuccess'),
        type: 'success',
      });

      // Refresh
      fetchLocalisations(selectedDossier);
      setShowAddLocalisationModal(false);
      setNewLocalisation({ lieu: '', latitude: '', longitude: '', description: '' });
    } catch (err: any) {
      addNotification({
        title: t('authority.investigation.messages.error'),
        message: err.message || t('authority.investigation.messages.addLocationError'),
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedDossier, newLocalisation, addNotification, fetchLocalisations, t]);

  // Ajouter un suspect (via notes du dossier)
  const handleAddSuspect = useCallback(async () => {
    if (!selectedDossier || !newSuspect.nom) {
      addNotification({
        title: t('authority.investigation.messages.error'),
        message: t('authority.investigation.messages.fillSuspectName'),
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;

      // Ajouter comme signalement avec tag suspect
      const { error } = await (supabase as any)
        .from('signalement')
        .insert({
          id_dossier: selectedDossier,
          description: `[SUSPECT] ${newSuspect.nom}\nRelation: ${newSuspect.relation}\n\n${newSuspect.description}`,
          id_utilisateur: user?.id,
          statut_validation: 'en_verification',
          date_observation: new Date().toISOString(),
          // Aligné enum SQL niveau_certitude
          niveau_certitude: 'incertain',
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      addNotification({
        title: t('authority.investigation.messages.suspectAdded'),
        message: t('authority.investigation.messages.suspectAddedSuccess'),
        type: 'success',
      });

      // Refresh
      fetchSignalements(selectedDossier);
      setShowAddSuspectModal(false);
      setNewSuspect({ nom: '', description: '', relation: '' });
    } catch (err: any) {
      addNotification({
        title: t('authority.investigation.messages.error'),
        message: err.message || t('authority.investigation.messages.addSuspectError'),
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedDossier, newSuspect, addNotification, fetchSignalements, t]);

  // Filtrer les signalements par type
  const preuves = signalements.filter((s: any) => 
    s.description && !s.description.startsWith('[SUSPECT]')
  );
  const suspects = signalements.filter((s: any) => 
    s.description && s.description.startsWith('[SUSPECT]')
  );

  return (
    <AuthorityLayout>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h1><Search size={24} /> {t('authority.investigation.title')}</h1>
          <p className={styles.subtitle}>{t('authority.investigation.subtitle')}</p>
        </div>

        <div className={styles.content}>
          {/* Left Panel - Dossiers List */}
          <div className={styles.leftPanel}>
            <h2>{t('authority.investigation.activeDossiers')}</h2>
            <div className={styles.dossiersList}>
              {isLoading ? (
                <div className={styles.skeletonWrapLeft}>
                  <AdminDetailSkeleton blockCount={1} linesPerBlock={5} />
                </div>
              ) : dossiers.filter((d: any) => OPEN_DOSSIER_STATUTS.has(d.statut_dossier)).length > 0 ? (
                dossiers
                  .filter((d: any) => OPEN_DOSSIER_STATUTS.has(d.statut_dossier))
                  .map((d: any) => (
                    <div
                      key={d.id}
                      className={`${styles.dossierItem} ${selectedDossier === d.id ? styles.active : ''}`}
                      onClick={() => handleSelectDossier(d.id)}
                    >
                      <div className={styles.itemHeader}>
                        <h4>{d.numero_dossier || `DOS-${d.id.substring(0, 6)}`}</h4>
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
                          {d.niveau_urgence || 'normal'}
                        </span>
                      </div>
                      <p className={styles.itemMeta}>
                        {d.nombre_signalements || 0} {t('authority.investigation.reports')}
                      </p>
                    </div>
                  ))
              ) : (
                <p className={styles.empty}>{t('authority.investigation.noActiveDossiers')}</p>
              )}
            </div>
          </div>

          {/* Right Panel - Investigation View */}
          <div className={styles.rightPanel}>
            {isLoading ? (
              <div className={styles.skeletonWrapRight}>
                <AdminDetailSkeleton blockCount={3} linesPerBlock={4} />
              </div>
            ) : dossier ? (
              <>
                {/* Investigation Header */}
                <div className={styles.investigationHeader}>
                  <h2>{(dossier as any).numero_dossier || `DOS-${dossier.id.substring(0, 6)}`}</h2>
                  <p>{(dossier as any).lieu_disparition || 'Localisation inconnue'}</p>
                  <button
                    onClick={() => navigate(`/authority/dossiers/${dossier.id}`)}
                    style={{
                      marginTop: '8px',
                      padding: '6px 12px',
                      backgroundColor: '#0ea5e9',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                    }}
                  >
                    {t('authority.investigation.viewFullDossier')} →
                  </button>
                </div>

                {/* Tabs */}
                <div className={styles.tabsContainer}>
                  {(['timeline', 'preuves', 'suspects', 'lieux'] as const).map((tabKey) => (
                    <button
                      key={tabKey}
                      className={`${styles.tab} ${tab === tabKey ? styles.active : ''}`}
                      onClick={() => setTab(tabKey)}
                    >
                      {tabKey === 'timeline' && <><Calendar size={16} /> {t('authority.investigation.tabs.timeline')}</>}
                      {tabKey === 'preuves' && <><FileText size={16} /> {t('authority.investigation.tabs.evidence')} ({preuves.length})</>}
                      {tabKey === 'suspects' && <><Users size={16} /> {t('authority.investigation.tabs.suspects')} ({suspects.length})</>}
                      {tabKey === 'lieux' && <><MapPin size={16} /> {t('authority.investigation.tabs.locations')} ({localisations.length})</>}
                    </button>
                  ))}
                </div>

                {/* Content */}
                <div className={styles.tabContent}>
                  {tab === 'timeline' && (
                    <div className={styles.timeline}>
                      <div className={styles.timelineItem}>
                        <div className={styles.timelineDate}>
                          {new Date((dossier as any).date_disparition || dossier.created_at).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}
                        </div>
                        <div className={styles.timelineContent}>
                          <p className={styles.timelineTitle}><AlertTriangle size={16} /> {t('authority.investigation.timeline.disappearance')}</p>
                          <p className={styles.timelineDesc}>
                            {(dossier as any).circonstances || t('authority.investigation.timeline.circumstancesNotProvided')}
                          </p>
                        </div>
                      </div>

                      {(dossier as any).date_derniere_observation && (
                        <div className={styles.timelineItem}>
                          <div className={styles.timelineDate}>
                            {new Date((dossier as any).date_derniere_observation).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}
                          </div>
                          <div className={styles.timelineContent}>
                            <p className={styles.timelineTitle}><Eye size={16} /> {t('authority.investigation.timeline.lastObservation')}</p>
                            <p className={styles.timelineDesc}>
                              {(dossier as any).derniere_activite_connue || t('authority.investigation.timeline.notProvided')}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Signalements dans la timeline */}
                      {signalements.slice(0, 5).map((sig: any) => (
                        <div key={sig.id} className={styles.timelineItem}>
                          <div className={styles.timelineDate}>
                            {new Date(sig.date_observation).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}
                          </div>
                          <div className={styles.timelineContent}>
                            <p className={styles.timelineTitle}>
                              {sig.description?.startsWith('[SUSPECT]') ? <><User size={16} /> {t('authority.investigation.timeline.suspectReported')}</> : <><FileText size={16} /> {t('authority.investigation.timeline.report')}</>}
                            </p>
                            <p className={styles.timelineDesc}>
                              {(sig.description || '').substring(0, 100)}...
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {tab === 'preuves' && (
                    <div className={styles.evidenceSection}>
                      <h3>{t('authority.investigation.evidence.title')}</h3>
                      {preuves.length > 0 ? (
                        <div className={styles.itemsList}>
                          {preuves.map((sig: any) => (
                            <div key={sig.id} className={styles.itemCard}>
                              <h4>{(sig.description || t('authority.investigation.evidence.evidence')).substring(0, 50)}</h4>
                              <p><strong>{t('authority.investigation.evidence.location')}:</strong> {sig.lieu_observation || t('authority.investigation.evidence.notProvided')}</p>
                              <p><strong>{t('authority.investigation.evidence.date')}:</strong> {new Date(sig.date_observation).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}</p>
                              <small>{t('authority.investigation.evidence.status')}: {sig.statut_validation || sig.etat}</small>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className={styles.empty}>{t('authority.investigation.evidence.noEvidence')}</div>
                      )}
                      <button 
                        className={styles.addButton}
                        onClick={() => setShowAddPreuveModal(true)}
                      >
                        <Plus size={16} /> {t('authority.investigation.evidence.addEvidence')}
                      </button>
                    </div>
                  )}

                  {tab === 'suspects' && (
                    <div className={styles.suspectsSection}>
                      <h3>{t('authority.investigation.suspects.title')}</h3>
                      {suspects.length > 0 ? (
                        <div className={styles.itemsList}>
                          {suspects.map((sig: any) => {
                            // Parser la description pour extraire les infos
                            const lines = (sig.description || '').split('\n');
                            const nom = lines[0]?.replace('[SUSPECT] ', '') || t('authority.investigation.suspects.unknown');
                            const relation = lines[1]?.replace('Relation: ', '') || '';
                            const desc = lines.slice(3).join('\n');

                            return (
                              <div key={sig.id} className={styles.itemCard}>
                                <h4><User size={16} /> {nom}</h4>
                                {relation && <p><strong>{t('authority.investigation.suspects.relation')}:</strong> {relation}</p>}
                                <p><strong>{t('authority.investigation.suspects.description')}:</strong> {desc || t('authority.investigation.suspects.noDescription')}</p>
                                <p><strong>{t('authority.investigation.suspects.addedOn')}:</strong> {new Date(sig.date_observation).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}</p>
                                <small>{t('authority.investigation.suspects.status')}: {sig.statut_validation || sig.etat}</small>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className={styles.empty}>{t('authority.investigation.suspects.noSuspects')}</div>
                      )}
                      <button 
                        className={styles.addButton}
                        onClick={() => setShowAddSuspectModal(true)}
                      >
                        <Plus size={16} /> {t('authority.investigation.suspects.addSuspect')}
                      </button>
                    </div>
                  )}

                  {tab === 'lieux' && (
                    <div className={styles.locationsSection}>
                      <h3>{t('authority.investigation.locations.title')}</h3>
                      <div className={styles.locationsList}>
                        <div className={styles.locationItem}>
                          <h4><MapPin size={16} /> {t('authority.investigation.locations.disappearanceLocation')}</h4>
                          <p>{(dossier as any).lieu_disparition || t('authority.investigation.locations.notProvided')}</p>
                          {(dossier as any).latitude_disparition && (dossier as any).longitude_disparition && (
                            <p className={styles.coordinates}>
                              {(dossier as any).latitude_disparition.toFixed(4)}, {(dossier as any).longitude_disparition.toFixed(4)}
                            </p>
                          )}
                        </div>
                        {localisations && localisations.length > 0 && (
                          <>
                            <div className={styles.divider} />
                            {localisations.map((loc: any, idx: number) => (
                              <div key={loc.id || idx} className={styles.locationItem}>
                                <h4>
                                  <MapPin size={16} />{' '}
                                  {loc.adresse ||
                                    loc.point_interet ||
                                    `${t('authority.investigation.locations.location')} ${idx + 1}`}
                                </h4>
                                {loc.description && <p>{loc.description}</p>}
                                {loc.latitude && loc.longitude && (
                                  <p className={styles.coordinates}>
                                    {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                                  </p>
                                )}
                                <small>{new Date(loc.date_localisation || loc.created_at).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}</small>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                      <button 
                        className={styles.addButton}
                        onClick={() => setShowAddLocalisationModal(true)}
                      >
                        <Plus size={16} /> {t('authority.investigation.locations.addLocation')}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className={styles.noSelection}>
                {t('authority.investigation.selectDossierToStart')}
              </div>
            )}
          </div>
        </div>

        {/* Modal Ajouter Preuve */}
        {showAddPreuveModal && (
          <div 
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            }}
            onClick={() => setShowAddPreuveModal(false)}
          >
            <div 
              style={{
                backgroundColor: 'white', padding: '24px', borderRadius: '8px',
                maxWidth: '500px', width: '90%',
              }}
              onClick={e => e.stopPropagation()}
            >
              <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Plus size={20} /> {t('authority.investigation.modals.addEvidence.title')}</h2>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>{t('authority.investigation.modals.addEvidence.type')}:</label>
                <select
                  value={newPreuve.type}
                  onChange={(e) => setNewPreuve({ ...newPreuve, type: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                  <option value="document">{t('authority.investigation.modals.addEvidence.typeDocument')}</option>
                  <option value="photo">{t('authority.investigation.modals.addEvidence.typePhoto')}</option>
                  <option value="video">{t('authority.investigation.modals.addEvidence.typeVideo')}</option>
                  <option value="temoignage">{t('authority.investigation.modals.addEvidence.typeTestimony')}</option>
                  <option value="autre">{t('authority.investigation.modals.addEvidence.typeOther')}</option>
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>{t('authority.investigation.modals.addEvidence.titleLabel')}:</label>
                <input
                  type="text"
                  value={newPreuve.titre}
                  onChange={(e) => setNewPreuve({ ...newPreuve, titre: e.target.value })}
                  placeholder={t('authority.investigation.modals.addEvidence.titlePlaceholder')}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>{t('authority.investigation.modals.addEvidence.description')} *:</label>
                <textarea
                  value={newPreuve.description}
                  onChange={(e) => setNewPreuve({ ...newPreuve, description: e.target.value })}
                  placeholder={t('authority.investigation.modals.addEvidence.descriptionPlaceholder')}
                  rows={4}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowAddPreuveModal(false)} style={{ padding: '10px 20px', backgroundColor: '#64748b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{t('authority.investigation.modals.cancel')}</button>
                <button onClick={handleAddPreuve} disabled={isSubmitting} style={{ padding: '10px 20px', backgroundColor: '#0ea5e9', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  {isSubmitting ? t('authority.investigation.modals.adding') : t('authority.investigation.modals.addEvidence.add')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Ajouter Localisation */}
        {showAddLocalisationModal && (
          <div 
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            }}
            onClick={() => setShowAddLocalisationModal(false)}
          >
            <div 
              style={{
                backgroundColor: 'white', padding: '24px', borderRadius: '8px',
                maxWidth: '500px', width: '90%',
              }}
              onClick={e => e.stopPropagation()}
            >
              <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={20} /> {t('authority.investigation.modals.addLocation.title')}</h2>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>{t('authority.investigation.modals.addLocation.location')} *:</label>
                <input
                  type="text"
                  value={newLocalisation.lieu}
                  onChange={(e) => setNewLocalisation({ ...newLocalisation, lieu: e.target.value })}
                  placeholder={t('authority.investigation.modals.addLocation.locationPlaceholder')}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>{t('authority.investigation.modals.addLocation.latitude')}:</label>
                  <input
                    type="text"
                    value={newLocalisation.latitude}
                    onChange={(e) => setNewLocalisation({ ...newLocalisation, latitude: e.target.value })}
                    placeholder={t('authority.investigation.modals.addLocation.latitudePlaceholder')}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>{t('authority.investigation.modals.addLocation.longitude')}:</label>
                  <input
                    type="text"
                    value={newLocalisation.longitude}
                    onChange={(e) => setNewLocalisation({ ...newLocalisation, longitude: e.target.value })}
                    placeholder={t('authority.investigation.modals.addLocation.longitudePlaceholder')}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>{t('authority.investigation.modals.addLocation.description')}:</label>
                <textarea
                  value={newLocalisation.description}
                  onChange={(e) => setNewLocalisation({ ...newLocalisation, description: e.target.value })}
                  placeholder={t('authority.investigation.modals.addLocation.descriptionPlaceholder')}
                  rows={3}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowAddLocalisationModal(false)} style={{ padding: '10px 20px', backgroundColor: '#64748b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{t('authority.investigation.modals.cancel')}</button>
                <button onClick={handleAddLocalisation} disabled={isSubmitting} style={{ padding: '10px 20px', backgroundColor: '#0ea5e9', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  {isSubmitting ? t('authority.investigation.modals.adding') : t('authority.investigation.modals.addLocation.add')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Ajouter Suspect */}
        {showAddSuspectModal && (
          <div 
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            }}
            onClick={() => setShowAddSuspectModal(false)}
          >
            <div 
              style={{
                backgroundColor: 'white', padding: '24px', borderRadius: '8px',
                maxWidth: '500px', width: '90%',
              }}
              onClick={e => e.stopPropagation()}
            >
              <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><User size={20} /> {t('authority.investigation.modals.addSuspect.title')}</h2>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>{t('authority.investigation.modals.addSuspect.name')} *:</label>
                <input
                  type="text"
                  value={newSuspect.nom}
                  onChange={(e) => setNewSuspect({ ...newSuspect, nom: e.target.value })}
                  placeholder={t('authority.investigation.modals.addSuspect.namePlaceholder')}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>{t('authority.investigation.modals.addSuspect.relation')}:</label>
                <input
                  type="text"
                  value={newSuspect.relation}
                  onChange={(e) => setNewSuspect({ ...newSuspect, relation: e.target.value })}
                  placeholder={t('authority.investigation.modals.addSuspect.relationPlaceholder')}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>{t('authority.investigation.modals.addSuspect.description')}:</label>
                <textarea
                  value={newSuspect.description}
                  onChange={(e) => setNewSuspect({ ...newSuspect, description: e.target.value })}
                  placeholder={t('authority.investigation.modals.addSuspect.descriptionPlaceholder')}
                  rows={4}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowAddSuspectModal(false)} style={{ padding: '10px 20px', backgroundColor: '#64748b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{t('authority.investigation.modals.cancel')}</button>
                <button onClick={handleAddSuspect} disabled={isSubmitting} style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  {isSubmitting ? t('authority.investigation.modals.adding') : t('authority.investigation.modals.addSuspect.add')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthorityLayout>
  );
};

export default InvestigationPage;
