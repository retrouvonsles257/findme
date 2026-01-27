/**
 * =====================================================
 * RETROUVONSLES - usePerformanceMetrics Hook
 * Calcule les métriques de performance réelles depuis Supabase
 * =====================================================
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../../config';

export interface PerformanceMetrics {
  tempsMoyenResolution: number; // en jours
  signalementsParDossier: number;
  tauxValidation: number; // en pourcentage
  alertesDiffusees: number;
  dossiersResolusRecemment: number;
  tempsMedianResolution: number;
  tauxResolutionMensuel: number;
}

interface UsePerformanceMetricsReturn {
  metrics: PerformanceMetrics;
  isLoading: boolean;
  error: string | null;
  fetchMetrics: () => Promise<void>;
}

export const usePerformanceMetrics = (): UsePerformanceMetricsReturn => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    tempsMoyenResolution: 0,
    signalementsParDossier: 0,
    tauxValidation: 0,
    alertesDiffusees: 0,
    dossiersResolusRecemment: 0,
    tempsMedianResolution: 0,
    tauxResolutionMensuel: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Récupérer les dossiers résolus avec dates
      const { data: dossiersResolus, error: dossiersErr } = await (supabase as any)
        .from('dossier_disparition')
        .select('id, created_at, date_resolution, statut_dossier, nombre_signalements')
        .in('statut_dossier', ['retrouve_vivant', 'retrouve_decede']);

      if (dossiersErr) throw dossiersErr;

      // 2. Récupérer tous les dossiers pour calculer les moyennes
      const { data: allDossiers, error: allDossiersErr } = await (supabase as any)
        .from('dossier_disparition')
        .select('id, nombre_signalements');

      if (allDossiersErr) throw allDossiersErr;

      // 3. Récupérer les signalements pour le taux de validation
      const { data: signalements, error: signalementsErr } = await (supabase as any)
        .from('signalement')
        .select('id, statut_validation');

      if (signalementsErr) throw signalementsErr;

      // 4. Récupérer les alertes diffusées
      const { data: alertes, error: alertesErr } = await (supabase as any)
        .from('alerte')
        .select('id, statut_alerte')
        .in('statut_alerte', ['en_cours', 'terminee']);

      if (alertesErr) throw alertesErr;

      // Calculer le temps moyen de résolution (en jours)
      let tempsMoyenResolution = 0;
      let tempsMedianResolution = 0;
      const tempsResolutions: number[] = [];

      if (dossiersResolus && dossiersResolus.length > 0) {
        dossiersResolus.forEach((d: any) => {
          if (d.date_resolution && d.created_at) {
            const creation = new Date(d.created_at).getTime();
            const resolution = new Date(d.date_resolution).getTime();
            const diffJours = (resolution - creation) / (1000 * 60 * 60 * 24);
            if (diffJours >= 0) {
              tempsResolutions.push(diffJours);
            }
          }
        });

        if (tempsResolutions.length > 0) {
          tempsMoyenResolution = tempsResolutions.reduce((a, b) => a + b, 0) / tempsResolutions.length;
          
          // Calculer la médiane
          const sorted = [...tempsResolutions].sort((a, b) => a - b);
          const mid = Math.floor(sorted.length / 2);
          tempsMedianResolution = sorted.length % 2 !== 0
            ? sorted[mid]
            : (sorted[mid - 1] + sorted[mid]) / 2;
        }
      }

      // Calculer le nombre moyen de signalements par dossier
      let signalementsParDossier = 0;
      if (allDossiers && allDossiers.length > 0) {
        const totalSignalements = allDossiers.reduce(
          (sum: number, d: any) => sum + (d.nombre_signalements || 0),
          0
        );
        signalementsParDossier = totalSignalements / allDossiers.length;
      }

      // Calculer le taux de validation des signalements
      let tauxValidation = 0;
      if (signalements && signalements.length > 0) {
        const valides = signalements.filter((s: any) => s.statut_validation === 'valide').length;
        tauxValidation = (valides / signalements.length) * 100;
      }

      // Compter les alertes diffusées
      const alertesDiffusees = alertes?.length || 0;

      // Calculer les dossiers résolus ce mois-ci
      const debutMois = new Date();
      debutMois.setDate(1);
      debutMois.setHours(0, 0, 0, 0);
      
      let dossiersResolusRecemment = 0;
      let tauxResolutionMensuel = 0;
      
      if (dossiersResolus) {
        dossiersResolusRecemment = dossiersResolus.filter((d: any) => {
          if (!d.date_resolution) return false;
          return new Date(d.date_resolution) >= debutMois;
        }).length;

        // Taux de résolution mensuel
        const { data: dossiersMois } = await (supabase as any)
          .from('dossier_disparition')
          .select('id')
          .gte('created_at', debutMois.toISOString());

        if (dossiersMois && dossiersMois.length > 0) {
          tauxResolutionMensuel = (dossiersResolusRecemment / dossiersMois.length) * 100;
        }
      }

      setMetrics({
        tempsMoyenResolution: Math.round(tempsMoyenResolution * 10) / 10,
        signalementsParDossier: Math.round(signalementsParDossier * 10) / 10,
        tauxValidation: Math.round(tauxValidation),
        alertesDiffusees,
        dossiersResolusRecemment,
        tempsMedianResolution: Math.round(tempsMedianResolution * 10) / 10,
        tauxResolutionMensuel: Math.round(tauxResolutionMensuel),
      });
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des métriques');
      console.error('Fetch performance metrics error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Charger les métriques au montage
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    isLoading,
    error,
    fetchMetrics,
  };
};
