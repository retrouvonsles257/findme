/**
 * =====================================================
 * RETROUVONSLES - Hook useCoordinationMessages
 * Utilise la table 'commentaire' avec type_commentaire = 'coordination'
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
 * Utilise la table 'commentaire' avec type_commentaire = 'coordination'
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

      let query = (supabase as any)
        .from('commentaire')
        .select(`
          id,
          contenu,
          type_commentaire,
          created_at,
          id_dossier,
          id_utilisateur,
          utilisateur:id_utilisateur (
            id,
            nom,
            prenom,
            email,
            id_organisation,
            organisation:id_organisation (
              nom
            )
          )
        `)
        .eq('type_commentaire', 'coordination')
        .order('created_at', { ascending: true })
        .limit(50);

      if (dossierFilter) {
        query = query.eq('id_dossier', dossierFilter);
      }

      const { data, error } = await query;

      if (error) {
        // Erreur silencieuse
        // Utiliser des données simulées en cas d'erreur
        setState((prev) => ({
          ...prev,
          messages: [],
          loading: false,
        }));
        return;
      }

      const messages: CoordinationMessage[] = (data || []).map((msg: any) => ({
        id: msg.id,
        author: msg.utilisateur 
          ? `${msg.utilisateur.prenom || ''} ${msg.utilisateur.nom || ''}`.trim() || msg.utilisateur.email
          : 'Utilisateur inconnu',
        author_id: msg.id_utilisateur,
        organisation: msg.utilisateur?.organisation?.nom || 'Organisation non spécifiée',
        text: msg.contenu,
        timestamp: msg.created_at,
        dossier_id: msg.id_dossier,
      }));

      setState((prev) => ({
        ...prev,
        messages,
        loading: false,
      }));
    } catch (err) {
      // Erreur silencieuse
      setState((prev) => ({ ...prev, messages: [], loading: false }));
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
        const { error } = await (supabase as any).from('commentaire').insert([
          {
            contenu: text,
            type_commentaire: 'coordination',
            confidentiel: false,
            id_dossier: dossierFilter || null,
            id_utilisateur: user.id,
          },
        ]);

        if (error) throw error;
        
        // Recharger les messages après envoi
        await fetchMessages(dossierFilter);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur lors de l\'envoi';
        setState((prev) => ({ ...prev, error: message }));
        throw err;
      }
    },
    [user, fetchMessages]
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
          table: 'commentaire',
          filter: 'type_commentaire=eq.coordination',
        },
        () => {
          // Recharger les messages lors d'un changement
          fetchMessages(dossierId);
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
