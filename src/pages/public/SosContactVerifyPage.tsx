/**
 * Confirmation e-mail contact SOS (lien public, sans session requise).
 */
import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useI18n } from '../../hooks';
import { confirmContactVerificationToken } from '../../features/sos/sosApi';
import { PUBLIC_ROUTES } from '../../routes/routes.config';
import styles from './SosContactVerifyPage.module.css';

type Phase = 'loading' | 'ok' | 'err';

export const SosContactVerifyPage: React.FC = () => {
  const { t } = useI18n();
  const [params] = useSearchParams();
  const token = (params.get('token') || '').trim();
  const [phase, setPhase] = useState<Phase>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setPhase('err');
      setMessage(t('citizen.sos.verifyContactNoToken'));
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        await confirmContactVerificationToken(token);
        if (!cancelled) {
          setPhase('ok');
          setMessage('');
        }
      } catch (e: any) {
        if (!cancelled) {
          setPhase('err');
          setMessage(e?.message || t('errors.generic'));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, t]);

  return (
    <main className={styles.wrap}>
      <h1 className={styles.title}>{t('citizen.sos.verifyContactTitle')}</h1>
      {phase === 'loading' && <p className={styles.body}>{t('common.loading')}</p>}
      {phase === 'ok' && <p className={styles.ok}>{t('citizen.sos.verifyContactOk')}</p>}
      {phase === 'err' && <p className={styles.err}>{message}</p>}
      <p className={styles.footer}>
        <Link to={PUBLIC_ROUTES.HOME}>{t('citizen.sos.verifyContactHome')}</Link>
      </p>
    </main>
  );
};
