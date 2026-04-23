import { useEffect, useRef, useState } from 'react';

export interface UseInViewOptions {
  rootMargin?: string;
  threshold?: number;
  /**
   * Si true : première intersection puis déconnexion (animation une seule fois).
   * Si false : suit le scroll — rejoue l’animation à chaque entrée/sortie du viewport.
   */
  once?: boolean;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Suit la visibilité d’un élément dans le viewport (IntersectionObserver).
 * Par défaut `once: false` : l’animation peut se rejouer en scrollant vers le haut puis le bas.
 */
export function useInView(options: UseInViewOptions = {}) {
  const { rootMargin = '0px 0px -6% 0px', threshold = 0.08, once = false } = options;
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(() => prefersReducedMotion());

  useEffect(() => {
    if (prefersReducedMotion()) {
      setIsVisible(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const intersecting = !!entry?.isIntersecting;
        setIsVisible(intersecting);
        if (once && intersecting) {
          observer.disconnect();
        }
      },
      { root: null, rootMargin, threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, threshold, once]);

  return { ref, isVisible };
}

/** Comportement historique : une seule détection puis arrêt. */
export function useInViewOnce(options: Omit<UseInViewOptions, 'once'> = {}) {
  return useInView({ ...options, once: true });
}
