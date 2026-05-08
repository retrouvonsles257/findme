import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, UserSearch, ArrowRight } from 'lucide-react';
import { useI18n } from '../../hooks';
import { supabase } from '../../config';
import { PUBLIC_ROUTES } from '../../routes/routes.config';
import styles from './MissingPersonsCarousel.module.css';

/**
 * Carrousel « disparus en cours » — scène principale + bande de miniatures rondes.
 * - La scène haute montre UNE personne à la fois (photo + nom + âge + localisation + CTA dossier).
 * - Survol (ou focus / clic tactile) d’une miniature = la scène change instantanément.
 * - Rotation auto toutes les ~4,5 s (pause au survol / focus / `prefers-reduced-motion`).
 * - Données strictement publiques (visible_public = true, statut_dossier = en_cours).
 */

interface MissingItem {
  id: string;
  nom_complet: string;
  photo_principale?: string | null;
  age_display?: string;
  localisation?: string;
}

const SKELETON_THUMBS = 10;
const AUTO_INTERVAL_MS = 4500;

const useReducedMotion = (): boolean => {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    if (mq.addEventListener) mq.addEventListener('change', handler);
    else mq.addListener(handler);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', handler);
      else mq.removeListener(handler);
    };
  }, []);
  return reduced;
};

export const MissingPersonsCarousel: React.FC = () => {
  const { t, language } = useI18n();
  const reducedMotion = useReducedMotion();

  const [items, setItems] = useState<MissingItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const stripRef = useRef<HTMLDivElement | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const { data, error } = await (supabase as any)
          .from('dossier_disparition')
          .select(
            `
              id,
              ville_disparition,
              region_disparition,
              statut_dossier,
              visible_public,
              personne:id_personne (
                nom_complet,
                photo_principale,
                age_estime_min,
                age_estime_max
              )
            `
          )
          .eq('visible_public', true)
          .eq('statut_dossier', 'en_cours')
          .order('date_disparition', { ascending: false })
          .limit(18);

        if (error) throw error;
        if (cancelled || !mountedRef.current) return;

        const mapped: MissingItem[] = (data || [])
          .map((d: any): MissingItem | null => {
            const personne = d.personne || {};
            const nom = (personne.nom_complet || '').trim();
            if (!nom) return null;
            const min = personne.age_estime_min;
            const max = personne.age_estime_max;
            let age_display: string | undefined;
            if (min && max && min !== max) age_display = `${min}–${max} ${language === 'fr' ? 'ans' : 'yrs'}`;
            else if (min) age_display = `${min} ${language === 'fr' ? 'ans' : 'yrs'}`;
            const loc = [d.ville_disparition, d.region_disparition].filter(Boolean).join(', ');
            return {
              id: d.id,
              nom_complet: nom,
              photo_principale: personne.photo_principale || null,
              age_display,
              localisation: loc || undefined,
            };
          })
          .filter((x: MissingItem | null): x is MissingItem => Boolean(x));

        if (!cancelled && mountedRef.current) setItems(mapped);
      } catch (err) {

        if (!cancelled && mountedRef.current) setItems([]);
      } finally {
        if (!cancelled && mountedRef.current) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [language]);

  // Reset index si la liste change
  useEffect(() => {
    setActiveIndex(0);
  }, [items?.length]);

  // Rotation automatique
  useEffect(() => {
    if (reducedMotion || paused) return;
    if (!items || items.length <= 1) return;
    const id = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % items.length);
    }, AUTO_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [reducedMotion, paused, items]);

  // Centre la miniature active dans la bande — on ne touche QUE le scrollLeft
  // du rail (jamais `scrollIntoView`, qui remonterait aussi la page).
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const el = strip.querySelector<HTMLElement>(`[data-idx="${activeIndex}"]`);
    if (!el) return;
    const target = el.offsetLeft - (strip.clientWidth - el.clientWidth) / 2;
    strip.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
  }, [activeIndex]);

  const handleStripKey = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!items || items.length === 0) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % items.length);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + items.length) % items.length);
      }
    },
    [items]
  );

  if (!loading && (!items || items.length === 0)) return null;

  const active = items && items.length > 0 ? items[activeIndex] : null;

  return (
    <div
      className={styles.carousel}
      role="region"
      aria-label={t('public.home.carousel.aria_label', 'Personnes actuellement recherchées')}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className={styles.stage} aria-live="polite">
        {loading || !active ? (
          <>
            <span className={styles.stageSkeleton} aria-hidden />
            <div className={styles.stageLinesSkel} aria-hidden>
              <span className={styles.skelLine} />
              <span className={`${styles.skelLine} ${styles.skelLineShort}`} />
            </div>
          </>
        ) : (
          <>
            <div className={styles.stagePhoto}>
              {active.photo_principale ? (
                <img
                  key={active.id}
                  src={active.photo_principale}
                  alt={active.nom_complet}
                  className={styles.stageImg}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className={styles.stageImgFallback} aria-hidden>
                  <UserSearch size={40} strokeWidth={1.5} />
                </div>
              )}
            </div>
            <span className={styles.statusTag}>
              {t('public.status.active', 'Recherchée')}
            </span>
            <div className={styles.stageInfo} key={active.id}>
              <h4 className={styles.stageName}>{active.nom_complet}</h4>
              <div className={styles.stageMetaList}>
                {active.age_display && (
                  <span className={styles.stageMeta}>
                    <span className={styles.metaText}>{active.age_display}</span>
                  </span>
                )}
                {active.localisation && (
                  <span className={styles.stageMeta}>
                    <MapPin size={12} strokeWidth={2.25} aria-hidden className={styles.metaIcon} />
                    <span className={styles.metaText}>{active.localisation}</span>
                  </span>
                )}
              </div>
              <Link to={`${PUBLIC_ROUTES.DISPARITIONS}/${active.id}`} className={styles.stageCta}>
                {t('public.home.carousel.view_dossier', 'Voir le dossier')}
                <ArrowRight size={14} strokeWidth={2.5} aria-hidden />
              </Link>
            </div>
          </>
        )}
      </div>

      <div
        className={styles.strip}
        ref={stripRef}
        role="listbox"
        aria-label={t('public.home.carousel.strip_aria', 'Sélection des disparitions')}
        tabIndex={items && items.length > 0 ? 0 : -1}
        onKeyDown={handleStripKey}
      >
        {loading
          ? Array.from({ length: SKELETON_THUMBS }).map((_, i) => (
              <span key={`skel-${i}`} className={styles.thumbSkel} aria-hidden />
            ))
          : (items || []).map((item, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  data-idx={idx}
                  role="option"
                  aria-selected={isActive}
                  aria-label={item.nom_complet}
                  className={`${styles.thumb} ${isActive ? styles.thumbActive : ''}`}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onFocus={() => setActiveIndex(idx)}
                  onClick={() => setActiveIndex(idx)}
                >
                  {item.photo_principale ? (
                    <img
                      src={item.photo_principale}
                      alt=""
                      className={styles.thumbImg}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <span className={styles.thumbFallback} aria-hidden>
                      <UserSearch size={14} strokeWidth={2} />
                    </span>
                  )}
                </button>
              );
            })}
      </div>
    </div>
  );
};

export default MissingPersonsCarousel;
