/**
 * =====================================================
 * RETROUVONSLES - Statistiques Service Utilities
 * Helper functions for statistics operations
 * =====================================================
 */

import type {
  ResolutionMetrics,
  TendanceTemporelle,
  StatistiquesRegionales,
  MonthlyTrend,
} from '../types';

/**
 * Format resolution metrics
 */
export function formatResolutionMetrics(
  total: number,
  resolved: number
): ResolutionMetrics {
  const taux = total > 0 ? (resolved / total) * 100 : 0;
  return {
    total_cas: total,
    cas_resolus: resolved,
    cas_en_cours: total - resolved,
    taux_resolution_pct: Math.round(taux * 10) / 10,
    taux_resolution_formatte: `${Math.round(taux * 10) / 10}%`,
  };
}

/**
 * Calculate monthly trends
 */
export function calculateMonthlyTrends(
  tendances: TendanceTemporelle[]
): MonthlyTrend[] {
  const monthMap = new Map<string, any>();

  tendances.forEach((t) => {
    const key = `${t.mois}-${t.annee}`;
    if (!monthMap.has(key)) {
      monthMap.set(key, {
        mois: t.mois,
        annee: t.annee,
        cas_debut_mois: 0,
        cas_fin_mois: 0,
        taux_resolution_cumule: 0,
        total_resolus: 0,
      });
    }
    const month = monthMap.get(key);
    month.cas_fin_mois += t.cas_nouveaux;
    month.total_resolus += t.cas_resolus;
  });

  return Array.from(monthMap.values()).map((m: any) => ({
    mois: m.mois,
    annee: m.annee,
    cas_debut_mois: m.cas_debut_mois,
    cas_fin_mois: m.cas_fin_mois,
    taux_resolution_cumule: m.cas_fin_mois > 0 ? (m.total_resolus / m.cas_fin_mois) * 100 : 0,
  }));
}

/**
 * Get top regions by resolution rate
 */
export function getTopRegions(
  regions: StatistiquesRegionales[],
  limit: number = 5
): StatistiquesRegionales[] {
  return regions.sort((a, b) => b.taux_resolution - a.taux_resolution).slice(0, limit);
}

/**
 * Get bottom regions (need improvement)
 */
export function getBottomRegions(
  regions: StatistiquesRegionales[],
  limit: number = 5
): StatistiquesRegionales[] {
  return regions.sort((a, b) => a.taux_resolution - b.taux_resolution).slice(0, limit);
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  const factor = Math.pow(10, decimals);
  return `${Math.round(value * factor) / factor}%`;
}

/**
 * Format number with thousand separator
 */
export function formatNumber(value: number): string {
  return value.toLocaleString('fr-FR');
}

/**
 * Format date to readable string
 */
export function formatDateRange(debut: string, fin: string): string {
  const start = new Date(debut).toLocaleDateString('fr-FR');
  const end = new Date(fin).toLocaleDateString('fr-FR');
  return `Du ${start} au ${end}`;
}

/**
 * Get date X days ago
 */
export function getDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

/**
 * Get date range for common periods
 */
export function getDateRangeForPeriod(
  period: 'week' | 'month' | 'quarter' | 'year' | 'all'
): { debut: string; fin: string } {
  const fin = new Date();
  const debut = new Date();

  switch (period) {
    case 'week':
      debut.setDate(debut.getDate() - 7);
      break;
    case 'month':
      debut.setMonth(debut.getMonth() - 1);
      break;
    case 'quarter':
      debut.setMonth(debut.getMonth() - 3);
      break;
    case 'year':
      debut.setFullYear(debut.getFullYear() - 1);
      break;
    case 'all':
      debut.setFullYear(2000);
      break;
  }

  return {
    debut: debut.toISOString().split('T')[0],
    fin: fin.toISOString().split('T')[0],
  };
}

/**
 * Calculate trend indicator
 */
export function calculateTrend(current: number, previous: number): 'up' | 'down' | 'stable' {
  if (current > previous * 1.05) return 'up';
  if (current < previous * 0.95) return 'down';
  return 'stable';
}

/**
 * Get color for resolution rate
 */
export function getResolutionRateColor(rate: number): string {
  if (rate >= 80) return '#28a745'; // green
  if (rate >= 60) return '#ffc107'; // amber
  if (rate >= 40) return '#fd7e14'; // orange
  return '#dc3545'; // red
}

/**
 * Format resolution time (days to readable string)
 */
export function formatResolutionTime(days: number): string {
  if (days < 1) return '< 1 jour';
  if (days === 1) return '1 jour';
  if (days < 7) return `${Math.round(days)} jours`;
  if (days < 30) return `${Math.round(days / 7)} semaines`;
  return `${Math.round(days / 30)} mois`;
}

/**
 * Parse filter string
 */
export function parseFilters(filterString: string): Record<string, string> {
  const filters: Record<string, string> = {};
  const pairs = filterString.split('&');
  pairs.forEach((pair) => {
    const [key, value] = pair.split('=');
    if (key && value) {
      filters[decodeURIComponent(key)] = decodeURIComponent(value);
    }
  });
  return filters;
}

/**
 * Generate chart data for sparklines
 */
export function generateSparklineData(values: number[], maxValue?: number): number[] {
  const max = maxValue || Math.max(...values, 1);
  return values.map((v) => (max > 0 ? (v / max) * 100 : 0));
}

/**
 * Get comparative metrics text
 */
export function getComparativeText(
  current: number,
  previous: number,
  suffix: string = ''
): string {
  const diff = current - previous;
  const percent = previous > 0 ? (diff / previous) * 100 : 0;

  if (diff > 0) {
    return `+${Math.round(percent * 10) / 10}% ${suffix}`.trim();
  } else if (diff < 0) {
    return `${Math.round(percent * 10) / 10}% ${suffix}`.trim();
  } else {
    return `Stable ${suffix}`.trim();
  }
}
