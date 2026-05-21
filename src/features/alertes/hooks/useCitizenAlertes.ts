/**
 * Alertes visibles côté citoyen (RPC + politique RLS grand_public).
 */
import { useState, useCallback } from 'react';
import type { Alerte } from '../../../@types/alertes.types';
import * as citizenAlerteAPI from '../services/citizenAlerteAPI';

export interface UseCitizenAlertesReturn {
  alertes: Alerte[];
  loading: boolean;
  error: string | null;
  fetchAlertes: () => Promise<void>;
}

export function useCitizenAlertes(): UseCitizenAlertesReturn {
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAlertes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const rows = await citizenAlerteAPI.listCitizenAlertes();
      setAlertes(rows);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { alertes, loading, error, fetchAlertes };
}
