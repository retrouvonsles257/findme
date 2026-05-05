/**
 * Page publique : agir (ex. signalement) sans compte email immédiat — connexion anonyme Supabase.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { UserPlus, LogIn } from 'lucide-react';
import { useAppDispatch } from '../../store/types';
import { signInAnonymousThunk } from '../../features/auth/store/authThunks';
import { getDashboardPathAfterLogin } from '../../services/supabase/auth';
import { AUTH_ROUTES, CITIZEN_ROUTES } from '../../routes/routes.config';
import { safeCitizenNextPath } from '../../utils/safeCitizenNext';
import {
  canAttemptAnonymousSignIn,
  markAnonymousSignInSuccess,
} from '../../utils/anonymousSignInRateLimit';
import { useI18n } from '../../hooks';
import styles from './ContributePage.module.css';

export const ContributePage: React.FC = () => {
  const { t } = useI18n();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [honeypot, setHoneypot] = useState('');

  const nextPath = useMemo(() => {
    const raw = searchParams.get('next');
    return safeCitizenNextPath(raw, CITIZEN_ROUTES.NEW_SIGNALEMENT);
  }, [searchParams]);

  const loginHref = `${AUTH_ROUTES.LOGIN}?next=${encodeURIComponent(nextPath)}&anon=1`;

  const handleAnonymous = useCallback(async () => {
    if (honeypot.trim() !== '') {
      return;
    }
    const gate = canAttemptAnonymousSignIn();
    if (!gate.ok) {
      const sec = Math.ceil(gate.retryAfterMs / 1000);
      setError(t('public.contribute.rate_limited', { count: sec }));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = (await dispatch(signInAnonymousThunk())) as any;
      if (!result?.type?.endsWith('/fulfilled')) {
        throw result?.payload || new Error('Connexion impossible');
      }
      markAnonymousSignInSuccess();
      const userRole = result.payload?.user?.role as string | undefined;
      const orgId = result.payload?.user?.organisation_id ?? null;
      const fallbackDash = getDashboardPathAfterLogin(userRole || 'citoyen', orgId);
      const target = nextPath || fallbackDash;
      navigate(target, { replace: true });
    } catch (e: any) {
      setError(e?.message || 'Connexion sans compte impossible.');
      setLoading(false);
    }
  }, [dispatch, honeypot, navigate, nextPath, t]);

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>{t('public.contribute.title')}</h1>
        <p className={styles.lead}>{t('public.contribute.lead')}</p>

        <div className={styles.honeypot} aria-hidden>
          <label htmlFor="contrib-website">Website</label>
          <input
            id="contrib-website"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={handleAnonymous}
            disabled={loading || honeypot.trim() !== ''}
          >
            <UserPlus size={20} aria-hidden />
            {loading ? '…' : t('public.contribute.anonymous_cta')}
          </button>
          <Link to={loginHref} className={styles.secondaryBtn}>
            <LogIn size={18} style={{ marginRight: 6 }} aria-hidden />
            {t('public.contribute.login_cta')}
          </Link>
        </div>

        <p className={styles.note}>{t('public.contribute.note')}</p>
      </div>
    </div>
  );
};
