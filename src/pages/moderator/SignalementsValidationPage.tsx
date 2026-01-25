/**
 * =====================================================
 * RETROUVONSLES - Signalements Validation Page
 * Validation et modération des signalements
 * =====================================================
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../hooks';
import { useAppSelector } from '../../store/types';
import { selectUser } from '../../features/auth/store/authSelectors';
import { useSignalements } from '../../features/signalements/hooks/useSignalements';
import { useSignalementValidation } from '../../features/signalements/hooks/useSignalementValidation';
import { ModerationLayout } from './ModerationLayout';
import { MapPin, Calendar, CheckCircle, XCircle } from 'lucide-react';
import styles from './SignalementValidationPage.module.css';

export const SignalementsValidationPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const currentUser = useAppSelector(selectUser);
  const { signalements, isLoading } = useSignalements();
  const { validateSignalement, isLoading: isValidating } = useSignalementValidation();
  const [statusFilter, setStatusFilter] = useState<'all' | 'nouveau' | 'en_cours' | 'valide' | 'rejete'>('all');
  const [selectedSignalement, setSelectedSignalement] = useState<any>(null);
  const [validationData, setValidationData] = useState({
    decision: 'approuve' as 'approuve' | 'rejete' | 'besoin_clarification',
    raison: '',
    score_confiance: 0.8,
    avis: '',
  });
  const [successMessage, setSuccessMessage] = useState('');

  // Filtrer les signalements
  const filteredSignalements = signalements.filter((sig) => {
    if (statusFilter === 'all') return true;
    return sig.etat === statusFilter;
  });

  // Gérer la validation
  const handleValidate = async () => {
    if (!selectedSignalement) return;

    try {
      await validateSignalement(selectedSignalement.id, currentUser?.id || '', validationData);
      setSuccessMessage(t('moderator.approvedSuccess'));
      setSelectedSignalement(null);
      setValidationData({
        decision: 'approuve',
        raison: '',
        score_confiance: 0.8,
        avis: '',
      });
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Validation error:', err);
    }
  };

  return (
    <ModerationLayout title={t('moderator.validationTitle')} activeNav="validation">
      <div className={styles.validation}>
        {/* Header */}
        <section className={styles['validation__welcome']}>
          <div className={styles['validation__welcome-content']}>
            <h1 className={styles['validation__welcome-title']}>
              {t('moderator.validationTitle')}
            </h1>
            <p className={styles['validation__welcome-subtitle']}>
              {t('moderator.validationSubtitle')}
            </p>
          </div>
        </section>

        {successMessage && (
          <div className={styles['validation__success']}>✓ {successMessage}</div>
        )}

        {isLoading ? (
          <div className={styles['validation__loading']}>{t('common.loading')}...</div>
        ) : (
          <div className={styles['validation__content']}>
            {/* Left Panel - List */}
            <div className={styles['validation__list-panel']}>
              {/* Filters */}
              <div className={styles['validation__filters']}>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className={styles['validation__filter-select']}
                >
                  <option value="all">{t('moderator.allStatuses')}</option>
                  <option value="nouveau">{t('moderator.nouveau')}</option>
                  <option value="en_cours">{t('moderator.enCours')}</option>
                  <option value="valide">{t('moderator.valides')}</option>
                  <option value="rejete">{t('moderator.rejetes')}</option>
                </select>
              </div>

              {/* List */}
              <div className={styles['validation__list']}>
                {filteredSignalements.length > 0 ? (
                  filteredSignalements.map((sig) => (
                    <div
                      key={sig.id}
                      className={`${styles['validation__item']} ${
                        selectedSignalement?.id === sig.id
                          ? styles['validation__item--selected']
                          : ''
                      }`}
                      onClick={() => setSelectedSignalement(sig)}
                    >
                      <div className={styles['validation__item-header']}>
                        <h4 className={styles['validation__item-title']}>
                          <MapPin size={16} style={{ color: 'rgba(30, 144, 255, 0.92)', flexShrink: 0 }} />
                          {sig.lieu_observation}
                        </h4>
                        <span className={styles['validation__badge']}>{sig.etat}</span>
                      </div>
                      <p className={styles['validation__item-description']}>
                        {sig.description?.substring(0, 80)}...
                      </p>
                      <div className={styles['validation__item-footer']}>
                        <span>
                          {new Date(sig.date_observation).toLocaleDateString('fr-FR')}
                        </span>
                        <span>{t('moderator.score')}: {sig.score_correspondance || 0}%</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles['validation__empty']}>
                    {t('moderator.noReports')}
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Detail & Validation */}
            <div className={styles['validation__detail-panel']}>
              {selectedSignalement ? (
                <>
                  {/* Detail */}
                  <div>
                    <h2 className={styles['validation__detail-title']}>
                      {t('moderator.reportDetails')}
                    </h2>

                    <div className={styles['validation__detail-grid']}>
                      <div className={styles['validation__detail-row']}>
                        <label className={styles['validation__detail-label']}>
                          {t('moderator.location')}
                        </label>
                        <span className={styles['validation__detail-value']}>
                          {selectedSignalement.lieu_observation}
                        </span>
                      </div>
                      <div className={styles['validation__detail-row']}>
                        <label className={styles['validation__detail-label']}>
                          {t('common.date')}
                        </label>
                        <span className={styles['validation__detail-value']}>
                          {new Date(selectedSignalement.date_observation).toLocaleDateString(
                            'fr-FR'
                          )}
                        </span>
                      </div>
                      <div className={styles['validation__detail-row']}>
                        <label className={styles['validation__detail-label']}>
                          {t('common.time')}
                        </label>
                        <span className={styles['validation__detail-value']}>
                          {selectedSignalement.heure_signalement || t('common.notSpecified')}
                        </span>
                      </div>
                      <div className={styles['validation__detail-row']}>
                        <label className={styles['validation__detail-label']}>
                          {t('moderator.confidence')}
                        </label>
                        <span className={styles['validation__detail-value']}>
                          {selectedSignalement.score_correspondance || 0}%
                        </span>
                      </div>
                    </div>

                    <div className={styles['validation__description-section']}>
                      <label className={styles['validation__detail-label']}>
                        {t('common.description')}
                      </label>
                      <p className={styles['validation__description-text']}>
                        {selectedSignalement.description}
                      </p>
                    </div>

                    {selectedSignalement.photo_url && (
                      <div className={styles['validation__photo-section']}>
                        <label className={styles['validation__detail-label']}>
                          {t('common.photo')}
                        </label>
                        <img
                          src={selectedSignalement.photo_url}
                          alt="Signalement"
                          className={styles['validation__photo']}
                        />
                      </div>
                    )}
                  </div>

                  {/* Validation Form */}
                  <div>
                    <h3 className={styles['validation__form-title']}>
                      {t('moderator.decision')}
                    </h3>

                    <div className={styles['validation__form-group']}>
                      <label className={styles['validation__form-label']}>
                        {t('moderator.decision')}
                      </label>
                      <select
                        value={validationData.decision}
                        onChange={(e) =>
                          setValidationData({
                            ...validationData,
                            decision: e.target.value as any,
                          })
                        }
                        className={styles['validation__select']}
                      >
                        <option value="approuve">✓ {t('moderator.approve')}</option>
                        <option value="rejete">✗ {t('moderator.reject')}</option>
                        <option value="besoin_clarification">? {t('moderator.needsClarification')}</option>
                      </select>
                    </div>

                    <div className={styles['validation__form-group']}>
                      <label className={styles['validation__form-label']}>
                        {t('moderator.confidence')}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={validationData.score_confiance}
                        onChange={(e) =>
                          setValidationData({
                            ...validationData,
                            score_confiance: parseFloat(e.target.value),
                          })
                        }
                        className={styles['validation__slider']}
                      />
                      <div className={styles['validation__score-display']}>
                        {Math.round(validationData.score_confiance * 100)}%
                      </div>
                    </div>

                    <div className={styles['validation__form-group']}>
                      <label className={styles['validation__form-label']}>
                        {t('moderator.reason')}
                      </label>
                      <input
                        type="text"
                        value={validationData.raison}
                        onChange={(e) =>
                          setValidationData({
                            ...validationData,
                            raison: e.target.value,
                          })
                        }
                        placeholder={t('moderator.reason')}
                        className={styles['validation__input']}
                      />
                    </div>

                    <div className={styles['validation__form-group']}>
                      <label className={styles['validation__form-label']}>
                        {t('moderator.notes')}
                      </label>
                      <textarea
                        value={validationData.avis}
                        onChange={(e) =>
                          setValidationData({
                            ...validationData,
                            avis: e.target.value,
                          })
                        }
                        placeholder={t('moderator.notes')}
                        className={styles['validation__textarea']}
                        rows={4}
                      />
                    </div>

                    <button
                      className={styles['validation__submit-button']}
                      onClick={handleValidate}
                      disabled={isValidating}
                    >
                      {isValidating ? t('common.loading') : t('moderator.submit')}
                    </button>
                  </div>
                </>
              ) : (
                <div className={styles['validation__no-selection']}>
                  Sélectionnez un signalement pour le valider
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ModerationLayout>
  );
};

export default SignalementsValidationPage;