/**
 * =====================================================
 * RETROUVONSLES - Photos Moderation Page
 * Modération des photos des signalements
 * =====================================================
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../hooks';
import { useAppSelector } from '../../store/types';
import { selectUser } from '../../features/auth/store/authSelectors';
import { useSignalements } from '../../features/signalements/hooks/useSignalements';
import { ModerationLayout } from './ModerationLayout';
import { CheckCircle, XCircle, X, Image } from 'lucide-react';
import styles from './PhotosModerationPage.module.css';

export const PhotosModerationPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const currentUser = useAppSelector(selectUser);
  const { signalements, isLoading } = useSignalements();
  const [filterStatus, setFilterStatus] = useState<'all' | 'with_photos' | 'without_photos'>('all');
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [photoActions, setPhotoActions] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');

  // Filtrer les signalements avec photos
  const signalementWithPhotos = signalements.filter((sig) => {
    if (filterStatus === 'with_photos') return sig.photo_url;
    if (filterStatus === 'without_photos') return !sig.photo_url;
    return true;
  });

  // Gérer l'approbation/rejet de photo
  const handlePhotoAction = async (signalementId: string, action: 'approved' | 'rejected') => {
    try {
      setPhotoActions({
        ...photoActions,
        [signalementId]: action,
      });
      setSuccessMessage(action === 'approved' ? t('moderator.photoApproved') : t('moderator.photoRejected'));
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error handling photo action:', err);
    }
  };

  return (
    <ModerationLayout title={t('moderator.photoModeration')} activeNav="photos">
      <div className={styles['photos-moderation']}>
        {/* Welcome Section */}
        <section className={styles['photos-moderation__welcome']}>
          <div className={styles['photos-moderation__welcome-content']}>
            <h1 className={styles['photos-moderation__welcome-title']}>
              {t('moderator.photosTitle')}
            </h1>
            <p className={styles['photos-moderation__welcome-subtitle']}>
              {t('moderator.photosSubtitle')}
            </p>
          </div>
        </section>

        {successMessage && (
          <div className={styles['photos-moderation__success']}>✓ {successMessage}</div>
        )}

        {isLoading ? (
          <div className={styles['photos-moderation__loading']}>
            {t('common.loading')}...
          </div>
        ) : (
          <>
            {/* Filter */}
            <div className={styles['photos-moderation__filter-section']}>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className={styles['photos-moderation__filter-select']}
              >
                <option value="all">{t('moderator.allReports')}</option>
                <option value="with_photos">{t('moderator.withPhotos')}</option>
                <option value="without_photos">{t('moderator.withoutPhotos')}</option>
              </select>
            </div>

            {/* Grid de Photos */}
            <div className={styles['photos-moderation__grid']}>
              {signalementWithPhotos.length > 0 ? (
                signalementWithPhotos.map((sig) => (
                  <div key={sig.id} className={styles['photos-moderation__card']}>
                    {/* Photo */}
                    <div className={styles['photos-moderation__photo-container']}>
                      {sig.photo_url ? (
                        <img
                          src={sig.photo_url}
                          alt={sig.lieu_observation}
                          className={styles['photos-moderation__photo']}
                          onClick={() => setSelectedPhoto(sig)}
                        />
                      ) : (
                        <div className={styles['photos-moderation__no-photo']}>
                          <Image size={40} />
                          <p>{t('moderator.noPhotosFound')}</p>
                        </div>
                      )}
                      {photoActions[sig.id] && (
                        <div
                          className={`${styles['photos-moderation__action-badge']} ${
                            styles[`photos-moderation__action-badge--${photoActions[sig.id]}`]
                          }`}
                        >
                          {photoActions[sig.id] === 'approved' ? '✓ ' + t('moderator.approve') : '✗ ' + t('moderator.reject')}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className={styles['photos-moderation__card-content']}>
                      <h4 className={styles['photos-moderation__card-title']}>
                        📍 {sig.lieu_observation}
                      </h4>
                      <p className={styles['photos-moderation__description']}>
                        {sig.description?.substring(0, 60)}...
                      </p>
                      <div className={styles['photos-moderation__meta']}>
                        <span>{new Date(sig.date_observation).toLocaleDateString('fr-FR')}</span>
                        <span>Score: {sig.score_correspondance || 0}%</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className={styles['photos-moderation__actions']}>
                      <button
                        className={`${styles['photos-moderation__action-btn']} ${styles['photos-moderation__action-btn--approve']}`}
                        onClick={() => handlePhotoAction(sig.id, 'approved')}
                        disabled={!!photoActions[sig.id]}
                      >
                        <CheckCircle size={18} />
                        {t('moderator.approve')}
                      </button>
                      <button
                        className={`${styles['photos-moderation__action-btn']} ${styles['photos-moderation__action-btn--reject']}`}
                        onClick={() => handlePhotoAction(sig.id, 'rejected')}
                        disabled={!!photoActions[sig.id]}
                      >
                        <XCircle size={18} />
                        {t('moderator.reject')}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles['photos-moderation__empty']}>
                  {filterStatus === 'with_photos'
                    ? t('moderator.noPhotosFound')
                    : filterStatus === 'without_photos'
                      ? t('moderator.noPhotosFound')
                      : t('moderator.noReports')}
                </div>
              )}
            </div>

            {/* Modal pour détail photo */}
            {selectedPhoto && (
              <div
                className={styles['photos-moderation__modal']}
                onClick={() => setSelectedPhoto(null)}
              >
                <div
                  className={styles['photos-moderation__modal-content']}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className={styles['photos-moderation__close-btn']}
                    onClick={() => setSelectedPhoto(null)}
                  >
                    <X size={20} />
                  </button>
                  <img
                    src={selectedPhoto.photo_url}
                    alt="Détail"
                    className={styles['photos-moderation__modal-photo']}
                  />
                  <div className={styles['photos-moderation__modal-info']}>
                    <h3 className={styles['photos-moderation__modal-title']}>
                      📍 {selectedPhoto.lieu_observation}
                    </h3>
                    <p className={styles['photos-moderation__modal-description']}>
                      {selectedPhoto.description}
                    </p>
                    <div className={styles['photos-moderation__modal-actions']}>
                      <button
                        className={`${styles['photos-moderation__action-btn']} ${styles['photos-moderation__action-btn--approve']}`}
                        onClick={() => {
                          handlePhotoAction(selectedPhoto.id, 'approved');
                          setSelectedPhoto(null);
                        }}
                      >
                        <CheckCircle size={18} />
                        Approuver
                      </button>
                      <button
                        className={`${styles['photos-moderation__action-btn']} ${styles['photos-moderation__action-btn--reject']}`}
                        onClick={() => {
                          handlePhotoAction(selectedPhoto.id, 'rejected');
                          setSelectedPhoto(null);
                        }}
                      >
                        <XCircle size={18} />
                        Rejeter
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </ModerationLayout>
  );
};

export default PhotosModerationPage;