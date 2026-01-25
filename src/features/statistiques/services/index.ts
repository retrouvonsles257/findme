/**
 * Statistiques Feature - Services Barrel Export
 */

export {
  getStatistiquesGlobales,
  getStatistiquesRegionales,
  getTendancesTemporelles,
  getDemographieStats,
  getDistributionType,
  getDashboardMetrics,
  exportStatistics,
} from './statistiqueAPI';

export {
  formatResolutionMetrics,
  calculateMonthlyTrends,
  getTopRegions,
  getBottomRegions,
  formatPercentage,
  formatNumber,
  formatDateRange,
  getDaysAgo,
  getDateRangeForPeriod,
  calculateTrend,
  getResolutionRateColor,
  formatResolutionTime,
  parseFilters,
  generateSparklineData,
  getComparativeText,
} from './statistiqueService';
