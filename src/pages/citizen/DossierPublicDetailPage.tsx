/**
 * =====================================================
 * RETROUVONSLES - Citizen Dossier Public Detail Page
 * Page pour visualiser les détails d'un dossier public
 * Intégré avec useDossierDetail
 * =====================================================
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDossierDetail } from '../../features/dossiers/hooks/useDossierDetail';
import { useAuth } from '../../contexts';
import { useI18n } from '../../hooks';
import { supabase } from '../../config';
import { CitizenLayout } from './CitizenLayout';
import {
  User,
  Calendar,
  MapPin,
  Clock,
  Eye,
  Share2,
  AlertTriangle,
  ChevronLeft,
  Image,
  Loader2,
  AlertCircle,
  MessageSquare,
  CheckCircle,
  Info,
} from 'lucide-react';
import { AdminDetailSkeleton } from 'components/skeletons';
import { CitizenDossierMessagerieSection } from '../../features/messagerie/CitizenDossierMessagerieSection';
import styles from './DossierPublicDetailPage.module.css';

export const CitizenDossierPublicDetailPage: React.FC = () => {
  const { t } = useI18n();
  const { user } = useAuth();
  const { dossierId } = useParams<{ dossierId: string }>();
  const navigate = useNavigate();

  const { dossier, isLoading, error, fetchDossier } = useDossierDetail();
  const [activeTab, setActiveTab] = useState<'info' | 'photos' | 'timeline' | 'messagerie'>('info');
  const [shareSuccess, setShareSuccess] = useState(false);
  const [publicPhotos, setPublicPhotos] = useState<Array<{ id: string; url_cloudinary: string; url_thumbnail?: string | null }>>([]);
  const [photosLoading, setPhotosLoading] = useState(false);

  // Charger le dossier
  useEffect(() => {
    if (dossierId) {
      fetchDossier(dossierId);
    }
  }, [dossierId, fetchDossier]);

  useEffect(() => {
    if (!dossier || isLoading) return;
    const creatorId = (dossier as any).id_utilisateur_createur as string | undefined;
    const isCreator = Boolean(user?.id && creatorId && user.id === creatorId);
    if (!isCreator && activeTab === 'messagerie') setActiveTab('info');
  }, [dossier, isLoading, user?.id, activeTab]);

  // Charger les photos publiques approuvées (conformes au modèle: visible_public = TRUE, approuvee = TRUE)
  useEffect(() => {
    const load = async () => {
      const d: any = dossier;
      const personId = d?.id_personne;
      if (!personId) {
        setPublicPhotos([]);
        return;
      }
      try {
        setPhotosLoading(true);
        const { data } = await (supabase as any)
          .from('photo')
          .select('id, url_cloudinary, url_thumbnail')
          .eq('id_personne', personId)
          .eq('visible_public', true)
          .eq('approuvee', true)
          .order('created_at', { ascending: false });
        setPublicPhotos((data || []) as any[]);
      } catch {
        setPublicPhotos([]);
      } finally {
        setPhotosLoading(false);
      }
    };
    load();
  }, [dossier]);

  // Partager le dossier
  const handleShare = async () => {
    if (!dossier) return;

    const d = dossier as any;
    const shareUrl = `${window.location.origin}/citizen/dossier/${dossier.id}`;
    const p = d.personne || {};
    const name = p.nom_complet || `${p.prenom || ''} ${p.nom || ''}`.trim() || (d.numero_dossier || '');
    const shareText = `${t('citizen.helpFindPerson')}: ${name}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    }
  };

  // Signaler un témoignage
  const handleReportSighting = () => {
    if (!dossier) return;
    navigate(`/citizen/new-signalement?dossierId=${(dossier as any).id}`);
  };

  // Formater la date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Calculer le temps écoulé
  const getTimeSince = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const days = Math.floor((now.getTime() - date.getTime()) / 86400000);

    if (days === 0) return t('common.today');
    if (days === 1) return t('common.yesterday');
    if (days < 7) return `${days} ${t('common.days')}`;
    if (days < 30) return `${Math.floor(days / 7)} ${t('common.weeks')}`;
    return `${Math.floor(days / 30)} ${t('common.months')}`;
  };

  // Obtenir la couleur d'urgence
  const getUrgencyColor = (level?: number | string) => {
    if (!level) return '#6b7280';
    if (typeof level === 'number') {
      if (level >= 8) return '#dc2626';
      if (level >= 5) return '#f59e0b';
      return '#0284c7';
    }
    if (level === 'critique') return '#dc2626';
    if (level === 'urgent') return '#f59e0b';
    return '#0284c7';
  };

  // Obtenir le label du statut
  const getStatusLabel = (statut?: string) => {
    switch (statut) {
      case 'en_cours':
        return t('citizen.inProgress');
      case 'retrouve_vivant':
      case 'retrouve_decede':
        return t('citizen.resolved');
      case 'suspendu':
      case 'classe_sans_suite':
      case 'transfere':
        return t('citizen.archived');
      default:
        return statut || '—';
    }
  };

  if (isLoading) {
    return (
      <CitizenLayout activeNav="dossiers">
        <div className={styles.dossierDetail}>
          <div className={styles['dossierDetail__skeletonWrap']}>
            <AdminDetailSkeleton blockCount={3} linesPerBlock={4} />
          </div>
        </div>
      </CitizenLayout>
    );
  }

  if (error || !dossier) {
    return (
      <CitizenLayout activeNav="dossiers">
        <div className={styles.dossierDetail}>
          <div className={styles['dossierDetail__error']}>
            <AlertCircle size={48} />
            <h3>{t('citizen.caseNotFound')}</h3>
            <p>{error || t('citizen.caseNotFoundDescription')}</p>
            <button onClick={() => navigate('/citizen/dossiers')}>
              <ChevronLeft size={18} />
              {t('common.back')}
            </button>
          </div>
        </div>
      </CitizenLayout>
    );
  }

  // Enforce "public dossier" for citizen view
  const d: any = dossier;
  if (d.visible_public === false) {
    return (
      <CitizenLayout activeNav="dossiers">
        <div className={styles.dossierDetail}>
          <div className={styles['dossierDetail__error']}>
            <AlertCircle size={48} />
            <h3>{t('citizen.caseNotFound')}</h3>
            <p>{t('citizen.caseNotFoundDescription')}</p>
            <button onClick={() => navigate('/citizen/dossiers')}>
              <ChevronLeft size={18} />
              {t('common.back')}
            </button>
          </div>
        </div>
      </CitizenLayout>
    );
  }

  const p = d.personne || {};
  const displayName = p.nom_complet || `${p.prenom || ''} ${p.nom || ''}`.trim() || d.numero_dossier || '—';
  const mainPhoto = p.photo_principale || null;
  const views = d.nombre_vues_fiche ?? d.nombre_vues ?? 0;
  const publicStats = {
    signalements: d.nombre_signalements ?? 0,
    alertes: d.nombre_alertes_diffusees ?? 0,
    vues: views,
  };

  const getAgeDisplay = () => {
    if (p.date_naissance) {
      const age = Math.max(0, Math.floor((Date.now() - new Date(p.date_naissance).getTime()) / 31557600000));
      return age;
    }
    if (typeof p.age_estime_min === 'number') return p.age_estime_min;
    return null;
  };

  const age = getAgeDisplay();

  const sexeLabel = (() => {
    switch (p.sexe) {
      case 'masculin':
        return t('citizen.male');
      case 'feminin':
        return t('citizen.female');
      default:
        return p.sexe || '—';
    }
  })();

  const timelineEntries = [
    d.date_disparition
      ? { date: d.date_disparition, description: `${t('citizen.missingSince')}: ${d.lieu_disparition || '—'}` }
      : null,
    d.date_derniere_observation
      ? { date: d.date_derniere_observation, description: `${t('citizen.lastSeen')}: ${d.lieu_disparition || '—'}` }
      : null,
    d.date_resolution
      ? { date: d.date_resolution, description: `${t('citizen.resolved')}` }
      : null,
  ].filter(Boolean) as Array<{ date: string; description: string }>;

  const showMessagerieTab = Boolean(
    user?.id && d.id_utilisateur_createur && user.id === d.id_utilisateur_createur,
  );

  return (
    <CitizenLayout activeNav="dossiers">
      <div className={styles.dossierDetail}>
        {/* Back Button */}
        <button 
          className={styles['dossierDetail__back']}
          onClick={() => navigate(-1)}
        >
          <ChevronLeft size={20} />
          {t('common.back')}
        </button>

        {/* Header */}
        <div className={styles['dossierDetail__header']}>
          <div className={styles['dossierDetail__photo']}>
            {mainPhoto ? (
              <img 
                src={mainPhoto} 
                alt={displayName}
              />
            ) : (
              <User size={64} />
            )}
            {(() => {
              const u = (dossier as any).niveau_urgence;
              const isUrgent =
                (typeof u === 'number' && u >= 7) || u === 'urgent' || u === 'critique';
              return Boolean(u) && isUrgent;
            })() && (
              <span className={styles['dossierDetail__urgent-badge']}>
                <AlertTriangle size={14} />
                {t('citizen.urgent')}
              </span>
            )}
          </div>

          <div className={styles['dossierDetail__info']}>
            <h1 className={styles['dossierDetail__name']}>
              {displayName}
            </h1>

            <div className={styles['dossierDetail__status']}>
              <span 
                className={styles['dossierDetail__status-badge']}
                data-status={d.statut_dossier}
              >
                {getStatusLabel(d.statut_dossier)}
              </span>
              {d.niveau_urgence && (
                <span 
                  className={styles['dossierDetail__urgency']}
                  style={{ color: getUrgencyColor(d.niveau_urgence) }}
                >
                  {t('citizen.urgencyLevel')}: {String(d.niveau_urgence)}
                </span>
              )}
            </div>

            <div className={styles['dossierDetail__meta']}>
              <span>
                <Calendar size={16} />
                {t('citizen.missingSince')}: {formatDate(d.date_disparition)}
              </span>
              <span>
                <Clock size={16} />
                {getTimeSince(d.date_disparition)}
              </span>
              <span>
                <Eye size={16} />
                {views} {t('citizen.views')}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className={styles['dossierDetail__actions']}>
          <button 
            className={styles['dossierDetail__action-primary']}
            onClick={handleReportSighting}
          >
            <MessageSquare size={18} />
            {t('citizen.reportSighting')}
          </button>
          <button 
            className={styles['dossierDetail__action-secondary']}
            onClick={handleShare}
          >
            {shareSuccess ? (
              <>
                <CheckCircle size={18} />
                {t('citizen.copied')}
              </>
            ) : (
              <>
                <Share2 size={18} />
                {t('citizen.share')}
              </>
            )}
          </button>
        </div>

        {/* Tabs */}
        <div className={styles['dossierDetail__tabs']}>
          <button
            className={`${styles['dossierDetail__tab']} ${activeTab === 'info' ? styles['dossierDetail__tab--active'] : ''}`}
            onClick={() => setActiveTab('info')}
          >
            <Info size={18} />
            {t('citizen.information')}
          </button>
          <button
            className={`${styles['dossierDetail__tab']} ${activeTab === 'photos' ? styles['dossierDetail__tab--active'] : ''}`}
            onClick={() => setActiveTab('photos')}
          >
            <Image size={18} />
            {t('citizen.photos')}
          </button>
          <button
            className={`${styles['dossierDetail__tab']} ${activeTab === 'timeline' ? styles['dossierDetail__tab--active'] : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            <Clock size={18} />
            {t('citizen.timeline')}
          </button>
          {showMessagerieTab && (
            <button
              className={`${styles['dossierDetail__tab']} ${activeTab === 'messagerie' ? styles['dossierDetail__tab--active'] : ''}`}
              onClick={() => setActiveTab('messagerie')}
            >
              <MessageSquare size={18} />
              {t('citizen.dossierPublic.tabMessagerie')}
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className={styles['dossierDetail__content']}>
          {/* Info Tab */}
          {activeTab === 'info' && (
            <div className={styles['dossierDetail__info-grid']}>
              {/* Description physique */}
              <div className={styles['dossierDetail__section']}>
                <h3>{t('citizen.physicalDescription')}</h3>
                <div className={styles['dossierDetail__field-grid']}>
                  {typeof age === 'number' && (
                    <div className={styles['dossierDetail__field']}>
                      <label>{t('citizen.age')}</label>
                      <span>{age} {t('citizen.years')}</span>
                    </div>
                  )}
                  {p.sexe && (
                    <div className={styles['dossierDetail__field']}>
                      <label>{t('citizen.gender')}</label>
                      <span>{sexeLabel}</span>
                    </div>
                  )}
                  {p.taille_cm && (
                    <div className={styles['dossierDetail__field']}>
                      <label>{t('citizen.height')}</label>
                      <span>{p.taille_cm} cm</span>
                    </div>
                  )}
                  {p.poids_kg && (
                    <div className={styles['dossierDetail__field']}>
                      <label>{t('citizen.weight')}</label>
                      <span>{p.poids_kg} kg</span>
                    </div>
                  )}
                  {p.couleur_cheveux && (
                    <div className={styles['dossierDetail__field']}>
                      <label>{t('citizen.hairColor')}</label>
                      <span>{p.couleur_cheveux}</span>
                    </div>
                  )}
                  {p.couleur_yeux && (
                    <div className={styles['dossierDetail__field']}>
                      <label>{t('citizen.eyeColor')}</label>
                      <span>{p.couleur_yeux}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Lieu de disparition */}
              <div className={styles['dossierDetail__section']}>
                <h3>{t('citizen.lastSeenLocation')}</h3>
                <div className={styles['dossierDetail__location']}>
                  <MapPin size={20} />
                  <div>
                    <p className={styles['dossierDetail__location-name']}>
                      {d.lieu_disparition || '—'}
                    </p>
                    <p className={styles['dossierDetail__location-city']}>
                      {d.ville_disparition && d.region_disparition
                        ? `${d.ville_disparition}, ${d.region_disparition}`
                        : d.ville_disparition || d.region_disparition || ''}
                    </p>
                    <p className={styles['dossierDetail__location-city']}>
                      {d.pays_disparition || ''}
                    </p>
                    {d.latitude_disparition != null && d.longitude_disparition != null && (
                      <p className={styles['dossierDetail__location-city']}>
                        Coordonnées: {Number(d.latitude_disparition).toFixed(4)}, {Number(d.longitude_disparition).toFixed(4)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Statistiques */}
              <div className={styles['dossierDetail__section']}>
                <h3>Statistiques</h3>
                <div className={styles['dossierDetail__field-grid']}>
                  <div className={styles['dossierDetail__field']}>
                    <label>Signalements</label>
                    <span>{publicStats.signalements}</span>
                  </div>
                  <div className={styles['dossierDetail__field']}>
                    <label>Alertes</label>
                    <span>{publicStats.alertes}</span>
                  </div>
                  <div className={styles['dossierDetail__field']}>
                    <label>{t('citizen.views')}</label>
                    <span>{publicStats.vues}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {d.circonstances && (
                <div className={styles['dossierDetail__section']}>
                  <h3>{t('citizen.additionalInfo')}</h3>
                  <p className={styles['dossierDetail__description']}>
                    {d.circonstances}
                  </p>
                </div>
              )}

              {/* Signes distinctifs */}
              {p.signes_distinctifs && (
                <div className={styles['dossierDetail__section']}>
                  <h3>{t('citizen.distinctiveFeatures')}</h3>
                  <p className={styles['dossierDetail__description']}>
                    {p.signes_distinctifs}
                  </p>
                </div>
              )}

              {/* Vêtements */}
              {p.derniers_vetements_portes && (
                <div className={styles['dossierDetail__section']}>
                  <h3>{t('citizen.lastSeenClothing')}</h3>
                  <p className={styles['dossierDetail__description']}>
                    {p.derniers_vetements_portes}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Photos Tab */}
          {activeTab === 'photos' && (
            <div className={styles['dossierDetail__photos']}>
              {photosLoading ? (
                <div className={styles['dossierDetail__empty']}>
                  <Loader2 size={24} className={styles['dossierDetail__spin']} />
                  <p>{t('common.loading')}</p>
                </div>
              ) : publicPhotos.length > 0 ? (
                <div className={styles['dossierDetail__photos-grid']}>
                  {publicPhotos.map((ph, index) => (
                    <div key={ph.id} className={styles['dossierDetail__photo-item']}>
                      <img
                        src={ph.url_thumbnail || ph.url_cloudinary}
                        alt={`${index + 1}`}
                        onClick={() => window.open(ph.url_cloudinary, '_blank')}
                      />
                    </div>
                  ))}
                </div>
              ) : mainPhoto ? (
                <div className={styles['dossierDetail__photos-grid']}>
                  <div className={styles['dossierDetail__photo-item']}>
                    <img src={mainPhoto} alt={displayName} />
                  </div>
                </div>
              ) : (
                <div className={styles['dossierDetail__empty']}>
                  <Image size={48} />
                  <p>{t('citizen.noPhotos')}</p>
                </div>
              )}
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div className={styles['dossierDetail__timeline']}>
              {timelineEntries.length > 0 ? (
                timelineEntries.map((entry, index) => (
                  <div key={index} className={styles['dossierDetail__timeline-item']}>
                    <div className={styles['dossierDetail__timeline-dot']} />
                    <div className={styles['dossierDetail__timeline-content']}>
                      <p className={styles['dossierDetail__timeline-date']}>
                        {formatDate(entry.date)}
                      </p>
                      <p className={styles['dossierDetail__timeline-text']}>
                        {entry.description}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles['dossierDetail__empty']}>
                  <Clock size={48} />
                  <p>{t('citizen.noTimeline')}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'messagerie' && showMessagerieTab && dossierId && (
            <div className={styles['dossierDetail__section']}>
              <CitizenDossierMessagerieSection
                dossierId={dossierId}
                creatorUserId={d.id_utilisateur_createur ?? null}
                responsibleOrgId={d.id_organisation_responsable ?? null}
              />
            </div>
          )}
        </div>
      </div>
    </CitizenLayout>
  );
};
