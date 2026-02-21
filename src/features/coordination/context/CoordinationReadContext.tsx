/**
 * =====================================================
 * RETROUVONSLES - CoordinationReadContext
 * État partagé des messages de coordination "lus" (commentaire_vue).
 * Un seul état pour le header et la page Coordination.
 * =====================================================
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../../../contexts';
import { supabase } from '../../../config/supabase.config';

interface CoordinationReadContextValue {
  readCommentIds: Set<string>;
  markAsRead: (commentIds: string[]) => Promise<void>;
  refetchReadIds: () => Promise<void>;
}

const CoordinationReadContext = createContext<CoordinationReadContextValue | null>(null);

export const useCoordinationRead = (): CoordinationReadContextValue => {
  const ctx = useContext(CoordinationReadContext);
  if (!ctx) {
    return {
      readCommentIds: new Set(),
      markAsRead: async () => {},
      refetchReadIds: async () => {},
    };
  }
  return ctx;
};

export const CoordinationReadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [readCommentIds, setReadCommentIds] = useState<Set<string>>(new Set());
  const initialFetchDone = useRef(false);

  const fetchReadCommentIds = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data } = await (supabase as any)
        .from('commentaire_vue')
        .select('id_commentaire')
        .eq('id_utilisateur', user.id);
      const ids = new Set<string>(((data || []) as { id_commentaire: string }[]).map((r) => r.id_commentaire));
      setReadCommentIds(ids);
    } catch {
      // Ne jamais écraser l'état en cas d'erreur (table absente, RLS, etc.)
      // pour garder les "lus" en mémoire jusqu'à prochain chargement réussi
    }
    initialFetchDone.current = true;
  }, [user?.id]);

  const markAsRead = useCallback(
    async (commentIds: string[]) => {
      if (!user?.id || commentIds.length === 0) return;
      const uniqueIds = [...new Set(commentIds)];
      try {
        await (supabase as any)
          .from('commentaire_vue')
          .upsert(
            uniqueIds.map((id_commentaire) => ({ id_commentaire, id_utilisateur: user.id })),
            { onConflict: 'id_commentaire,id_utilisateur', ignoreDuplicates: true }
          );
        setReadCommentIds((prev) => {
          const next = new Set(prev);
          uniqueIds.forEach((id) => next.add(id));
          return next;
        });
      } catch {
        // Mise à jour locale même si l'API échoue (table pas encore prête)
        setReadCommentIds((prev) => {
          const next = new Set(prev);
          uniqueIds.forEach((id) => next.add(id));
          return next;
        });
      }
    },
    [user?.id]
  );

  useEffect(() => {
    if (!user?.id) {
      setReadCommentIds(new Set());
      initialFetchDone.current = false;
      return;
    }
    fetchReadCommentIds();
  }, [user?.id, fetchReadCommentIds]);

  const value: CoordinationReadContextValue = {
    readCommentIds,
    markAsRead,
    refetchReadIds: fetchReadCommentIds,
  };

  return (
    <CoordinationReadContext.Provider value={value}>
      {children}
    </CoordinationReadContext.Provider>
  );
};
