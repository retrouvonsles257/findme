/**
 * =====================================================
 * RETROUVONSLES - Super Admin Dossier Detail Page
 * Accès complet à toutes les informations d'un dossier
 * (documentation: super-admin a accès à toutes les infos)
 * =====================================================
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDossierDetail } from '../../features/dossiers/hooks/useDossierDetail';
import { useSignalementsForDossier } from '../../features/signalements/hooks/useSignalementsForDossier';
import { useLocalisationsForDossier } from '../../features/geolocalisation/hooks/useLocalisationsForDossier';
import { useHistoriqueDossier } from '../../features/dossiers/hooks/useHistoriqueDossier';
import { SuperAdminLayout } from './SuperAdminLayout';
import { supabase } from '../../config';
import { useI18n } from '../../hooks';
import {
  ArrowLeft,
  Info,
  Camera,
  MapPin,
  History,
  MessageSquare,
  FileText,
  Bell,
  Brain,
  AlertCircle,
  Clock,
  User,
  Phone,
  Mail,
  BarChart3,
  Image as ImageIcon,
  Loader2,
  Lock,
  Building2,
} from 'lucide-react';
import styles from '../authority/DossierDetailPage.module.css';

type TabId = 'info' | 'photos' | 'signalements' | 'localisations' | 'historique' | 'commentaires' | 'documents' | 'alertes' | 'resultats_ia';

export const SuperAdminDossierDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { dossier, isLoading, error, fetchDossier } = useDossierDetail();
  const { signalements, fetchSignalements } = useSignalementsForDossier();
  const { localisations, fetchLocalisations } = useLocalisationsForDossier();
  const { historique, fetchHistorique } = useHistoriqueDossier();
  const { t, language } = useI18n();

  const [activeTab, setActiveTab] = useState<TabId>('info');
  const [photos, setPhotos] = useState<any[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [commentaires, setCommentaires] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [alertes, setAlertes] = useState<any[]>([]);
  const [resultatsIa, setResultatsIa] = useState<any[]>([]);
  const [createur, setCreateur] = useState<{ nom?: string; email?: string } | null>(null);
  const [organisation, setOrganisation] = useState<{ nom?: string } | null>(null);
  const [loadingExtra, setLoadingExtra] = useState(false);

  const loadPhotos = useCallback(async (personneId: string) => {
    setLoadingPhotos(true);
    try {
      const { data, error: err } = await (supabase as any)
        .from('photo')
        .select('*')
        .eq('id_personne', personneId)
        .order('est_principale', { ascending: false })
        .order('created_at', { ascending: false });
      if (!err) setPhotos(data || []);
    } catch {
      setPhotos([]);
    } finally {
      setLoadingPhotos(false);
    }
  }, []);

  const loadExtra = useCallback(async (dossierId: string) => {
    setLoadingExtra(true);
    try {
      const [
        { data: comm },
        { data: doc },
        { data: al },
        { data: ria },
      ] = await Promise.all([
        (supabase as any).from('commentaire').select('*, utilisateur:id_utilisateur(nom, email)').eq('id_dossier', dossierId).order('created_at', { ascending: false }),
        (supabase as any).from('document').select('*').eq('id_dossier', dossierId).order('date_upload', { ascending: false }),
        (supabase as any).from('alerte').select('*').eq('id_dossier', dossierId).order('date_diffusion', { ascending: false }),
        (supabase as any).from('resultat_ia').select('*').eq('id_dossier', dossierId).order('date_analyse', { ascending: false }),
      ]);
      setCommentaires(comm || []);
      setDocuments(doc || []);
      setAlertes(al || []);
      setResultatsIa(ria || []);
    } catch {
      setCommentaires([]);
      setDocuments([]);
      setAlertes([]);
      setResultatsIa([]);
    } finally {
      setLoadingExtra(false);
    }
  }, []);

  const loadCreateurAndOrg = useCallback(async (d: any) => {
    const ids = { creator: d?.id_utilisateur_createur, org: d?.id_organisation_responsable };
    if (!ids.creator && !ids.org) {
      setCreateur(null);
      setOrganisation(null);
      return;
    }
    try {
      if (ids.creator) {
        const { data: u } = await (supabase as any).from('utilisateur').select('nom, email').eq('id', ids.creator).single();
        setCreateur(u || null);
      } else setCreateur(null);
      if (ids.org) {
        const { data: o } = await (supabase as any).from('organisation').select('nom').eq('id', ids.org).single();
        setOrganisation(o || null);
      } else setOrganisation(null);
    } catch {
      setCreateur(null);
      setOrganisation(null);
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    fetchDossier(id).catch(() => {});
    fetchSignalements(id).catch(() => {});
    fetchLocalisations(id).catch(() => {});
    fetchHistorique(id).catch(() => {});
  }, [id, fetchDossier, fetchSignalements, fetchLocalisations, fetchHistorique]);

  useEffect(() => {
    if (dossier?.id_personne) loadPhotos(dossier.id_personne);
  }, [dossier?.id_personne, loadPhotos]);

  useEffect(() => {
    if (dossier?.id) {
      loadExtra(dossier.id);
      loadCreateurAndOrg(dossier);
    }
  }, [dossier, loadExtra, loadCreateurAndOrg]);

  const getStatusLabel = (statut: string) => {
    const map: Record<string, string> = {
      en_cours: t('authority.dossiers.status.en_cours') || 'En cours',
      suspendu: t('authority.dossiers.status.suspendu') || 'Suspendu',
      retrouve_vivant: t('authority.dossiers.status.retrouve_vivant') || 'Retrouvé vivant',
      retrouve_decede: t('authority.dossiers.status.retrouve_decede') || 'Retrouvé décédé',
      cloture: t('authority.editDossier.form.statusClosed') || 'Clôturé',
    };
    return map[statut] || statut;
  };

  const getUrgencyLabel = (niveau: string) => {
    const map: Record<string, string> = {
      critique: t('authority.dossiers.urgency.critique') || 'Critique',
      urgent: t('authority.dossiers.urgency.urgent') || 'Urgent',
      normal: t('authority.dossiers.urgency.normal') || 'Normal',
      faible: t('authority.dossiers.urgency.faible') || 'Faible',
    };
    return map[niveau] || niveau;
  };

  const getTypeLabel = (type: string) => {
    if (!type) return t('authority.dossierDetail.fields.notProvided') || 'Non renseigné';
    const key = `authority.dossiers.disappearanceType.${type}`;
    const tr = t(key);
    return tr !== key ? tr : type;
  };

  const locale = language === 'fr' ? 'fr-FR' : 'en-US';

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'info', label: t('authority.dossierDetail.tabs.info') || 'Info', icon: <Info size={16} /> },
    { id: 'photos', label: t('authority.dossierDetail.tabs.photos') || 'Photos', icon: <Camera size={16} /> },
    { id: 'signalements', label: t('authority.dossierDetail.tabs.reports') || 'Signalements', icon: <AlertCircle size={16} /> },
    { id: 'localisations', label: t('authority.dossierDetail.tabs.locations') || 'Localisations', icon: <MapPin size={16} /> },
    { id: 'historique', label: t('authority.dossierDetail.tabs.history') || 'Historique', icon: <History size={16} /> },
    { id: 'commentaires', label: 'Commentaires', icon: <MessageSquare size={16} /> },
    { id: 'documents', label: 'Documents', icon: <FileText size={16} /> },
    { id: 'alertes', label: 'Alertes', icon: <Bell size={16} /> },
    { id: 'resultats_ia', label: 'Résultats IA', icon: <Brain size={16} /> },
  ];

  return (
    <SuperAdminLayout title={dossier ? `Dossier — ${dossier.numero_dossier}` : 'Détail dossier'} activeNav="dossiers">
      <div className={styles.container}>
        {isLoading ? (
          <div className={styles.loading}>
            <Loader2 size={24} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            {t('authority.dossierDetail.loading')}
          </div>
        ) : error ? (
          <div className={styles.error}>
            <h3>{t('authority.dossierDetail.error')}</h3>
            <p>{error}</p>
            <button type="button" onClick={() => id && fetchDossier(id)}>{t('authority.commonActions.view')}</button>
          </div>
        ) : !dossier ? (
          <div className={styles.notFound}>{t('authority.dossierDetail.notFound')}</div>
        ) : (
          <>
            <div className={styles.header}>
              <div className={styles.headerLeft}>
                <button type="button" className={styles.backButton} onClick={() => navigate(-1)}>
                  <ArrowLeft size={18} /> {t('authority.commonActions.back')}
                </button>
                <div className={styles.titleSection}>
                  <h1>{dossier.numero_dossier}</h1>
                  <p className={styles.subtitle}>{t('authority.dossierDetail.title')}</p>
                </div>
              </div>
              <div className={styles.headerRight}>
                <span
                  className={styles.statusBadge}
                  style={{
                    backgroundColor:
                      dossier.statut_dossier === 'en_cours'
                        ? '#ffc107'
                        : (dossier.statut_dossier || '').includes('retrouve')
                          ? '#4caf50'
                          : '#999',
                  }}
                >
                  {getStatusLabel(dossier.statut_dossier || '')}
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
                  {getUrgencyLabel(dossier.niveau_urgence || '')}
                </span>
              </div>
            </div>

            <div className={styles.tabs}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            <div className={styles.content}>
              {activeTab === 'info' && (
                <div className={styles.infoSection}>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoBlock}>
                      <h3><FileText size={18} /> {t('authority.dossierDetail.sections.disappearance')}</h3>
                      <div className={styles.infoItem}>
                        <label><Clock size={14} /> {t('authority.dossierDetail.fields.date')}:</label>
                        <p>{new Date(dossier.date_disparition).toLocaleDateString(locale)}</p>
                      </div>
                      <div className={styles.infoItem}>
                        <label><MapPin size={14} /> {t('authority.dossierDetail.fields.location')}:</label>
                        <p>{dossier.lieu_disparition || t('authority.dossierDetail.fields.notProvided')}</p>
                      </div>
                      <div className={styles.infoItem}>
                        <label><FileText size={14} /> {t('authority.dossierDetail.fields.circumstances')}:</label>
                        <p>{dossier.circonstances || t('authority.dossierDetail.fields.notProvided')}</p>
                      </div>
                      <div className={styles.infoItem}>
                        <label><Info size={14} /> {t('authority.dossierDetail.fields.type')}:</label>
                        <p>{getTypeLabel(dossier.type_disparition)}</p>
                      </div>
                    </div>

                    {(dossier as any)?.personne && (
                      <div className={styles.infoBlock}>
                        <h3><User size={18} /> {t('authority.dossierDetail.sections.person')}</h3>
                        <div className={styles.infoItem}>
                          <label><User size={14} /> {t('authority.dossierDetail.fields.fullName')}:</label>
                          <p>{(dossier as any).personne.nom_complet || `${(dossier as any).personne.prenom || ''} ${(dossier as any).personne.nom || ''}`.trim() || t('authority.dossierDetail.fields.notProvided')}</p>
                        </div>
                        {(dossier as any).personne.date_naissance && (
                          <div className={styles.infoItem}>
                            <label><Clock size={14} /> {t('authority.dossierDetail.fields.birthDate')}:</label>
                            <p>{new Date((dossier as any).personne.date_naissance).toLocaleDateString(locale)}</p>
                          </div>
                        )}
                        {(dossier as any).personne.sexe && (
                          <div className={styles.infoItem}>
                            <label><User size={14} /> {t('authority.dossierDetail.fields.gender')}:</label>
                            <p>{(dossier as any).personne.sexe}</p>
                          </div>
                        )}
                        {(dossier as any).personne.description_physique && (
                          <div className={styles.infoItem}>
                            <label><FileText size={14} /> {t('authority.dossierDetail.fields.physicalDescription')}:</label>
                            <p>{(dossier as any).personne.description_physique}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className={styles.infoBlock}>
                      <h3><User size={18} /> {t('authority.dossierDetail.sections.contact')}</h3>
                      <div className={styles.infoItem}>
                        <label><User size={14} /> {t('authority.dossierDetail.fields.investigator')}:</label>
                        <p>{dossier.enqueteur_responsable || t('authority.dossierDetail.fields.notAssigned')}</p>
                      </div>
                      <div className={styles.infoItem}>
                        <label><User size={14} /> {t('authority.dossierDetail.fields.familyContact')}:</label>
                        <p>{dossier.contact_famille_principale || t('authority.dossierDetail.fields.notProvided')}</p>
                      </div>
                      <div className={styles.infoItem}>
                        <label><Phone size={14} /> {t('authority.dossierDetail.fields.phone')}:</label>
                        <p>{dossier.telephone_contact || t('authority.dossierDetail.fields.notProvided')}</p>
                      </div>
                      <div className={styles.infoItem}>
                        <label><Mail size={14} /> {t('authority.dossierDetail.fields.email')}:</label>
                        <p>{dossier.email_contact || t('authority.dossierDetail.fields.notProvided')}</p>
                      </div>
                    </div>

                    {(createur || organisation) && (
                      <div className={styles.infoBlock}>
                        <h3><Building2 size={18} /> Super-admin — Créateur & organisation</h3>
                        {createur && (
                          <div className={styles.infoItem}>
                            <label>Créateur:</label>
                            <p>{createur.nom || ''} {createur.email ? `(${createur.email})` : ''}</p>
                          </div>
                        )}
                        {organisation && (
                          <div className={styles.infoItem}>
                            <label>Organisation responsable:</label>
                            <p>{organisation.nom || '—'}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className={styles.infoBlock}>
                      <h3><BarChart3 size={18} /> {t('authority.dossierDetail.sections.stats')}</h3>
                      <div className={styles.statGrid}>
                        <div className={styles.stat}>
                          <span className={styles.statLabel}>{t('authority.dossierDetail.stats.reports')}</span>
                          <span className={styles.statValue}>{dossier.nombre_signalements ?? 0}</span>
                        </div>
                        <div className={styles.stat}>
                          <span className={styles.statLabel}>{t('authority.dossierDetail.stats.alerts')}</span>
                          <span className={styles.statValue}>{dossier.nombre_alertes_diffusees ?? 0}</span>
                        </div>
                        <div className={styles.stat}>
                          <span className={styles.statLabel}>{t('authority.dossierDetail.stats.views')}</span>
                          <span className={styles.statValue}>{dossier.nombre_vues_fiche ?? 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'photos' && (
                <div className={styles.tabContent}>
                  <h3><Camera size={20} /> {t('authority.dossierDetail.tabs.photos')}</h3>
                  {loadingPhotos ? (
                    <div className={styles.loading}>{t('authority.header.loading')}</div>
                  ) : photos.length > 0 ? (
                    <div className={styles.photosGrid}>
                      {photos.map((photo) => (
                        <div key={photo.id} className={styles.photoCard}>
                          <img
                            src={photo.url_thumbnail || photo.url_cloudinary}
                            alt={photo.titre || 'Photo'}
                            onClick={() => window.open(photo.url_cloudinary, '_blank')}
                          />
                          {photo.est_principale && <span className={styles.mainPhotoBadge}>{t('authority.dossierDetail.tabs.photos')}</span>}
                          {photo.titre && <p className={styles.photoTitle}>{photo.titre}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.empty}>
                      <ImageIcon size={48} />
                      <p>{t('authority.dossierDetail.noPhotos')}</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'signalements' && (
                <div className={styles.tabContent}>
                  <h3><AlertCircle size={20} /> {t('authority.dossierDetail.tabs.reports')}</h3>
                  {signalements.length > 0 ? (
                    <div className={styles.itemsList}>
                      {signalements.map((sig: any) => (
                        <div key={sig.id} className={styles.itemCard}>
                          <div className={styles.itemHeader}>
                            <h4>{sig.description || t('authority.dossierDetail.tabs.reports')}</h4>
                            <span
                              className={styles.badge}
                              style={{
                                backgroundColor:
                                  sig.statut_validation === 'valide' ? '#28a745' : sig.statut_validation === 'invalide' ? '#dc3545' : '#ffc107',
                              }}
                            >
                              {sig.statut_validation || '—'}
                            </span>
                          </div>
                          <p><strong>{t('authority.dossierDetail.fields.location')}:</strong> {sig.lieu_observation || t('authority.dossierDetail.fields.notProvided')}</p>
                          <p><strong>{t('authority.dossierDetail.fields.date')}:</strong> {new Date(sig.date_observation).toLocaleDateString(locale)}</p>
                          {(sig.auteur || sig.nom_temoin) && (
                            <p><strong>{t('authority.dossierDetail.fields.author')}:</strong> {sig.auteur || sig.nom_temoin}</p>
                          )}
                          {sig.temoin_anonyme && <p><em>{t('authority.dossierDetail.anonymousReport')}</em></p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.empty}>{t('authority.dossierDetail.noReports')}</div>
                  )}
                </div>
              )}

              {activeTab === 'localisations' && (
                <div className={styles.tabContent}>
                  <h3><MapPin size={20} /> Localisations</h3>
                  {localisations.length > 0 ? (
                    <div className={styles.itemsList}>
                      {localisations.map((loc: any) => (
                        <div key={loc.id} className={styles.itemCard}>
                          <div className={styles.itemHeader}>
                            <h4>Localisation</h4>
                            <span className={styles.badge} style={{ backgroundColor: '#007bff' }}>
                              {new Date(loc.date_localisation).toLocaleDateString(locale)}
                            </span>
                          </div>
                          <p><strong>Lieu:</strong> {loc.lieu_localisation || '—'}</p>
                          {loc.latitude != null && loc.longitude != null && (
                            <p><strong>Coordonnées:</strong> {Number(loc.latitude).toFixed(4)}, {Number(loc.longitude).toFixed(4)}</p>
                          )}
                          {loc.rayon_recherche && <p><strong>Rayon:</strong> {loc.rayon_recherche} km</p>}
                          {loc.description && <p><strong>Description:</strong> {loc.description}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.empty}>Aucune localisation</div>
                  )}
                </div>
              )}

              {activeTab === 'historique' && (
                <div className={styles.tabContent}>
                  <h3><History size={20} /> {t('authority.dossierDetail.tabs.history')}</h3>
                  {historique.length > 0 ? (
                    <div className={styles.timeline}>
                      {historique.map((entry: any) => (
                        <div key={entry.id} className={styles.timelineItem}>
                          <div className={styles.timelineDate}>{new Date(entry.date_modification).toLocaleDateString(locale)}</div>
                          <div className={styles.timelineContent}>
                            <p><strong>{entry.action}</strong></p>
                            <p>{entry.description}</p>
                            {entry.modified_by && <small>{t('authority.dossierDetail.fields.author')}: {entry.modified_by}</small>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.timeline}>
                      <div className={styles.timelineItem}>
                        <div className={styles.timelineDate}>{new Date(dossier?.created_at || Date.now()).toLocaleDateString(locale)}</div>
                        <div className={styles.timelineContent}><p>{t('authority.dossiers.title')}</p></div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'commentaires' && (
                <div className={styles.tabContent}>
                  <h3><MessageSquare size={20} /> Commentaires (dont confidentiels)</h3>
                  {loadingExtra ? (
                    <div className={styles.loading}>{t('authority.header.loading')}</div>
                  ) : commentaires.length > 0 ? (
                    <div className={styles.itemsList}>
                      {commentaires.map((c: any) => (
                        <div key={c.id} className={styles.itemCard}>
                          <div className={styles.itemHeader}>
                            <span className={styles.badge} style={{ backgroundColor: c.confidentiel ? '#7c3aed' : '#64748b' }}>
                              {c.type_commentaire || 'note'} {c.confidentiel && <Lock size={12} style={{ marginLeft: 4, verticalAlign: 'middle' }} />}
                            </span>
                            <span>{new Date(c.created_at).toLocaleString(locale)}</span>
                          </div>
                          <p>{c.contenu}</p>
                          {c.utilisateur && (
                            <p><strong>Auteur:</strong> {c.utilisateur.nom || ''} {c.utilisateur.email ? `(${c.utilisateur.email})` : ''}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.empty}>Aucun commentaire</div>
                  )}
                </div>
              )}

              {activeTab === 'documents' && (
                <div className={styles.tabContent}>
                  <h3><FileText size={20} /> Documents joints</h3>
                  {loadingExtra ? (
                    <div className={styles.loading}>{t('authority.header.loading')}</div>
                  ) : documents.length > 0 ? (
                    <div className={styles.itemsList}>
                      {documents.map((d: any) => (
                        <div key={d.id} className={styles.itemCard}>
                          <div className={styles.itemHeader}>
                            <h4>{d.nom_fichier}</h4>
                            <span className={styles.badge} style={{ backgroundColor: d.confidentiel ? '#7c3aed' : '#059669' }}>
                              {d.type_document} {d.confidentiel && <Lock size={12} style={{ marginLeft: 4, verticalAlign: 'middle' }} />}
                            </span>
                          </div>
                          <p><strong>Type:</strong> {d.type_document}</p>
                          {d.taille_octets != null && <p><strong>Taille:</strong> {Math.round(Number(d.taille_octets) / 1024)} Ko</p>}
                          {d.description && <p>{d.description}</p>}
                          <a href={d.url_fichier} target="_blank" rel="noopener noreferrer">Ouvrir</a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.empty}>Aucun document</div>
                  )}
                </div>
              )}

              {activeTab === 'alertes' && (
                <div className={styles.tabContent}>
                  <h3><Bell size={20} /> Alertes liées</h3>
                  {loadingExtra ? (
                    <div className={styles.loading}>{t('authority.header.loading')}</div>
                  ) : alertes.length > 0 ? (
                    <div className={styles.itemsList}>
                      {alertes.map((a: any) => (
                        <div key={a.id} className={styles.itemCard}>
                          <div className={styles.itemHeader}>
                            <h4>{a.titre}</h4>
                            <span className={styles.badge} style={{ backgroundColor: a.statut_alerte === 'en_cours' ? '#dc3545' : '#6c757d' }}>
                              {a.statut_alerte}
                            </span>
                          </div>
                          <p><strong>Type:</strong> {a.type_alerte}</p>
                          <p><strong>Diffusion:</strong> {new Date(a.date_diffusion).toLocaleString(locale)}</p>
                          {a.message_court && <p>{a.message_court}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.empty}>Aucune alerte</div>
                  )}
                </div>
              )}

              {activeTab === 'resultats_ia' && (
                <div className={styles.tabContent}>
                  <h3><Brain size={20} /> Résultats IA</h3>
                  {loadingExtra ? (
                    <div className={styles.loading}>{t('authority.header.loading')}</div>
                  ) : resultatsIa.length > 0 ? (
                    <div className={styles.itemsList}>
                      {resultatsIa.map((r: any) => (
                        <div key={r.id} className={styles.itemCard}>
                          <div className={styles.itemHeader}>
                            <h4>{r.type_analyse}</h4>
                            <span
                              className={styles.badge}
                              style={{
                                backgroundColor:
                                  r.statut_validation === 'confirme' ? '#28a745' : r.statut_validation === 'infirme' ? '#dc3545' : '#ffc107',
                              }}
                            >
                              {r.statut_validation} — {(r.score_confiance ?? 0).toFixed(1)}%
                            </span>
                          </div>
                          <p><strong>Date analyse:</strong> {new Date(r.date_analyse).toLocaleString(locale)}</p>
                          {r.modele_ia_utilise && <p><strong>Modèle:</strong> {r.modele_ia_utilise}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.empty}>Aucun résultat IA</div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminDossierDetailPage;
