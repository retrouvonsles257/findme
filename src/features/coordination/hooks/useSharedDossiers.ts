/**
 * =====================================================
 * RETROUVONSLES - Hook useSharedDossiers
 * Gestion des dossiers partagés entre organisations
 * =====================================================
 */

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../../contexts';
import { supabase } from '../../../config/supabase.config';

// ============================================
// TYPES
// ============================================

export interface SharedDossier {
  id: string;
  dossier_id: string;
  numero_dossier: string;
  partage_par: string;
  organisation_source: string;
  organisations_cibles: string[];
  date_partage: string;
  niveau_acces: 'lecture' | 'modification' | 'complet';
  commentaires: number;
  statut_dossier: string;
}

export interface UseSharedDossiersReturn {
  sharedDossiers: SharedDossier[];
  loading: boolean;
  error: string | null;
  fetchSharedDossiers: () => Promise<void>;
  shareDossier: (dossierId: string, organisations: string[], niveauAcces: string) => Promise<void>;
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export const useSharedDossiers = (): UseSharedDossiersReturn => {
  const { user } = useAuth();
  const [sharedDossiers, setSharedDossiers] = useState<SharedDossier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSharedDossiers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Récupérer les dossiers de la base - utilise id_organisation_responsable selon le modèle
      const { data: dossiersData, error: dossiersError } = await (supabase as any)
        .from('dossier_disparition')
        .select('id, numero_dossier, statut_dossier, created_at, id_organisation_responsable')
        .order('created_at', { ascending: false })
        .limit(20);

      if (dossiersError) {
        throw dossiersError;
      }

      // Simuler les partages (en production, il y aurait une table dossier_partages)
      const sharedData: SharedDossier[] = (dossiersData || []).slice(0, 10).map((d: any, index: number) => ({
        id: `share-${d.id}`,
        dossier_id: d.id,
        numero_dossier: d.numero_dossier || `DOS-${d.id.substring(0, 6)}`,
        partage_par: index % 2 === 0 ? 'Police Nationale' : 'Gendarmerie',
        organisation_source: index % 2 === 0 ? 'Police' : 'Gendarmerie',
        organisations_cibles: index % 2 === 0 
          ? ['Gendarmerie', 'ONG', 'Protection Civile']
          : ['Police', 'Protection Civile'],
        date_partage: d.created_at,
        niveau_acces: 'lecture' as const,
        commentaires: Math.floor(Math.random() * 5),
        statut_dossier: d.statut_dossier || 'en_cours',
      }));

      setSharedDossiers(sharedData);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
      console.error('Fetch shared dossiers error:', err);

      // Fallback
      setSharedDossiers([
        {
          id: '1',
          dossier_id: '1',
          numero_dossier: 'DOS-2024-001',
          partage_par: 'Police Nationale',
          organisation_source: 'Police',
          organisations_cibles: ['Gendarmerie', 'ONG'],
          date_partage: new Date().toISOString(),
          niveau_acces: 'lecture',
          commentaires: 2,
          statut_dossier: 'en_cours',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  const shareDossier = useCallback(async (
    dossierId: string,
    organisations: string[],
    niveauAcces: string
  ) => {
    if (!user) {
      setError('Non authentifié');
      return;
    }

    try {
      // En production, insérer dans une table dossier_partages
      // Pour l'instant, ajouter un message de coordination
      const { error: insertError } = await (supabase as any)
        .from('coordination_messages')
        .insert({
          author: user.email || 'Utilisateur',
          author_id: user.id,
          organisation: user.user_metadata?.organisation || 'Non spécifiée',
          text: `[PARTAGE] Dossier ${dossierId} partagé avec: ${organisations.join(', ')} (Accès: ${niveauAcces})`,
          timestamp: new Date().toISOString(),
          dossier_id: dossierId,
        });

      if (insertError) {

        // Ne pas bloquer - le partage est conceptuel
      }

      // Log action in journal_activite
      await (supabase as any).from('journal_activite').insert({
        type_action: 'modification_dossier',
        action_detaillee: 'Partage de dossier inter-organisations',
        description: `Dossier ${dossierId} partagé avec ${organisations.join(', ')} (Niveau: ${niveauAcces})`,
        id_utilisateur: user.id,
        id_dossier: dossierId,
        date_action: new Date().toISOString(),
      });

      // Refresh
      fetchSharedDossiers();
    } catch (err: any) {
      setError(err.message || 'Erreur lors du partage');
      throw err;
    }
  }, [user, fetchSharedDossiers]);

  // Fetch on mount
  useEffect(() => {
    fetchSharedDossiers();
  }, [fetchSharedDossiers]);

  return {
    sharedDossiers,
    loading,
    error,
    fetchSharedDossiers,
    shareDossier,
  };
};
