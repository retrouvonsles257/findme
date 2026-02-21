/**
 * =====================================================
 * RETROUVONSLES - Authority Photos Moderation Page
 * Modération simple des photos (approuver / rejeter)
 * Table Supabase: photo
 * =====================================================
 */
import React, { useCallback, useEffect, useState } from 'react';
import { AuthorityLayout } from '../../components/layout';
import { supabase } from '../../config';
import { useI18n } from '../../hooks';
import { AdminCardsGridSkeleton } from '../admin/skeletons';
import { CheckCircle, XCircle, Eye, RefreshCw, Image as ImageIcon, Loader2, X, Save } from 'lucide-react';
import styles from '../moderator/PhotosModerationPage.module.css';

type Photo = {
  id: string;
  url_cloudinary: string;
  url_thumbnail?: string | null;
  type_photo?: string | null;
  qualite_image?: string | null;
  description?: string | null;
  created_at: string;
  approuvee: boolean;
  visible_public: boolean;
  moderee_par?: string | null;
  date_moderation?: string | null;
  id_personne?: string | null;
  id_signalement?: string | null;
  personne?: { nom?: string | null; prenom?: string | null } | null;
  signalement?: { lieu_observation?: string | null } | null;
};

export const PhotosModerationPage: React.FC = () => {
  const { t, language } = useI18n();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  const [moderationData, setModerationData] = useState({
    qualite_image: 'moyenne',
    type_photo: 'portrait',
    visible_public: true,
  });

  const loadPhotos = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      // Photos en attente: pas encore modérées
      const { data, error: fetchError } = await (supabase as any)
        .from('photo')
        .select(
          `
          id,
          url_cloudinary,
          url_thumbnail,
          type_photo,
          qualite_image,
          description,
          created_at,
          approuvee,
          visible_public,
          moderee_par,
          date_moderation,
          id_personne,
          id_signalement,
          personne:id_personne(nom, prenom),
          signalement:id_signalement(lieu_observation)
        `
        )
        .eq('approuvee', false)
        .is('moderee_par', null)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setPhotos((data || []) as Photo[]);
    } catch (err: any) {
      console.error('[AuthorityPhotosModeration] load error:', err);
      setError(err?.message || t('authority.photosModeration.messages.loadError'));
      setPhotos([]);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const moderatePhoto = async (photoId: string, approved: boolean) => {
    setProcessingId(photoId);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      const nowIso = new Date().toISOString();

      const { error: updError } = await (supabase as any)
        .from('photo')
        .update({
          approuvee: approved,
          visible_public: approved ? moderationData.visible_public : false,
          qualite_image: approved ? moderationData.qualite_image : 'moyenne',
          type_photo: approved ? moderationData.type_photo : (selectedPhoto?.type_photo || 'autre'),
          moderee_par: user?.id,
          date_moderation: nowIso,
        })
        .eq('id', photoId);

      if (updError) throw updError;
      await loadPhotos();
      setSelectedPhoto(null);
    } catch (err: any) {
      console.error('[AuthorityPhotosModeration] update error:', err);
      setError(err?.message || t('authority.photosModeration.messages.updateError'));
    } finally {
      setProcessingId(null);
    }
  };

  const openModal = (p: Photo) => {
    setSelectedPhoto(p);
    setModerationData({
      qualite_image: (p.qualite_image as string) || 'moyenne',
      type_photo: (p.type_photo as string) || 'portrait',
      visible_public: p.visible_public ?? true,
    });
  };

  const closeModal = () => setSelectedPhoto(null);

  return (
    <AuthorityLayout>
      <div className={styles['photos-moderation']}>
        <div className={styles['photos-moderation__header']}>
          <div className={styles['photos-moderation__header-content']}>
            <h1 className={styles['photos-moderation__title']}>{t('authority.photosModeration.title')}</h1>
            <p className={styles['photos-moderation__subtitle']}>{t('authority.photosModeration.subtitle')}</p>
          </div>

          <div className={styles['photos-moderation__toolbar']}>
            <button className={styles['photos-moderation__toolbar-btn']} onClick={loadPhotos} disabled={isLoading}>
              <RefreshCw size={16} />
              {t('authority.photosModeration.refresh')}
            </button>
          </div>
        </div>

        {error && (
          <div className={styles['photos-moderation__alert']} style={{ background: '#fee2e2', borderColor: '#fecaca' }}>
            <span style={{ color: '#991b1b' }}>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className={styles['photos-moderation__skeletonWrap']}>
            <AdminCardsGridSkeleton cardCount={8} />
          </div>
        ) : photos.length === 0 ? (
          <div className={styles['photos-moderation__empty']}>
            <ImageIcon size={48} />
            <p>{t('authority.photosModeration.empty')}</p>
          </div>
        ) : (
          <div className={styles['photos-moderation__grid']}>
            {photos.map((p) => {
              const who =
                p.personne && (p.personne.nom || p.personne.prenom)
                  ? `${p.personne.prenom || ''} ${p.personne.nom || ''}`.trim()
                  : null;
              return (
                <div key={p.id} className={styles['photos-moderation__card']}>
                  <div className={styles['photos-moderation__image-wrapper']}>
                    <img
                      src={p.url_thumbnail || p.url_cloudinary}
                      alt={t('authority.photosModeration.photoAlt')}
                      className={styles['photos-moderation__image']}
                      onClick={() => openModal(p)}
                    />
                  </div>

                  <div className={styles['photos-moderation__card-content']}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ fontWeight: 600 }}>
                        {who || t('authority.photosModeration.unknownPerson')}
                      </div>
                      <span className={styles['photos-moderation__badge']}>
                        {p.type_photo ? t(`authority.photosModeration.types.${p.type_photo}`) : t('authority.photosModeration.types.autre')}
                      </span>
                    </div>

                    {p.signalement?.lieu_observation && (
                      <div style={{ marginTop: 6, color: '#64748b', fontSize: '0.9rem' }}>
                        {t('authority.photosModeration.observationPlace')}: {p.signalement.lieu_observation}
                      </div>
                    )}

                    {p.description && <p style={{ marginTop: 8 }}>{p.description}</p>}

                    <div style={{ marginTop: 10, color: '#64748b', fontSize: '0.85rem' }}>
                      {t('authority.photosModeration.uploadedAt')}:{' '}
                      {new Date(p.created_at).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US')}
                    </div>

                    <div className={styles['photos-moderation__actions']} style={{ marginTop: 12 }}>
                      <button
                        className={styles['photos-moderation__action-btn']}
                        onClick={() => window.open(p.url_cloudinary, '_blank')}
                        title={t('authority.photosModeration.open')}
                      >
                        <Eye size={16} />
                      </button>

                      <button
                        className={`${styles['photos-moderation__action-btn']} ${styles['photos-moderation__approve-btn']}`}
                        onClick={() => {
                          // Approve sans ouvrir le modal
                          setModerationData({
                            qualite_image: (p.qualite_image as string) || 'moyenne',
                            type_photo: (p.type_photo as string) || 'portrait',
                            visible_public: true,
                          });
                          moderatePhoto(p.id, true);
                        }}
                        disabled={processingId === p.id}
                        title={t('authority.photosModeration.approve')}
                      >
                        <CheckCircle size={16} />
                      </button>

                      <button
                        className={`${styles['photos-moderation__action-btn']} ${styles['photos-moderation__reject-btn']}`}
                        onClick={() => moderatePhoto(p.id, false)}
                        disabled={processingId === p.id}
                        title={t('authority.photosModeration.reject')}
                      >
                        <XCircle size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedPhoto && (
          <div className={styles['photos-moderation__modal']} onClick={closeModal}>
            <div className={styles['photos-moderation__modal-content']} onClick={(e) => e.stopPropagation()}>
              <button
                className={styles['photos-moderation__close-btn']}
                onClick={closeModal}
                aria-label={t('common.close')}
              >
                <X size={18} />
              </button>

              <div className={styles['photos-moderation__modal-grid']}>
                <div className={styles['photos-moderation__modal-image-section']}>
                  <img
                    src={selectedPhoto.url_cloudinary}
                    alt={t('authority.photosModeration.photoAlt')}
                    className={styles['photos-moderation__modal-photo']}
                  />
                </div>

                <div className={styles['photos-moderation__modal-info-section']}>
                  <h3>{t('authority.photosModeration.title')}</h3>

                  <div className={styles['photos-moderation__modal-details']}>
                    <div className={styles['photos-moderation__detail-item']}>
                      <span className={styles['photos-moderation__detail-label']}>
                        {t('authority.photosModeration.uploadedAt')}
                      </span>
                      <span className={styles['photos-moderation__detail-value']}>
                        {new Date(selectedPhoto.created_at).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US')}
                      </span>
                    </div>
                    {selectedPhoto.description && (
                      <div className={styles['photos-moderation__detail-item']}>
                        <span className={styles['photos-moderation__detail-label']}>
                          {t('authority.documents.description')}
                        </span>
                        <span className={styles['photos-moderation__detail-value']}>{selectedPhoto.description}</span>
                      </div>
                    )}
                  </div>

                  <div className={styles['photos-moderation__modal-form']}>
                    <h4>{t('authority.photosModeration.moderationFormTitle')}</h4>

                    <div className={styles['photos-moderation__field']}>
                      <label>{t('authority.documents.type')}</label>
                      <select
                        value={moderationData.type_photo}
                        onChange={(e) => setModerationData((p) => ({ ...p, type_photo: e.target.value }))}
                      >
                        <option value="portrait">{t('authority.photosModeration.types.portrait')}</option>
                        <option value="corps_entier">{t('authority.photosModeration.types.corps_entier')}</option>
                        <option value="signalement">{t('authority.photosModeration.types.signalement')}</option>
                        <option value="lieu_disparition">{t('authority.photosModeration.types.lieu_disparition')}</option>
                        <option value="objet_personnel">{t('authority.photosModeration.types.objet_personnel')}</option>
                        <option value="document">{t('authority.photosModeration.types.document')}</option>
                        <option value="autre">{t('authority.photosModeration.types.autre')}</option>
                      </select>
                    </div>

                    <div className={styles['photos-moderation__field']}>
                      <label>{t('authority.photosModeration.qualityLabel')}</label>
                      <select
                        value={moderationData.qualite_image}
                        onChange={(e) => setModerationData((p) => ({ ...p, qualite_image: e.target.value }))}
                      >
                        <option value="excellente">{t('authority.photosModeration.qualities.excellente')}</option>
                        <option value="bonne">{t('authority.photosModeration.qualities.bonne')}</option>
                        <option value="moyenne">{t('authority.photosModeration.qualities.moyenne')}</option>
                        <option value="faible">{t('authority.photosModeration.qualities.faible')}</option>
                      </select>
                    </div>

                    <div className={styles['photos-moderation__checkbox']}>
                      <label>
                        <input
                          type="checkbox"
                          checked={moderationData.visible_public}
                          onChange={(e) => setModerationData((p) => ({ ...p, visible_public: e.target.checked }))}
                        />
                        {t('authority.documents.badges.public')}
                      </label>
                    </div>
                  </div>

                  <div className={styles['photos-moderation__modal-actions']}>
                    <button
                      className={`${styles['photos-moderation__action-btn']} ${styles['photos-moderation__approve-btn']}`}
                      onClick={() => moderatePhoto(selectedPhoto.id, true)}
                      disabled={processingId === selectedPhoto.id}
                    >
                      <Save size={16} />
                      {t('authority.photosModeration.approve')}
                    </button>
                    <button
                      className={`${styles['photos-moderation__action-btn']} ${styles['photos-moderation__reject-btn']}`}
                      onClick={() => moderatePhoto(selectedPhoto.id, false)}
                      disabled={processingId === selectedPhoto.id}
                    >
                      <XCircle size={16} />
                      {t('authority.photosModeration.reject')}
                    </button>
                    <button className={styles['photos-moderation__action-btn']} onClick={() => window.open(selectedPhoto.url_cloudinary, '_blank')}>
                      <Eye size={16} />
                      {t('authority.photosModeration.open')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthorityLayout>
  );
};

export default PhotosModerationPage;

