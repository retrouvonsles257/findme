/**
 * =====================================================
 * RETROUVONSLES - useStatisticsHistory Hook
 * Récupère l'historique des statistiques pour les graphiques
 * =====================================================
 */

import { useState, useCallback } from 'react';
import { supabase } from '../../../config';

export interface TrendDataPoint {
  period: string;
  dossiers: number;
  retrouves: number;
  signalements: number;
}

interface UseStatisticsHistoryReturn {
  trendData: TrendDataPoint[];
  isLoading: boolean;
  error: string | null;
  fetchTrendData: (days?: number) => Promise<void>;
}

export const useStatisticsHistory = (): UseStatisticsHistoryReturn => {
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrendData = useCallback(async (days: number = 30) => {
    setIsLoading(true);
    setError(null);

    try {
      // Récupérer tous les dossiers avec leurs dates
      const { data: dossiers, error: dossiersErr } = await (supabase as any)
        .from('dossier_disparition')
        .select('id, created_at, statut_dossier');

      if (dossiersErr) throw dossiersErr;

      // Récupérer tous les signalements avec leurs dates
      const { data: signalements, error: signalementsErr } = await (supabase as any)
        .from('signalement')
        .select('id, id_dossier, date_observation');

      if (signalementsErr) throw signalementsErr;

      // Calculer les tendances par semaine
      const now = new Date();
      const weekTrends: Map<string, TrendDataPoint> = new Map();

      // Initialiser 4 dernières semaines
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (i * 7 + 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const weekLabel = `Sem ${4 - i}`;
        weekTrends.set(weekLabel, {
          period: weekLabel,
          dossiers: 0,
          retrouves: 0,
          signalements: 0,
        });
      }

      // Compter les dossiers par semaine
      if (dossiers) {
        dossiers.forEach((d: any) => {
          const createdDate = new Date(d.created_at);
          const weekDiff = Math.floor((now.getTime() - createdDate.getTime()) / (7 * 24 * 60 * 60 * 1000));

          if (weekDiff >= 0 && weekDiff < 4) {
            const weekIndex = Math.floor(weekDiff);
            const weekLabel = `Sem ${4 - weekIndex}`;
            const entry = weekTrends.get(weekLabel);

            if (entry) {
              entry.dossiers += 1;
              if (d.statut_dossier.includes('retrouve')) {
                entry.retrouves += 1;
              }
            }
          }
        });
      }

      // Compter les signalements par semaine
      if (signalements) {
        signalements.forEach((s: any) => {
          if (!s.date_observation) return;

          const signDate = new Date(s.date_observation);
          const weekDiff = Math.floor((now.getTime() - signDate.getTime()) / (7 * 24 * 60 * 60 * 1000));

          if (weekDiff >= 0 && weekDiff < 4) {
            const weekIndex = Math.floor(weekDiff);
            const weekLabel = `Sem ${4 - weekIndex}`;
            const entry = weekTrends.get(weekLabel);

            if (entry) {
              entry.signalements += 1;
            }
          }
        });
      }

      // Convertir en tableau trié
      const sortedTrends = Array.from(weekTrends.values())
        .sort((a, b) => {
          const aNum = parseInt(a.period.replace('Sem ', ''));
          const bNum = parseInt(b.period.replace('Sem ', ''));
          return aNum - bNum;
        });

      setTrendData(sortedTrends);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des tendances');
      console.error('Fetch statistics history error:', err);
      setTrendData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    trendData,
    isLoading,
    error,
    fetchTrendData,
  };
};
