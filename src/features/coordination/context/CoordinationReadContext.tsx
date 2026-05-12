/**
 * =====================================================
 * RETROUVONSLES - CoordinationReadContext
 * État partagé des messages de coordination "lus" (commentaire_vue).
 * Un seul état pour le header et la page Coordination.
 * =====================================================
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../../contexts';
import { supabase } from '../../../config/supabase.config';

interface CoordinationReadContextValue {
  readCommentIds: Set<string>;
  isReadStateLoaded: boolean;
  markAsRead: (commentIds: string[]) => Promise<void>;
  refetchReadIds: () => Promise<void>;
}

const CoordinationReadContext = createContext<CoordinationReadContextValue | null>(null);
const COORDINATION_READ_CACHE_PREFIX = 'retrouvonsles_coordination_read_v1';

function getReadCacheKey(userId: string): string {
  return `${COORDINATION_READ_CACHE_PREFIX}:${userId}`;
}

function loadReadIdsFromCache(userId: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(getReadCacheKey(userId));
    const ids = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : []);
  } catch {
    return new Set();
  }
}

function saveReadIdsToCache(userId: string, ids: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(getReadCacheKey(userId), JSON.stringify([...ids]));
  } catch {
    // Cache local non critique : Supabase reste la source durable.
  }
}

export const useCoordinationRead = (): CoordinationReadContextValue => {
  const ctx = useContext(CoordinationReadContext);
  if (!ctx) {
    return {
      readCommentIds: new Set(),
      isReadStateLoaded: true,
      markAsRead: async () => {},
      refetchReadIds: async () => {},
    };
  }
  return ctx;
};

export const CoordinationReadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [readCommentIds, setReadCommentIds] = useState<Set<string>>(new Set());
  const [isReadStateLoaded, setIsReadStateLoaded] = useState(false);

  const fetchReadCommentIds = useCallback(async () => {
    if (!user?.id) return;
    setIsReadStateLoaded(false);
    try {
      const { data, error } = await (supabase as any)
        .from('commentaire_vue')
        .select('id_commentaire')
        .eq('id_utilisateur', user.id);
      if (error) {
        setIsReadStateLoaded(true);
        return;
      }

      const remoteIds = new Set<string>(
        ((data || []) as { id_commentaire: string }[]).map((r) => r.id_commentaire)
      );
      setReadCommentIds((prev) => {
        const next = new Set(prev);
        remoteIds.forEach((id) => next.add(id));
        saveReadIdsToCache(user.id, next);
        return next;
      });
    } catch {
      // Ne jamais écraser l'état en cas d'erreur (table absente, RLS, etc.)
      // pour garder les "lus" en mémoire jusqu'à prochain chargement réussi
    } finally {
      setIsReadStateLoaded(true);
    }
  }, [user?.id]);

  const markAsRead = useCallback(
    async (commentIds: string[]) => {
      if (!user?.id || commentIds.length === 0) return;
      const uniqueIds = [...new Set(commentIds)];
      setReadCommentIds((prev) => {
        const next = new Set(prev);
        uniqueIds.forEach((id) => next.add(id));
        saveReadIdsToCache(user.id, next);
        return next;
      });
      try {
        const { error } = await (supabase as any)
          .from('commentaire_vue')
          .upsert(
            uniqueIds.map((id_commentaire) => ({ id_commentaire, id_utilisateur: user.id })),
            { onConflict: 'id_commentaire,id_utilisateur', ignoreDuplicates: true }
          );
        if (error) return;
      } catch {
        // Mise à jour locale déjà faite : le badge ne doit pas revenir dans la session courante.
      }
    },
    [user?.id]
  );

  useEffect(() => {
    if (!user?.id) {
      setReadCommentIds(new Set());
      setIsReadStateLoaded(true);
      return;
    }
    setReadCommentIds(loadReadIdsFromCache(user.id));
    fetchReadCommentIds();
  }, [user?.id, fetchReadCommentIds]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`coordination-read:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'commentaire_vue',
          filter: `id_utilisateur=eq.${user.id}`,
        },
        (payload) => {
          const id = (payload.new as { id_commentaire?: string }).id_commentaire;
          if (!id) return;
          setReadCommentIds((prev) => {
            const next = new Set(prev);
            next.add(id);
            saveReadIdsToCache(user.id, next);
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const value: CoordinationReadContextValue = {
    readCommentIds,
    isReadStateLoaded,
    markAsRead,
    refetchReadIds: fetchReadCommentIds,
  };

  return (
    <CoordinationReadContext.Provider value={value}>
      {children}
    </CoordinationReadContext.Provider>
  );
};
