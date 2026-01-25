/**
 * =====================================================
 * RETROUVONSLES - Hook useCoordinationMessages
 * Gestion des messages de coordination avec Supabase Realtime
 * =====================================================
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../../../contexts';
import { supabase } from '../../../config/supabase.config';

// ============================================
// TYPES
// ============================================

export interface CoordinationMessage {
  id: string;
  author: string;
  author_id: string;
  organisation: string;
  text: string;
  timestamp: string;
  dossier_id?: string;
}

export interface UseCoordinationMessagesState {
  messages: CoordinationMessage[];
  loading: boolean;
  error: string | null;
}

export interface UseCoordinationMessagesActions {
  sendMessage: (text: string, dossierId?: string) => Promise<void>;
  fetchMessages: (dossierId?: string) => Promise<void>;
  clearError: () => void;
}

export type UseCoordinationMessagesReturn = UseCoordinationMessagesState & UseCoordinationMessagesActions;

// ============================================
// HOOK IMPLEMENTATION
// ============================================

/**
 * Hook personnalisé pour la gestion des messages de coordination
 */
export const useCoordinationMessages = (dossierId?: string): UseCoordinationMessagesReturn => {
  const { user } = useAuth();
  const [state, setState] = useState<UseCoordinationMessagesState>({
    messages: [],
    loading: false,
    error: null,
  });

  const unsubscribeRef = useRef<(() => void) | null>(null);

  // ========== FETCH MESSAGES ==========

  const fetchMessages = useCallback(async (dossierFilter?: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      let query = (supabase.from('coordination_messages') as any)
        .select('*')
        .order('timestamp', { ascending: false });

      if (dossierFilter) {
        query = query.eq('dossier_id', dossierFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      const messages: CoordinationMessage[] = (data || []).map((msg: any) => ({
        id: msg.id,
        author: msg.author,
        author_id: msg.author_id,
        organisation: msg.organisation,
        text: msg.text,
        timestamp: msg.timestamp,
        dossier_id: msg.dossier_id,
      }));

      setState((prev) => ({
        ...prev,
        messages,
        loading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement';
      setState((prev) => ({ ...prev, error: message, loading: false }));
    }
  }, []);

  // ========== SEND MESSAGE ==========

  const sendMessage = useCallback(
    async (text: string, dossierFilter?: string) => {
      if (!user) {
        setState((prev) => ({ ...prev, error: 'Non authentifié' }));
        return;
      }

      try {
        const { error } = await (supabase.from('coordination_messages') as any).insert([
          {
            author: user.email || 'Utilisateur',
            author_id: user.id,
            organisation: user.user_metadata?.organisation || 'Non spécifiée',
            text,
            timestamp: new Date().toISOString(),
            dossier_id: dossierFilter,
          },
        ]);

        if (error) throw error;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur lors de l\'envoi';
        setState((prev) => ({ ...prev, error: message }));
        throw err;
      }
    },
    [user]
  );

  // ========== REALTIME SUBSCRIPTION ==========

  useEffect(() => {
    // Charger les messages initialement
    fetchMessages(dossierId);

    // S'abonner aux changements en temps réel
    const channel = supabase
      .channel(`coordination:${dossierId || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'coordination_messages',
          ...(dossierId && { filter: `dossier_id=eq.${dossierId}` }),
        },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            setState((prev) => ({
              ...prev,
              messages: [payload.new, ...prev.messages],
            }));
          } else if (payload.eventType === 'DELETE') {
            setState((prev) => ({
              ...prev,
              messages: prev.messages.filter((m) => m.id !== payload.old.id),
            }));
          } else if (payload.eventType === 'UPDATE') {
            setState((prev) => ({
              ...prev,
              messages: prev.messages.map((m) =>
                m.id === payload.new.id ? { ...m, ...payload.new } : m
              ),
            }));
          }
        }
      )
      .subscribe();

    unsubscribeRef.current = () => {
      supabase.removeChannel(channel);
    };

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [dossierId, fetchMessages]);

  // ========== CLEAR ERROR ==========

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    sendMessage,
    fetchMessages,
    clearError,
  };
};
