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
import { useI18n } from '../../hooks';
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
  Phone,
  Image,
  Loader2,
  AlertCircle,
  MessageSquare,
  CheckCircle,
  Info,
} from 'lucide-react';
import styles from './DossierPublicDetailPage.module.css';

export const CitizenDossierPublicDetailPage: React.FC = () => {
  const { t } = useI18n();
  const { dossierId } = useParams<{ dossierId: string }>();
  const navigate = useNavigate();
  
  const { dossier, isLoading, error, fetchDossier } = useDossierDetail();
  const [activeTab, setActiveTab] = useState<'info' | 'photos' | 'timeline'>('info');
  const [shareSuccess, setShareSuccess] = useState(false);

  // Charger le dossier
  useEffect(() => {
    if (dossierId) {
      fetchDossier(dossierId);
    }
  }, [dossierId, fetchDossier]);

  // Partager le dossier
  const handleShare = async () => {
    if (!dossier) return;
    
    const d = dossier as any;
    const shareUrl = `${window.location.origin}/citizen/dossier/${dossier.id}`;
    const shareText = `${t('citizen.helpFindPerson')}: ${d.prenom || ''} ${d.nom || ''}`;

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
    navigate(`/citizen/signalements/new?dossierId=${dossier.id}`);
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
  const getUrgencyColor = (level?: number) => {
    if (!level) return '#6b7280';
    if (level >= 8) return '#dc2626';
    if (level >= 5) return '#f59e0b';
    return '#16a34a';
  };

  // Obtenir le label du statut
  const getStatusLabel = (statut?: string) => {
    switch (statut) {
      case 'actif':
        return t('citizen.activeCases');
      case 'en_cours':
        return t('citizen.inProgress');
      case 'resolu':
      case 'retrouve':
        return t('citizen.resolved');
      case 'archive':
        return t('citizen.archived');
      default:
        return statut || '—';
    }
  };

  if (isLoading) {
    return (
      <CitizenLayout activeNav="map">
        <div className={styles.dossierDetail}>
          <div className={styles['dossierDetail__loading']}>
            <Loader2 size={32} className={styles['dossierDetail__spin']} />
            <p>{t('common.loading')}</p>
          </div>
        </div>
      </CitizenLayout>
    );
  }

  if (error || !dossier) {
    return (
      <CitizenLayout activeNav="map">
        <div className={styles.dossierDetail}>
          <div className={styles['dossierDetail__error']}>
            <AlertCircle size={48} />
            <h3>{t('citizen.caseNotFound')}</h3>
            <p>{error || t('citizen.caseNotFoundDescription')}</p>
            <button onClick={() => navigate('/citizen/map')}>
              <ChevronLeft size={18} />
              {t('citizen.backToMap')}
            </button>
          </div>
        </div>
      </CitizenLayout>
    );
  }

  return (
    <CitizenLayout activeNav="map">
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
            {(dossier as any).photo_principale ? (
              <img 
                src={(dossier as any).photo_principale} 
                alt={`${(dossier as any).prenom || ''} ${(dossier as any).nom || ''}`}
              />
            ) : (
              <User size={64} />
            )}
            {(dossier as any).niveau_urgence && (dossier as any).niveau_urgence >= 7 && (
              <span className={styles['dossierDetail__urgent-badge']}>
                <AlertTriangle size={14} />
                {t('citizen.urgent')}
              </span>
            )}
          </div>

          <div className={styles['dossierDetail__info']}>
            <h1 className={styles['dossierDetail__name']}>
              {(dossier as any).prenom || ''} {(dossier as any).nom || ''}
            </h1>
            
            <div className={styles['dossierDetail__status']}>
              <span 
                className={styles['dossierDetail__status-badge']}
                data-status={(dossier as any).statut}
              >
                {getStatusLabel((dossier as any).statut)}
              </span>
              {(dossier as any).niveau_urgence && (
                <span 
                  className={styles['dossierDetail__urgency']}
                  style={{ color: getUrgencyColor((dossier as any).niveau_urgence) }}
                >
                  {t('citizen.urgencyLevel')}: {(dossier as any).niveau_urgence}/10
                </span>
              )}
            </div>

            <div className={styles['dossierDetail__meta']}>
              <span>
                <Calendar size={16} />
                {t('citizen.missingSince')}: {formatDate((dossier as any).date_disparition)}
              </span>
              <span>
                <Clock size={16} />
                {getTimeSince((dossier as any).date_disparition)}
              </span>
              <span>
                <Eye size={16} />
                {(dossier as any).vues || 0} {t('citizen.views')}
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
                  {(dossier as any).age && (
                    <div className={styles['dossierDetail__field']}>
                      <label>{t('citizen.age')}</label>
                      <span>{(dossier as any).age} {t('citizen.years')}</span>
                    </div>
                  )}
                  {(dossier as any).sexe && (
                    <div className={styles['dossierDetail__field']}>
                      <label>{t('citizen.gender')}</label>
                      <span>{(dossier as any).sexe === 'M' ? t('citizen.male') : t('citizen.female')}</span>
                    </div>
                  )}
                  {(dossier as any).taille && (
                    <div className={styles['dossierDetail__field']}>
                      <label>{t('citizen.height')}</label>
                      <span>{(dossier as any).taille} cm</span>
                    </div>
                  )}
                  {(dossier as any).poids && (
                    <div className={styles['dossierDetail__field']}>
                      <label>{t('citizen.weight')}</label>
                      <span>{(dossier as any).poids} kg</span>
                    </div>
                  )}
                  {(dossier as any).couleur_cheveux && (
                    <div className={styles['dossierDetail__field']}>
                      <label>{t('citizen.hairColor')}</label>
                      <span>{(dossier as any).couleur_cheveux}</span>
                    </div>
                  )}
                  {(dossier as any).couleur_yeux && (
                    <div className={styles['dossierDetail__field']}>
                      <label>{t('citizen.eyeColor')}</label>
                      <span>{(dossier as any).couleur_yeux}</span>
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
                      {(dossier as any).lieu_disparition || '—'}
                    </p>
                    <p className={styles['dossierDetail__location-city']}>
                      {(dossier as any).ville_disparition && (dossier as any).region_disparition
                        ? `${(dossier as any).ville_disparition}, ${(dossier as any).region_disparition}`
                        : (dossier as any).ville_disparition || (dossier as any).region_disparition || ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {(dossier as any).description && (
                <div className={styles['dossierDetail__section']}>
                  <h3>{t('citizen.additionalInfo')}</h3>
                  <p className={styles['dossierDetail__description']}>
                    {(dossier as any).description}
                  </p>
                </div>
              )}

              {/* Signes distinctifs */}
              {(dossier as any).signes_distinctifs && (
                <div className={styles['dossierDetail__section']}>
                  <h3>{t('citizen.distinctiveFeatures')}</h3>
                  <p className={styles['dossierDetail__description']}>
                    {(dossier as any).signes_distinctifs}
                  </p>
                </div>
              )}

              {/* Vêtements */}
              {(dossier as any).vetements_derniere_vue && (
                <div className={styles['dossierDetail__section']}>
                  <h3>{t('citizen.lastSeenClothing')}</h3>
                  <p className={styles['dossierDetail__description']}>
                    {(dossier as any).vetements_derniere_vue}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Photos Tab */}
          {activeTab === 'photos' && (
            <div className={styles['dossierDetail__photos']}>
              {(dossier as any).photos && (dossier as any).photos.length > 0 ? (
                <div className={styles['dossierDetail__photos-grid']}>
                  {(dossier as any).photos.map((photo: string, index: number) => (
                    <div key={index} className={styles['dossierDetail__photo-item']}>
                      <img src={photo} alt={`${index + 1}`} />
                    </div>
                  ))}
                </div>
              ) : (dossier as any).photo_principale ? (
                <div className={styles['dossierDetail__photos-grid']}>
                  <div className={styles['dossierDetail__photo-item']}>
                    <img src={(dossier as any).photo_principale} alt={`${(dossier as any).prenom || ''}`} />
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
              {(dossier as any).timeline && (dossier as any).timeline.length > 0 ? (
                (dossier as any).timeline.map((entry: any, index: number) => (
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
        </div>

        {/* Contact Info */}
        {(dossier as any).contact_reference && (
          <div className={styles['dossierDetail__contact']}>
            <Phone size={20} />
            <div>
              <h4>{t('citizen.contactInfo')}</h4>
              <p>{(dossier as any).contact_reference}</p>
            </div>
          </div>
        )}
      </div>
    </CitizenLayout>
  );
};
