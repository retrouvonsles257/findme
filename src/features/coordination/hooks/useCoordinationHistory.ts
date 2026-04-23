/**
 * =====================================================
 * RETROUVONSLES - Hook useCoordinationHistory
 * Historique des actions de coordination
 * =====================================================
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../../config/supabase.config';

// ============================================
// TYPES
// ============================================

export interface HistoryEntry {
  id: string;
  type: 'partage' | 'message' | 'ressource' | 'alerte' | 'modification';
  titre: string;
  description: string;
  auteur: string;
  organisation: string;
  timestamp: string;
  dossier_id?: string;
  metadata?: Record<string, any>;
}

export interface UseCoordinationHistoryReturn {
  history: HistoryEntry[];
  loading: boolean;
  error: string | null;
  fetchHistory: () => Promise<void>;
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export const useCoordinationHistory = (): UseCoordinationHistoryReturn => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Récupérer les messages de coordination récents
      const { data: messagesData } = await (supabase as any)
        .from('coordination_messages')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10);

      // Récupérer les alertes récentes
      const { data: alertesData } = await (supabase as any)
        .from('alerte')
        .select('id, titre, date_diffusion, statut_alerte, id_utilisateur_createur')
        .order('date_diffusion', { ascending: false })
        .limit(10);

      // Récupérer les dossiers partagés récemment modifiés
      const { data: dossiersData } = await (supabase as any)
        .from('dossier_disparition')
        .select('id, numero_dossier, updated_at, statut_dossier')
        .order('updated_at', { ascending: false })
        .limit(10);

      // Construire l'historique combiné
      const historyEntries: HistoryEntry[] = [];

      // Ajouter les messages
      (messagesData || []).forEach((msg: any) => {
        historyEntries.push({
          id: `msg-${msg.id}`,
          type: 'message',
          titre: 'Message de coordination',
          description: msg.text?.substring(0, 100) + (msg.text?.length > 100 ? '...' : ''),
          auteur: msg.author || 'Utilisateur',
          organisation: msg.organisation || 'Non spécifiée',
          timestamp: msg.timestamp,
          dossier_id: msg.dossier_id,
        });
      });

      // Ajouter les alertes
      (alertesData || []).forEach((alerte: any) => {
        historyEntries.push({
          id: `alerte-${alerte.id}`,
          type: 'alerte',
          titre: alerte.statut_alerte === 'en_cours' ? 'Alerte diffusée' : 'Alerte créée',
          description: alerte.titre || 'Nouvelle alerte',
          auteur: 'Système',
          organisation: 'Retrouvons-Les',
          timestamp: alerte.date_diffusion || new Date().toISOString(),
          metadata: { statut: alerte.statut_alerte },
        });
      });

      // Ajouter les dossiers modifiés
      (dossiersData || []).forEach((dossier: any) => {
        historyEntries.push({
          id: `dossier-${dossier.id}`,
          type: 'modification',
          titre: 'Dossier mis à jour',
          description: `${dossier.numero_dossier || 'Dossier'} - Statut: ${dossier.statut_dossier}`,
          auteur: 'Système',
          organisation: 'Retrouvons-Les',
          timestamp: dossier.updated_at,
          dossier_id: dossier.id,
        });
      });

      // Trier par date
      historyEntries.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setHistory(historyEntries.slice(0, 20));
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement de l\'historique');
      console.error('Fetch history error:', err);
      
      // Fallback data
      setHistory([
        {
          id: '1',
          type: 'message',
          titre: 'Message de coordination',
          description: 'Système de coordination initialisé',
          auteur: 'Système',
          organisation: 'Retrouvons-Les',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    loading,
    error,
    fetchHistory,
  };
};
