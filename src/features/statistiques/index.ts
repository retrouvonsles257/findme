/**
 * Statistiques Feature - Main Export
 * Provides all types, services, store, hooks, and components
 */

// Types
export type {
  Statistique,
  StatistiquesGlobales,
  StatistiquesRegionales,
  TendanceTemporelle,
  DemographieStats,
  DistributionType,
  DateRangeStats,
  StatistiquesExport,
  StatistiquesFilter,
  StatistiquesState,
  DashboardProps,
  StatFilterProps,
  ResolutionRateProps,
  StatsByRegionProps,
  TrendsAnalysisProps,
  StatsExportProps,
  ResolutionMetrics,
  GeographicDistribution,
  TemporalTrend,
  AnalyticsEvent,
  CaseStatusDistribution,
  MonthlyTrend,
} from './types';

// Services - API Functions
export {
  getStatistiquesGlobales,
  getStatistiquesRegionales,
  getTendancesTemporelles,
  getDemographieStats,
  getDistributionType,
  getDashboardMetrics,
  exportStatistics,
} from './services';

// Services - Utilities
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
} from './services';

// Store - Actions/Thunks
export {
  fetchStatistiquesGlobales,
  fetchStatistiquesRegionales,
  fetchTendancesTemporelles,
  fetchDemographieStats,
  fetchDistributionType,
  fetchDashboardMetrics,
  exportStatisticsData,
} from './store';

// Store - Selectors
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
} from './store';

// Hooks
export {
  useStatistiques,
  useStatsByRegion,
  useStatsByType,
} from './hooks';

// Components
export {
  Dashboard,
  ResolutionRate,
  StatsByRegion,
  StatsByType,
  StatsExport,
  StatsFilters,
  TrendsAnalysis,
} from './components';
