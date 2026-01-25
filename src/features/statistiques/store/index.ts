/**
 * Statistiques Feature - Store Barrel Export
 */

export {
  fetchStatistiquesGlobales,
  fetchStatistiquesRegionales,
  fetchTendancesTemporelles,
  fetchDemographieStats,
  fetchDistributionType,
  fetchDashboardMetrics,
  exportStatisticsData,
  clearError,
  setFilter,
  setDateRange,
  setSelectedRegion,
  setSelectedPeriod,
} from './statistiqueSlice';

export {
  selectStatsGlobales,
  selectStatsRegionales,
  selectTendances,
  selectDemographics,
  selectDistributions,
  selectIsLoading,
  selectError,
  selectCurrentFilter,
  selectDateRange,
  selectGlobalMetrics,
  selectTopRegions,
  selectBottomRegions,
  selectRegionByName,
  selectTendancesByMonth,
  selectResolutionTrend,
  selectDemographyBreakdown,
  selectCaseTypeDistribution,
  selectTotalCases,
  selectResolutionRate,
  selectAverageResolutionTime,
  selectSelectedRegion,
  selectSelectedPeriod,
  selectStatistiquesCount,
} from './statistiqueSelectors';
