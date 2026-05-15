/**
 * Page SOS citoyen : compte à rebours, envoi via Edge Function, historique.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../hooks';
import { useNotification } from '../../contexts';
import { CitizenLayout } from './CitizenLayout';
import {
  invokeSosDispatch,
  listMySosHistory,
  type SosEventRow,
} from '../../features/sos/sosApi';
import { Loader2 } from 'lucide-react';
import styles from './PreDeclarationCommon.module.css';

const COUNTDOWN_SEC = 15;

type Phase = 'idle' | 'countdown' | 'dispatching';

/** Réponse Brevo lisible côté citoyen (compte suspendu, clé invalide, etc.). */
function formatSosEmailFailureMessage(
  raw: string | undefined,
  brevoEnvOk: boolean | undefined,
  t: (key: string) => string,
): string {
  if (brevoEnvOk === false) return t('citizen.sos.emailFixBrevoSecrets');
  const r = (raw ?? '').trim();
  if (!r) return t('citizen.sos.emailCheckBrevoAndSpam');
  const u = r.toLowerCase();
  if (u.includes('not yet activated') || (u.includes('permission_denied') && u.includes('smtp'))) {
    return t('citizen.sos.emailBrevoAccountBlocked');
  }
  if (u.includes('key not found') || u.includes('"code":"unauthorized"')) {
    return t('citizen.sos.emailFixBrevoSecrets');
  }
  return r.slice(0, 450);
}

export const CitizenSosPage: React.FC = () => {
  const { t } = useI18n();
  const { addNotification } = useNotification();
  const [phase, setPhase] = useState<Phase>('idle');
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SEC);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<SosEventRow[]>([]);
  const [geoError, setGeoError] = useState<string | null>(null);
  const posRef = useRef<{ lat: number; lng: number; acc?: number } | null>(null);
  const timerRef = useRef<number | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      const h = await listMySosHistory(30);
      setHistory(h);
    } catch {
      // silencieux
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const clearTimer = () => {
    if (timerRef.current != null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => () => clearTimer(), []);

  const startProcedure = () => {
    setGeoError(null);
    posRef.current = null;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          posRef.current = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            acc: pos.coords.accuracy,
          };
        },
        () => {
          setGeoError(t('citizen.sos.sansPosition'));
          posRef.current = null;
        },
        { enableHighAccuracy: true, timeout: 12_000, maximumAge: 0 },
      );
    } else {
      setGeoError(t('citizen.sos.sansPosition'));
    }

    let remaining = COUNTDOWN_SEC;
    setSecondsLeft(remaining);
    setPhase('countdown');
    clearTimer();
    timerRef.current = window.setInterval(() => {
      remaining -= 1;
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearTimer();
        setPhase('dispatching');
        void (async () => {
          const p = posRef.current;
          const res = await invokeSosDispatch({
            mode: 'dispatch',
            message: message.trim() || t('citizen.sos.messageDefault'),
            latitude: p?.lat ?? null,
            longitude: p?.lng ?? null,
            precisionMeters: p?.acc ?? null,
          });
          setPhase('idle');
          setSecondsLeft(COUNTDOWN_SEC);
          if (res.ok) {
            const attempts = res.emails_attempted ?? [];
            const nContacts = res.contacts_for_email ?? attempts.length;
            if (nContacts === 0) {
              addNotification({
                title: t('citizen.sos.sentOk'),
                message: t('citizen.sos.emailNoContactsInDb'),
                type: 'warning',
              });
            } else {
              const failed = attempts.filter((a) => !a.ok);
              if (failed.length === attempts.length && attempts.length > 0) {
                addNotification({
                  title: t('citizen.sos.emailNoneDelivered'),
                  message: formatSosEmailFailureMessage(failed[0]?.error, res.brevo_env_ok, t),
                  type: 'warning',
                });
              } else if (failed.length > 0) {
                addNotification({
                  title: t('citizen.sos.sentOk'),
                  message: t('citizen.sos.emailSomeFailed', {
                    detail: formatSosEmailFailureMessage(failed[0]?.error, res.brevo_env_ok, t).slice(0, 320),
                  }),
                  type: 'warning',
                });
              } else {
                addNotification({
                  title: t('citizen.sos.sentOk'),
                  message: t('citizen.sos.sentDetailEmailsOk', { count: attempts.length }),
                  type: 'success',
                });
              }
            }
          } else if (res.error === 'RATE_LIMIT') {
            addNotification({ title: t('citizen.sos.rateLimited'), message: '', type: 'warning' });
          } else {
            addNotification({ title: t('citizen.sos.errorGeneric'), message: res.error || '', type: 'error' });
          }
          await loadHistory();
        })();
      }
    }, 1000);
  };

  const cancelDuringCountdown = () => {
    clearTimer();
    setPhase('idle');
    setSecondsLeft(COUNTDOWN_SEC);
    void (async () => {
      const res = await invokeSosDispatch({ mode: 'abort_trace' });
      if (res.ok) {
        addNotification({ title: t('citizen.sos.abortOk'), message: '', type: 'info' });
      } else {
        addNotification({ title: t('errors.generic'), message: res.error || '', type: 'error' });
      }
      await loadHistory();
    })();
  };

  return (
    <CitizenLayout activeNav="sos" contentVariant="flush">
      <div className={styles.pageBleed}>
        <header className={styles.pageHeaderCard}>
          <div className={styles.headerRow}>
            <div>
              <h1 className={styles.title}>{t('citizen.sos.title')}</h1>
              <p className={styles.subtitle}>{t('citizen.sos.subtitle')}</p>
            </div>
            <Link to="/citizen/sos/contacts" className={styles.secondaryBtn}>
              {t('citizen.sos.contactsLink')}
            </Link>
          </div>
        </header>

        <section className={styles.sectionCard} style={{ borderLeft: '4px solid #f59e0b', marginBottom: '0.75rem' }}>
          <h2 className={styles.sectionTitle} style={{ fontSize: '1.05rem' }}>
            {t('citizen.sos.emergencyTitle')}
          </h2>
          <p className={styles.subtitle} style={{ marginTop: '0.35rem', marginBottom: 0 }}>
            {t('citizen.sos.emergencyBody')}
          </p>
        </section>

        <div className={styles.sosHero}>
          <div className={styles.sosHeroInner}>
            {geoError ? (
              <div className={styles.sosGeoHint}>{geoError}</div>
            ) : (
              <p className={styles.infoHintBlue}>{t('citizen.sos.geoHint')}</p>
            )}

            <div className={styles.field}>
              <label>{t('citizen.sos.messageLabel')}</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={phase === 'countdown' || phase === 'dispatching'}
                placeholder={t('citizen.sos.messageDefault')}
                rows={4}
              />
            </div>

            {phase === 'idle' && (
              <button type="button" className={styles.primaryBtn} onClick={startProcedure}>
                {t('citizen.sos.startProcedure')}
              </button>
            )}

            {phase === 'countdown' && (
              <div className={styles.countdownPanel}>
                <h2 className={styles.sectionTitle}>{t('citizen.sos.countdownTitle')}</h2>
                <p className={styles.subtitle} style={{ marginTop: '0.35rem' }}>
                  {t('citizen.sos.countdownBody')}
                </p>
                <p className={styles.countdownNumber}>{secondsLeft}s</p>
                <button type="button" className={`${styles.secondaryBtn} ${styles.dangerBtn}`} onClick={cancelDuringCountdown}>
                  {t('citizen.sos.cancelSos')}
                </button>
              </div>
            )}

            {phase === 'dispatching' && (
              <div className={styles.dispatchingRow}>
                <Loader2 className={styles.loadingSpinner} size={22} aria-hidden />
                <span>{t('citizen.sos.sending')}</span>
              </div>
            )}
          </div>
        </div>

        <section className={styles.sectionCard}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>{t('citizen.sos.historyTitle')}</h2>
          </div>
          {history.length === 0 ? (
            <p className={styles.emptyState}>{t('citizen.sos.emptyHistory')}</p>
          ) : (
            <div className={styles.cardList}>
              {history.map((ev) => {
                const statutKey = ev.statut as string;
                const badgeClass =
                  statutKey === 'envoye'
                    ? styles.statBadgeActive
                    : statutKey === 'traite'
                      ? styles.statBadgeDone
                      : styles.statBadge;
                return (
                  <div key={ev.id} className={styles.card} style={{ cursor: 'default' }}>
                    <div className={styles.cardRow}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className={styles.cardTitle}>{new Date(ev.created_at).toLocaleString()}</p>
                        <p className={styles.cardMeta}>
                          <span className={badgeClass}>{t(`citizen.sos.statut.${ev.statut}`)}</span>
                          {' · '}
                          {ev.sans_position ? t('citizen.sos.sansPosition') : t('citizen.sos.withPosition')}
                          {!ev.sans_position && ev.latitude != null && ev.longitude != null && (
                            <>
                              {' · '}
                              <a
                                href={`https://maps.google.com/?q=${encodeURIComponent(`${ev.latitude},${ev.longitude}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.linkBtn}
                              >
                                {t('citizen.sos.historyOpenMap')}
                              </a>
                            </>
                          )}
                        </p>
                        {ev.message && <p className={styles.cardMeta}>{ev.message}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </CitizenLayout>
  );
};
