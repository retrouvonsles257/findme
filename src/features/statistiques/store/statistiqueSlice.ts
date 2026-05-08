/**
 * =====================================================
 * RETROUVONSLES - Statistiques Redux Slice
 * Redux store for statistiques feature
 * =====================================================
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type {
  StatistiquesState,
  StatistiquesFilter,
} from '../types';
import {
  getStatistiquesGlobales,
  getStatistiquesRegionales,
  getTendancesTemporelles,
  getDemographieStats,
  getDistributionType,
  getDashboardMetrics,
  exportStatistics,
} from '../services/statistiqueAPI';

// ============================================
// ASYNC THUNKS
// ============================================

export const fetchStatistiquesGlobales = createAsyncThunk(
  'statistiques/fetchGlobales',
  async () => {
    return getStatistiquesGlobales();
  }
);

export const fetchStatistiquesRegionales = createAsyncThunk(
  'statistiques/fetchRegionales',
  async () => {
    return getStatistiquesRegionales();
  }
);

export const fetchTendancesTemporelles = createAsyncThunk(
  'statistiques/fetchTendances',
  async ({ debut, fin }: { debut: string; fin: string }) => {
    return getTendancesTemporelles(debut, fin);
  }
);

export const fetchDemographieStats = createAsyncThunk(
  'statistiques/fetchDemographie',
  async () => {
    return getDemographieStats();
  }
);

export const fetchDistributionType = createAsyncThunk(
  'statistiques/fetchDistribution',
  async () => {
    return getDistributionType();
  }
);

export const fetchDashboardMetrics = createAsyncThunk(
  'statistiques/fetchDashboardMetrics',
  async (daysBack: number = 7) => {
    return getDashboardMetrics(daysBack);
  }
);

export const exportStatisticsData = createAsyncThunk(
  'statistiques/export',
  async (format: 'csv' | 'json' | 'pdf' | 'xlsx') => {
    return exportStatistics(format);
  }
);

// ============================================
// INITIAL STATE
// ============================================

const initialState: StatistiquesState = {
  stats_globales: null,
  stats_regionales: [],
  tendances: [],
  demographics: [],
  distributions: [],

  isLoading: false,
  error: null,

  current_filter: {},
  date_range: {
    debut: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    fin: new Date().toISOString().split('T')[0],
  },
};

// ============================================
// SLICE
// ============================================

const statistiquesSlice = createSlice({
  name: 'statistiques',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilter: (state, action: PayloadAction<StatistiquesFilter>) => {
      state.current_filter = action.payload;
    },
    setDateRange: (
      state,
      action: PayloadAction<{ debut: string; fin: string }>
    ) => {
      state.date_range = action.payload;
    },
    setSelectedRegion: (state, action: PayloadAction<string | undefined>) => {
      state.selected_region = action.payload;
    },
    setSelectedPeriod: (state, action: PayloadAction<string | undefined>) => {
      state.selected_period = action.payload;
    },
  },

  extraReducers: (builder) => {
    // Fetch Globales
    builder
      .addCase(fetchStatistiquesGlobales.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchStatistiquesGlobales.fulfilled,
        (state, action) => {
          state.isLoading = false;
          state.stats_globales = action.payload;
        }
      )
      .addCase(fetchStatistiquesGlobales.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Error fetching global statistics';
      });

    // Fetch Regionales
    builder
      .addCase(fetchStatistiquesRegionales.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchStatistiquesRegionales.fulfilled,
        (state, action) => {
          state.isLoading = false;
          state.stats_regionales = action.payload;
        }
      )
      .addCase(fetchStatistiquesRegionales.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Error fetching regional statistics';
      });

    // Fetch Tendances
    builder
      .addCase(fetchTendancesTemporelles.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchTendancesTemporelles.fulfilled,
        (state, action) => {
          state.isLoading = false;
          state.tendances = action.payload;
        }
      )
      .addCase(fetchTendancesTemporelles.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Error fetching temporal trends';
      });

    // Fetch Demographics
    builder
      .addCase(fetchDemographieStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchDemographieStats.fulfilled,
        (state, action) => {
          state.isLoading = false;
          state.demographics = action.payload;
        }
      )
      .addCase(fetchDemographieStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Error fetching demographic data';
      });

    // Fetch Distribution
    builder
      .addCase(fetchDistributionType.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchDistributionType.fulfilled,
        (state, action) => {
          state.isLoading = false;
          state.distributions = action.payload;
        }
      )
      .addCase(fetchDistributionType.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Error fetching distribution data';
      });

    // Dashboard Metrics
    builder
      .addCase(fetchDashboardMetrics.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchDashboardMetrics.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(fetchDashboardMetrics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Error fetching dashboard metrics';
      });

    // Export
    builder
      .addCase(exportStatisticsData.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(exportStatisticsData.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(exportStatisticsData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Error exporting statistics';
      });
  },
});

export const {
  clearError,
  setFilter,
  setDateRange,
  setSelectedRegion,
  setSelectedPeriod,
} = statistiquesSlice.actions;

export default statistiquesSlice.reducer;
