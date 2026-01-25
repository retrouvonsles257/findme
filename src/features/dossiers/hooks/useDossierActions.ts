/**
 * =====================================================
 * RETROUVONSLES - useDossierActions Hook
 * Dossier action tracking
 * =====================================================
 */

import { useState, useCallback } from 'react';
import type { UseDossierActionsReturn, DossierAction } from '../types';
import * as dossierAPI from '../services/dossierAPI';

export const useDossierActions = (): UseDossierActionsReturn => {
  const [actions, setActions] = useState<DossierAction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActions = useCallback(async (dossierId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const rawActions = await dossierAPI.getDossierActions(dossierId);
      // Transform API data to DossierAction format if needed
      const transformedActions: DossierAction[] = rawActions.map((action: any) => ({
        id: action.id,
        dossierId: action.id_dossier,
        type: action.type_action as any,
        description: action.description,
        data: action.data || {},
        createdBy: action.id_utilisateur || 'system',
        createdAt: action.created_at,
      }));

      setActions(transformedActions);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
      console.error('Fetch actions error:', err);
      // Use mock data as fallback
      setActions([
        {
          id: '1',
          dossierId,
          type: 'update_status',
          description: 'Dossier créé',
          data: {},
          createdBy: 'system',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const performAction = useCallback(async (action: DossierAction) => {
    setIsLoading(true);
    setError(null);

    try {
      // Log the action to API
      if (action.dossierId) {
        await dossierAPI.logDossierAction(
          action.dossierId,
          action.type,
          action.description,
          action.createdBy,
          action.data,
        );
      }

      // Add to local state
      const newAction = {
        ...action,
        id: action.id || Date.now().toString(),
        createdAt: action.createdAt || new Date().toISOString(),
      };

      setActions((prev) => [newAction, ...prev]);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'action');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    actions,
    isLoading,
    error,
    fetchActions,
    performAction,
  };
};
