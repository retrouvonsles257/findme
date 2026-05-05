/**
 * =====================================================
 * RETROUVONSLES - Citizen Signalement Detail Page
 * Affichage détaillé d'un signalement
 * =====================================================
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useI18n } from '../../hooks';
import { supabase } from '../../config';
import { CitizenLayout } from './CitizenLayout';
import { 
  ArrowLeft, MapPin, Calendar, Clock, Eye, CheckCircle, 
  XCircle, AlertCircle, Image as ImageIcon
} from 'lucide-react';
import { AdminDetailSkeleton } from '../admin/skeletons';
import {
  getRawStatut,
  getCitizenStatusI18nSuffix,
  getStatutPhase,
} from '../../features/signalements/utils/citizenStatutValidationUi';
import styles from './SignalementDetailPage.module.css';

interface SignalementDetail {
  id: string;
  numero_signalement?: string;
  description: string;
  date_observation: string;
  lieu_observation?: string;
  ville_observation?: string;
  region_observation?: string;
  pays_observation?: string;
  latitude_observation?: number;
  longitude_observation?: number;
  niveau_certitude?: string;
  contexte_observation?: string;
  direction_deplacement?: string;
  statut_validation: string;
  source_signalement?: string;
  created_at: string;
  updated_at: string;
}

interface Photo {
  id: string;
  url_cloudinary: string;
  url_thumbnail?: string;
  type_photo?: string;
}

export const CitizenSignalementDetailPage: React.FC = () => {
  const { signalementId } = useParams<{ signalementId: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();

  const [signalement, setSignalement] = useState<SignalementDetail | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSignalement = async () => {
      if (!signalementId) {
        setError(t('citizen.signalementDetail.missingId'));
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Récupérer le signalement
        const { data: sigData, error: sigError } = await (supabase as any)
          .from('signalement')
          .select('*')
          .eq('id', signalementId)
          .single();

        if (sigError) throw sigError;
        if (!sigData) throw new Error(t('citizen.signalementDetail.notFound'));

        setSignalement(sigData);

        // Récupérer les photos associées
        const { data: photoData } = await (supabase as any)
          .from('photo')
          .select('id, url_cloudinary, url_thumbnail, type_photo')
          .eq('id_signalement', signalementId);

        if (photoData) {
          setPhotos(photoData);
        }

      } catch (err: any) {
        console.error('Erreur chargement signalement:', err);
        setError(err.message || t('citizen.signalementDetail.loadError'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchSignalement();
  }, [signalementId, t]);

  // Formater la date
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const buildStatusInfo = (sig: SignalementDetail) => {
    const raw = getRawStatut(sig);
    const label = t(`citizen.${getCitizenStatusI18nSuffix(raw)}`);
    const phase = getStatutPhase(raw);
    if (phase === 'ok') {
      return { icon: <CheckCircle size={20} />, color: '#22c55e', label };
    }
    if (phase === 'nok') {
      return { icon: <XCircle size={20} />, color: '#ef4444', label };
    }
    if (phase === 'other') {
      return { icon: <AlertCircle size={20} />, color: '#64748b', label };
    }
    if (phase === 'review') {
      return { icon: <Eye size={20} />, color: '#f59e0b', label };
    }
    return { icon: <AlertCircle size={20} />, color: '#6b7280', label };
  };

  // Niveau de certitude
  const getCertitudeLabel = (certitude?: string) => {
    if (!certitude) return t('citizen.certitude.notSpecified');
    switch (certitude) {
      case 'certain':
        return t('citizen.certitude.certain');
      case 'tres_probable':
        return t('citizen.certitude.veryProbable');
      case 'probable':
        return t('citizen.certitude.probable');
      case 'incertain':
        return t('citizen.certitude.uncertain');
      case 'doute':
        return t('citizen.certitude.doubt');
      default:
        return t('citizen.certitude.notSpecified');
    }
  };

  if (isLoading) {
    return (
      <CitizenLayout activeNav="signalements">
        <div className={styles.skeletonWrap}>
          <AdminDetailSkeleton blockCount={3} linesPerBlock={4} />
        </div>
      </CitizenLayout>
    );
  }

  if (error || !signalement) {
    return (
      <CitizenLayout activeNav="signalements">
        <div className={styles.error}>
          <AlertCircle size={40} />
          <p>{error || t('citizen.signalementDetail.notFound')}</p>
          <button onClick={() => navigate('/citizen/my-signalements')} className={styles.backButton}>
            <ArrowLeft size={18} />
            {t('common.back')}
          </button>
        </div>
      </CitizenLayout>
    );
  }

  const statusInfo = buildStatusInfo(signalement);

  return (
    <CitizenLayout activeNav="signalements">
      <div className={styles.container}>
        {/* Header avec bouton retour */}
        <div className={styles.header}>
          <button onClick={() => navigate('/citizen/my-signalements')} className={styles.backButton}>
            <ArrowLeft size={18} />
            {t('common.back')}
          </button>
          <div className={styles.statusBadge} style={{ backgroundColor: statusInfo.color }}>
            {statusInfo.icon}
            <span>{statusInfo.label}</span>
          </div>
        </div>

        {/* Numéro du signalement */}
        <div className={styles.titleSection}>
          <h1>
            {signalement.numero_signalement ||
              t('citizen.signalementDetail.number').replace('{{id}}', signalement.id.substring(0, 8))}
          </h1>
          <p className={styles.createdAt}>
            <Clock size={14} />
            {t('common.createdAt')}: {formatDate(signalement.created_at)}
          </p>
        </div>

        {/* Informations principales */}
        <div className={styles.mainInfo}>
          {/* Localisation */}
          <div className={styles.infoCard}>
            <div className={styles.infoCardHeader}>
              <MapPin size={20} />
              <h3>{t('citizen.location')}</h3>
            </div>
            <div className={styles.infoCardBody}>
              {signalement.lieu_observation && (
                <p><strong>{t('citizen.location')}:</strong> {signalement.lieu_observation}</p>
              )}
              {signalement.ville_observation && (
                <p><strong>{t('citizen.city')}:</strong> {signalement.ville_observation}</p>
              )}
              {signalement.region_observation && (
                <p><strong>{t('citizen.region')}:</strong> {signalement.region_observation}</p>
              )}
              {signalement.pays_observation && (
                <p><strong>{t('citizen.country')}:</strong> {signalement.pays_observation}</p>
              )}
              {signalement.latitude_observation && signalement.longitude_observation && (
                <p className={styles.coordinates}>
                  <strong>GPS:</strong> {signalement.latitude_observation.toFixed(5)}, {signalement.longitude_observation.toFixed(5)}
                </p>
              )}
            </div>
          </div>

          {/* Date d'observation */}
          <div className={styles.infoCard}>
            <div className={styles.infoCardHeader}>
              <Calendar size={20} />
              <h3>{t('citizen.observationDate')}</h3>
            </div>
            <div className={styles.infoCardBody}>
              <p>{formatDate(signalement.date_observation)}</p>
              {signalement.niveau_certitude && (
                <p><strong>{t('citizen.certaintyLevel')}:</strong> {getCertitudeLabel(signalement.niveau_certitude)}</p>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className={styles.descriptionSection}>
          <h3>{t('citizen.description')}</h3>
          <p>{signalement.description}</p>
        </div>

        {/* Contexte */}
        {signalement.contexte_observation && (
          <div className={styles.contextSection}>
            <h3>{t('citizen.context')}</h3>
            <p>{signalement.contexte_observation}</p>
          </div>
        )}

        {/* Direction de déplacement */}
        {signalement.direction_deplacement && (
          <div className={styles.directionSection}>
            <h3>{t('citizen.direction')}</h3>
            <p>{signalement.direction_deplacement}</p>
          </div>
        )}

        {/* Photos */}
        {photos.length > 0 && (
          <div className={styles.photosSection}>
            <div className={styles.photosSectionHeader}>
              <ImageIcon size={20} />
              <h3>{t('citizen.photos')} ({photos.length})</h3>
            </div>
            <div className={styles.photosGrid}>
              {photos.map((photo) => (
                <div key={photo.id} className={styles.photoCard}>
                  <img 
                    src={photo.url_thumbnail || photo.url_cloudinary} 
                    alt="Signalement" 
                    onClick={() => window.open(photo.url_cloudinary, '_blank')}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Informations supplémentaires */}
        <div className={styles.metaSection}>
          <p><strong>{t('citizen.source')}:</strong> {signalement.source_signalement || t('citizen.webApp')}</p>
          {signalement.updated_at !== signalement.created_at && (
            <p><strong>{t('common.updatedAt')}:</strong> {formatDate(signalement.updated_at)}</p>
          )}
        </div>
      </div>
    </CitizenLayout>
  );
};

export default CitizenSignalementDetailPage;
