/**
 * =====================================================
 * RETROUVONSLES - Statistiques Redux Selectors
 * Redux selectors for statistiques feature
 * =====================================================
 */

import type { RootState } from '@/store/types';
import type { StatistiquesRegionales, TendanceTemporelle, DemographieStats, DistributionType, StatistiquesState } from '../types';

// Helper function to safely access statistique state
const statistiqueState = (state: RootState) => (state.statistiques as StatistiquesState) || {};

// ============================================
// BASIC SELECTORS
// ============================================

export const selectStatsGlobales = (state: RootState) =>
  statistiqueState(state).stats_globales;

export const selectStatsRegionales = (state: RootState) =>
  statistiqueState(state).stats_regionales || [];

export const selectTendances = (state: RootState) =>
  statistiqueState(state).tendances || [];

export const selectDemographics = (state: RootState) =>
  statistiqueState(state).demographics || [];

export const selectDistributions = (state: RootState) =>
  statistiqueState(state).distributions || [];

export const selectIsLoading = (state: RootState) =>
  statistiqueState(state).isLoading || false;

export const selectError = (state: RootState) =>
  statistiqueState(state).error || null;

export const selectCurrentFilter = (state: RootState) =>
  statistiqueState(state).current_filter;

export const selectDateRange = (state: RootState) =>
  statistiqueState(state).date_range;

// ============================================
// COMPUTED SELECTORS
// ============================================

export const selectGlobalMetrics = (state: RootState) => {
  const stats = statistiqueState(state).stats_globales;
  if (!stats) return null;

  return {
    total_personnes: stats.total_personnes,
    total_dossiers: stats.total_dossiers,
    total_signalements: stats.total_signalements,
    taux_resolution: stats.taux_resolution_global,
    cas_en_cours: stats.cas_en_cours,
    retrouves: stats.personnes_retrouvees,
    decedes: stats.personnes_decedees,
  };
};

export const selectTopRegions = (state: RootState) => {
  const regionales = statistiqueState(state).stats_regionales || [];
  return regionales
    .slice()
    .sort((a: StatistiquesRegionales, b: StatistiquesRegionales) => b.taux_resolution - a.taux_resolution)
    .slice(0, 5);
};

export const selectBottomRegions = (state: RootState) => {
  const regionales = statistiqueState(state).stats_regionales || [];
  return regionales
    .slice()
    .sort((a: StatistiquesRegionales, b: StatistiquesRegionales) => a.taux_resolution - b.taux_resolution)
    .slice(0, 5);
};

export const selectRegionByName = (regionName: string) => (state: RootState) => {
  const regionales = statistiqueState(state).stats_regionales || [];
  return regionales.find(
    (r: StatistiquesRegionales) => r.region === regionName
  );
};

export const selectTendancesByMonth = (state: RootState) => {
  const monthMap = new Map<string, any>();
  const tendances = statistiqueState(state).tendances || [];

  tendances.forEach((t: TendanceTemporelle) => {
    const key = `${t.mois}-${t.annee}`;
    if (!monthMap.has(key)) {
      monthMap.set(key, {
        mois: t.mois,
        annee: t.annee,
        total_nouveaux: 0,
        total_resolus: 0,
      });
    }
    const month = monthMap.get(key);
    month.total_nouveaux += t.cas_nouveaux;
    month.total_resolus += t.cas_resolus;
  });

  return Array.from(monthMap.values());
};

export const selectResolutionTrend = (state: RootState) => {
  const tendances = statistiqueState(state).tendances || [];
  if (tendances.length === 0) return [];

  return tendances.map((t: TendanceTemporelle) => ({
    date: t.date,
    taux: Math.round(t.taux_resolution_periode * 10) / 10,
  }));
};

export const selectDemographyBreakdown = (state: RootState) => {
  const breakdown: Record<string, any> = {
    by_age: {},
    by_gender: {},
  };
  const demographics = statistiqueState(state).demographics || [];

  demographics.forEach((d: DemographieStats) => {
    // By age
    if (!breakdown.by_age[d.tranche_age]) {
      breakdown.by_age[d.tranche_age] = {
        total: 0,
        resolved: 0,
      };
    }
    breakdown.by_age[d.tranche_age].total += d.nombre_cas;
    breakdown.by_age[d.tranche_age].resolved += d.nombre_retrouves;

    // By gender
    if (!breakdown.by_gender[d.sexe]) {
      breakdown.by_gender[d.sexe] = {
        total: 0,
        resolved: 0,
      };
    }
    breakdown.by_gender[d.sexe].total += d.nombre_cas;
    breakdown.by_gender[d.sexe].resolved += d.nombre_retrouves;
  });

  return breakdown;
};

export const selectCaseTypeDistribution = (state: RootState) => {
  const distributions = statistiqueState(state).distributions || [];
  return distributions.map((d: DistributionType) => ({
    type: d.type,
    count: d.nombre_cas,
    resolved: d.nombre_retrouves,
    rate: Math.round(d.taux_resolution * 10) / 10,
  }));
};

export const selectTotalCases = (state: RootState) => {
  const stats = statistiqueState(state).stats_globales;
  return stats ? stats.total_signalements : 0;
};

export const selectResolutionRate = (state: RootState) => {
  const stats = statistiqueState(state).stats_globales;
  return stats ? Math.round(stats.taux_resolution_global * 10) / 10 : 0;
};

export const selectAverageResolutionTime = (state: RootState) => {
  const regions = statistiqueState(state).stats_regionales || [];
  if (regions.length === 0) return 0;
  const total = regions.reduce((sum: number, r: StatistiquesRegionales) => sum + r.temps_moyen_resolution, 0);
  return Math.round((total / regions.length) * 10) / 10;
};

export const selectSelectedRegion = (state: RootState) => {
  return statistiqueState(state).selected_region;
};

export const selectSelectedPeriod = (state: RootState) => {
  return statistiqueState(state).selected_period;
};

export const selectStatistiquesCount = (state: RootState) => ({
  global: statistiqueState(state).stats_globales ? 1 : 0,
  regionales: (statistiqueState(state).stats_regionales || []).length,
  tendances: (statistiqueState(state).tendances || []).length,
  demographics: (statistiqueState(state).demographics || []).length,
  distributions: (statistiqueState(state).distributions || []).length,
});
