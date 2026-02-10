/**
 * =====================================================
 * RETROUVONSLES - useHistoriqueDossier Hook
 * Récupère l'historique des modifications d'un dossier
 * =====================================================
 */

import { useState, useCallback } from 'react';
import { supabase } from '../../../config';

interface HistoriqueEntry {
  id: string;
  action: string;
  description: string;
  date_modification: string;
  modified_by?: string;
}

interface UseHistoriqueDossierReturn {
  historique: HistoriqueEntry[];
  isLoading: boolean;
  error: string | null;
  fetchHistorique: (dossierId: string) => Promise<void>;
}

export const useHistoriqueDossier = (): UseHistoriqueDossierReturn => {
  const [historique, setHistorique] = useState<HistoriqueEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistorique = useCallback(async (dossierId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Essayer d'abord journal_activite (table standard)
      const { data: journalData, error: journalErr } = await (supabase as any)
        .from('journal_activite')
        .select('*, utilisateur:id_utilisateur(nom, prenom)')
        .eq('id_dossier', dossierId)
        .order('date_action', { ascending: false })
        .limit(50);

      if (!journalErr && journalData && journalData.length > 0) {
        // Mapper journal_activite vers HistoriqueEntry
        const mapped = journalData.map((entry: any) => {
          const rawDate = entry.date_action || entry.created_at;
          const dateMod = rawDate instanceof Date ? rawDate.toISOString() : (typeof rawDate === 'string' ? rawDate : '');
          return {
            id: entry.id,
            action: entry.type_action || entry.action || 'Action',
            description: entry.description || entry.contenu || '',
            date_modification: dateMod,
            modified_by: entry.utilisateur 
              ? `${entry.utilisateur.prenom || ''} ${entry.utilisateur.nom || ''}`.trim()
              : entry.nom_utilisateur || 'Système',
          };
        });
        setHistorique(mapped);
        return;
      }

      // Fallback: essayer dossier_historique si elle existe
      const { data: histData, error: histErr } = await (supabase as any)
        .from('dossier_historique')
        .select('*, utilisateur:id_utilisateur(nom, prenom)')
        .eq('id_dossier', dossierId)
        .order('date_modification', { ascending: false });

      if (!histErr && histData) {
        const mapped = histData.map((entry: any) => {
          const rawDate = entry.date_modification || entry.created_at;
          const dateMod = rawDate instanceof Date ? rawDate.toISOString() : (typeof rawDate === 'string' ? rawDate : '');
          return {
            ...entry,
            date_modification: dateMod,
            modified_by: entry.utilisateur 
              ? `${entry.utilisateur.prenom || ''} ${entry.utilisateur.nom || ''}`.trim()
              : entry.modified_by || 'Système',
          };
        });
        setHistorique(mapped);
      } else {
        // Si aucune table n'existe, retourner vide
        console.warn('Aucune table d\'historique trouvée');
        setHistorique([]);
      }
    } catch (err: any) {
      console.warn('Could not fetch historique:', err.message);
      setHistorique([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    historique,
    isLoading,
    error,
    fetchHistorique,
  };
};
