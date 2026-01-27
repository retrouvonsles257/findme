/**
 * =====================================================
 * RETROUVONSLES - Investigation Page
 * Vue spécialisée pour l'investigation des dossiers
 * Boutons fonctionnels connectés à Supabase
 * =====================================================
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDossiers } from '../../features/dossiers/hooks/useDossiers';
import { useSignalementsForDossier } from '../../features/signalements/hooks/useSignalementsForDossier';
import { useLocalisationsForDossier } from '../../features/geolocalisation/hooks/useLocalisationsForDossier';
import { supabase } from '../../config';
import { useNotification } from '../../contexts';
import { AuthorityLayout } from '../../components/layout';
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

export const InvestigationPage: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { dossiers, isLoading } = useDossiers();
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
        title: 'Erreur',
        message: 'Veuillez remplir tous les champs obligatoires',
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
        title: 'Preuve ajoutée',
        message: 'La preuve a été enregistrée avec succès',
        type: 'success',
      });

      // Refresh
      fetchSignalements(selectedDossier);
      setShowAddPreuveModal(false);
      setNewPreuve({ titre: '', description: '', type: 'document' });
    } catch (err: any) {
      addNotification({
        title: 'Erreur',
        message: err.message || 'Erreur lors de l\'ajout de la preuve',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedDossier, newPreuve, addNotification, fetchSignalements]);

  // Ajouter une localisation
  const handleAddLocalisation = useCallback(async () => {
    if (!selectedDossier || !newLocalisation.lieu) {
      addNotification({
        title: 'Erreur',
        message: 'Veuillez remplir le lieu',
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
          lieu_localisation: newLocalisation.lieu,
          latitude: newLocalisation.latitude ? parseFloat(newLocalisation.latitude) : null,
          longitude: newLocalisation.longitude ? parseFloat(newLocalisation.longitude) : null,
          description: newLocalisation.description,
          date_localisation: new Date().toISOString(),
          source_localisation: 'investigation',
          id_utilisateur: user?.id,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      addNotification({
        title: 'Localisation ajoutée',
        message: 'Le lieu a été enregistré avec succès',
        type: 'success',
      });

      // Refresh
      fetchLocalisations(selectedDossier);
      setShowAddLocalisationModal(false);
      setNewLocalisation({ lieu: '', latitude: '', longitude: '', description: '' });
    } catch (err: any) {
      addNotification({
        title: 'Erreur',
        message: err.message || 'Erreur lors de l\'ajout de la localisation',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedDossier, newLocalisation, addNotification, fetchLocalisations]);

  // Ajouter un suspect (via notes du dossier)
  const handleAddSuspect = useCallback(async () => {
    if (!selectedDossier || !newSuspect.nom) {
      addNotification({
        title: 'Erreur',
        message: 'Veuillez renseigner le nom du suspect',
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
          niveau_certitude: 'a_verifier',
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      addNotification({
        title: 'Suspect ajouté',
        message: 'Le suspect a été enregistré pour investigation',
        type: 'success',
      });

      // Refresh
      fetchSignalements(selectedDossier);
      setShowAddSuspectModal(false);
      setNewSuspect({ nom: '', description: '', relation: '' });
    } catch (err: any) {
      addNotification({
        title: 'Erreur',
        message: err.message || 'Erreur lors de l\'ajout du suspect',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedDossier, newSuspect, addNotification, fetchSignalements]);

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
          <h1><Search size={24} /> Investigation Détaillée</h1>
          <p className={styles.subtitle}>Outils d'investigation avancée pour les enquêteurs</p>
        </div>

        <div className={styles.content}>
          {/* Left Panel - Dossiers List */}
          <div className={styles.leftPanel}>
            <h2>Dossiers Actifs</h2>
            <div className={styles.dossiersList}>
              {isLoading ? (
                <p>Chargement...</p>
              ) : dossiers.filter((d: any) => d.statut_dossier === 'en_cours').length > 0 ? (
                dossiers
                  .filter((d: any) => d.statut_dossier === 'en_cours')
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
                  <h2>{(dossier as any).numero_dossier || `DOS-${dossier.id.substring(0, 6)}`}</h2>
                  <p>{(dossier as any).lieu_disparition || 'Localisation inconnue'}</p>
                  <button
                    onClick={() => navigate(`/authority/dossiers/${dossier.id}`)}
                    style={{
                      marginTop: '8px',
                      padding: '6px 12px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                    }}
                  >
                    Voir dossier complet →
                  </button>
                </div>

                {/* Tabs */}
                <div className={styles.tabsContainer}>
                  {(['timeline', 'preuves', 'suspects', 'lieux'] as const).map((t) => (
                    <button
                      key={t}
                      className={`${styles.tab} ${tab === t ? styles.active : ''}`}
                      onClick={() => setTab(t)}
                    >
                      {t === 'timeline' && <><Calendar size={16} /> Timeline</>}
                      {t === 'preuves' && <><FileText size={16} /> Preuves ({preuves.length})</>}
                      {t === 'suspects' && <><Users size={16} /> Suspects ({suspects.length})</>}
                      {t === 'lieux' && <><MapPin size={16} /> Lieux ({localisations.length})</>}
                    </button>
                  ))}
                </div>

                {/* Content */}
                <div className={styles.tabContent}>
                  {tab === 'timeline' && (
                    <div className={styles.timeline}>
                      <div className={styles.timelineItem}>
                        <div className={styles.timelineDate}>
                          {new Date((dossier as any).date_disparition || dossier.created_at).toLocaleDateString('fr-FR')}
                        </div>
                        <div className={styles.timelineContent}>
                          <p className={styles.timelineTitle}><AlertTriangle size={16} /> Disparition</p>
                          <p className={styles.timelineDesc}>
                            {(dossier as any).circonstances || 'Circonstances non renseignées'}
                          </p>
                        </div>
                      </div>

                      {(dossier as any).date_derniere_observation && (
                        <div className={styles.timelineItem}>
                          <div className={styles.timelineDate}>
                            {new Date((dossier as any).date_derniere_observation).toLocaleDateString('fr-FR')}
                          </div>
                          <div className={styles.timelineContent}>
                            <p className={styles.timelineTitle}><Eye size={16} /> Dernière observation</p>
                            <p className={styles.timelineDesc}>
                              {(dossier as any).derniere_activite_connue || 'Non renseignée'}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Signalements dans la timeline */}
                      {signalements.slice(0, 5).map((sig: any) => (
                        <div key={sig.id} className={styles.timelineItem}>
                          <div className={styles.timelineDate}>
                            {new Date(sig.date_observation).toLocaleDateString('fr-FR')}
                          </div>
                          <div className={styles.timelineContent}>
                            <p className={styles.timelineTitle}>
                              {sig.description?.startsWith('[SUSPECT]') ? <><User size={16} /> Suspect signalé</> : <><FileText size={16} /> Signalement</>}
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
                      <h3>Preuves et Documents</h3>
                      {preuves.length > 0 ? (
                        <div className={styles.itemsList}>
                          {preuves.map((sig: any) => (
                            <div key={sig.id} className={styles.itemCard}>
                              <h4>{(sig.description || 'Preuve').substring(0, 50)}</h4>
                              <p><strong>Lieu:</strong> {sig.lieu_observation || 'Non renseigné'}</p>
                              <p><strong>Date:</strong> {new Date(sig.date_observation).toLocaleDateString('fr-FR')}</p>
                              <small>État: {sig.statut_validation || sig.etat}</small>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className={styles.empty}>Aucune preuve documentée</div>
                      )}
                      <button 
                        className={styles.addButton}
                        onClick={() => setShowAddPreuveModal(true)}
                      >
                        <Plus size={16} /> Ajouter une Preuve
                      </button>
                    </div>
                  )}

                  {tab === 'suspects' && (
                    <div className={styles.suspectsSection}>
                      <h3>Suspects et Personnes d'Intérêt</h3>
                      {suspects.length > 0 ? (
                        <div className={styles.itemsList}>
                          {suspects.map((sig: any) => {
                            // Parser la description pour extraire les infos
                            const lines = (sig.description || '').split('\n');
                            const nom = lines[0]?.replace('[SUSPECT] ', '') || 'Inconnu';
                            const relation = lines[1]?.replace('Relation: ', '') || '';
                            const desc = lines.slice(3).join('\n');
                            
                            return (
                              <div key={sig.id} className={styles.itemCard}>
                                <h4><User size={16} /> {nom}</h4>
                                {relation && <p><strong>Relation:</strong> {relation}</p>}
                                <p><strong>Description:</strong> {desc || 'Aucune description'}</p>
                                <p><strong>Ajouté le:</strong> {new Date(sig.date_observation).toLocaleDateString('fr-FR')}</p>
                                <small>État: {sig.statut_validation || sig.etat}</small>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className={styles.empty}>Aucun suspect enregistré</div>
                      )}
                      <button 
                        className={styles.addButton}
                        onClick={() => setShowAddSuspectModal(true)}
                      >
                        <Plus size={16} /> Ajouter un Suspect
                      </button>
                    </div>
                  )}

                  {tab === 'lieux' && (
                    <div className={styles.locationsSection}>
                      <h3>Lieux d'Intérêt</h3>
                      <div className={styles.locationsList}>
                        <div className={styles.locationItem}>
                          <h4><MapPin size={16} /> Lieu de Disparition</h4>
                          <p>{(dossier as any).lieu_disparition || 'Non renseigné'}</p>
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
                                <h4><MapPin size={16} /> {loc.lieu_localisation || `Localisation ${idx + 1}`}</h4>
                                {loc.description && <p>{loc.description}</p>}
                                {loc.latitude && loc.longitude && (
                                  <p className={styles.coordinates}>
                                    {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                                  </p>
                                )}
                                <small>{new Date(loc.date_localisation || loc.created_at).toLocaleDateString('fr-FR')}</small>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                      <button 
                        className={styles.addButton}
                        onClick={() => setShowAddLocalisationModal(true)}
                      >
                        <Plus size={16} /> Ajouter Lieu
                      </button>
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
              <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Plus size={20} /> Ajouter une Preuve</h2>
              
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Type:</label>
                <select
                  value={newPreuve.type}
                  onChange={(e) => setNewPreuve({ ...newPreuve, type: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                  <option value="document">Document</option>
                  <option value="photo">Photo</option>
                  <option value="video">Vidéo</option>
                  <option value="temoignage">Témoignage</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Titre:</label>
                <input
                  type="text"
                  value={newPreuve.titre}
                  onChange={(e) => setNewPreuve({ ...newPreuve, titre: e.target.value })}
                  placeholder="Titre de la preuve"
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Description *:</label>
                <textarea
                  value={newPreuve.description}
                  onChange={(e) => setNewPreuve({ ...newPreuve, description: e.target.value })}
                  placeholder="Description détaillée..."
                  rows={4}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowAddPreuveModal(false)} style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Annuler</button>
                <button onClick={handleAddPreuve} disabled={isSubmitting} style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  {isSubmitting ? 'Ajout...' : 'Ajouter'}
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
              <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={20} /> Ajouter un Lieu</h2>
              
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Lieu *:</label>
                <input
                  type="text"
                  value={newLocalisation.lieu}
                  onChange={(e) => setNewLocalisation({ ...newLocalisation, lieu: e.target.value })}
                  placeholder="Nom ou adresse du lieu"
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Latitude:</label>
                  <input
                    type="text"
                    value={newLocalisation.latitude}
                    onChange={(e) => setNewLocalisation({ ...newLocalisation, latitude: e.target.value })}
                    placeholder="ex: 3.848"
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Longitude:</label>
                  <input
                    type="text"
                    value={newLocalisation.longitude}
                    onChange={(e) => setNewLocalisation({ ...newLocalisation, longitude: e.target.value })}
                    placeholder="ex: 11.5021"
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Description:</label>
                <textarea
                  value={newLocalisation.description}
                  onChange={(e) => setNewLocalisation({ ...newLocalisation, description: e.target.value })}
                  placeholder="Informations sur ce lieu..."
                  rows={3}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowAddLocalisationModal(false)} style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Annuler</button>
                <button onClick={handleAddLocalisation} disabled={isSubmitting} style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  {isSubmitting ? 'Ajout...' : 'Ajouter'}
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
              <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><User size={20} /> Ajouter un Suspect</h2>
              
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Nom/Pseudonyme *:</label>
                <input
                  type="text"
                  value={newSuspect.nom}
                  onChange={(e) => setNewSuspect({ ...newSuspect, nom: e.target.value })}
                  placeholder="Nom ou identifiant"
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Relation avec la personne disparue:</label>
                <input
                  type="text"
                  value={newSuspect.relation}
                  onChange={(e) => setNewSuspect({ ...newSuspect, relation: e.target.value })}
                  placeholder="ex: voisin, collègue, inconnu..."
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Description / Notes:</label>
                <textarea
                  value={newSuspect.description}
                  onChange={(e) => setNewSuspect({ ...newSuspect, description: e.target.value })}
                  placeholder="Informations sur cette personne..."
                  rows={4}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowAddSuspectModal(false)} style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Annuler</button>
                <button onClick={handleAddSuspect} disabled={isSubmitting} style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  {isSubmitting ? 'Ajout...' : 'Ajouter Suspect'}
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
