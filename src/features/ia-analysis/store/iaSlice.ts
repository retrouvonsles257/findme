/**
 * =====================================================
 * RETROUVONSLES - IA Redux Slice
 * Redux state management for IA analysis
 * Utilise la table resultat_ia selon le modèle de données
 * Note: Les opérations avec fichiers sont gérées directement
 * dans les hooks car File ne peut pas être sérialisé dans Redux
 * =====================================================
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  getFacialRecognitionResults,
  getImageComparisonResults,
  predictLocation,
  getLocationPredictions,
  getSimilaritiesResults,
  ResultatIA,
} from '../services/iaAPI';

// ============================================
// TYPES
// ============================================

export interface IAAnalysisState {
  // Résultats stockés
  facialRecognitionResults: ResultatIA[];
  imageComparisonResults: ResultatIA[];
  locationPredictions: ResultatIA[];
  similaritiesResults: ResultatIA[];

  // Résultat courant
  currentFacialAnalysis: ResultatIA | null;
  currentComparison: ResultatIA | null;
  currentLocationPrediction: ResultatIA | null;
  currentSimilarities: ResultatIA | null;

  // UI state
  loading: boolean;
  error: string | null;
  selectedPersonId: string | null;
  analysisMode: 'facial' | 'comparison' | 'prediction' | 'similarities' | null;
  confidenceThreshold: number;
}

// ============================================
// INPUT TYPES for thunks
// ============================================

interface LocationPredictionInput {
  dossierId: string;
}

// ============================================
// ASYNC THUNKS
// Note: Les analyses avec fichiers sont gérées dans les hooks
// car File ne peut pas être sérialisé dans Redux
// ============================================

export interface FetchIAResultsArg {
  dossierId?: string;
  organisationId?: string;
}

export const fetchFacialRecognitionResults = createAsyncThunk<ResultatIA[], FetchIAResultsArg | string | undefined>(
  'ia/fetchFacialRecognitionResults',
  async (arg) => {
    const dossierId = typeof arg === 'object' && arg?.dossierId !== undefined ? arg.dossierId : typeof arg === 'string' ? arg : undefined;
    const organisationId = typeof arg === 'object' && arg?.organisationId !== undefined ? arg.organisationId : undefined;
    return getFacialRecognitionResults(dossierId, organisationId);
  },
);

export const fetchImageComparisonResults = createAsyncThunk<ResultatIA[], FetchIAResultsArg | string | undefined>(
  'ia/fetchImageComparisonResults',
  async (arg) => {
    const dossierId = typeof arg === 'object' && arg?.dossierId !== undefined ? arg.dossierId : typeof arg === 'string' ? arg : undefined;
    const organisationId = typeof arg === 'object' && arg?.organisationId !== undefined ? arg.organisationId : undefined;
    return getImageComparisonResults(dossierId, organisationId);
  },
);

export const fetchLocationPredictions = createAsyncThunk<ResultatIA[], FetchIAResultsArg | string | undefined>(
  'ia/fetchLocationPredictions',
  async (arg) => {
    const dossierId = typeof arg === 'object' && arg?.dossierId !== undefined ? arg.dossierId : typeof arg === 'string' ? arg : undefined;
    const organisationId = typeof arg === 'object' && arg?.organisationId !== undefined ? arg.organisationId : undefined;
    return getLocationPredictions(dossierId, organisationId);
  },
);

export const performLocationPrediction = createAsyncThunk<ResultatIA, LocationPredictionInput>(
  'ia/performLocationPrediction',
  async ({ dossierId }) => {
    return predictLocation(dossierId);
  },
);

export const fetchSimilaritiesResults = createAsyncThunk<ResultatIA[], FetchIAResultsArg | string | undefined>(
  'ia/fetchSimilaritiesResults',
  async (arg) => {
    const dossierId = typeof arg === 'object' && arg?.dossierId !== undefined ? arg.dossierId : typeof arg === 'string' ? arg : undefined;
    const organisationId = typeof arg === 'object' && arg?.organisationId !== undefined ? arg.organisationId : undefined;
    return getSimilaritiesResults(dossierId, organisationId);
  },
);

// ============================================
// INITIAL STATE
// ============================================

const initialState: IAAnalysisState = {
  facialRecognitionResults: [],
  currentFacialAnalysis: null,
  imageComparisonResults: [],
  currentComparison: null,
  locationPredictions: [],
  currentLocationPrediction: null,
  similaritiesResults: [],
  currentSimilarities: null,
  loading: false,
  error: null,
  selectedPersonId: null,
  analysisMode: null,
  confidenceThreshold: 70,
};

// ============================================
// SLICE
// ============================================

const iaSlice = createSlice({
  name: 'ia',
  initialState,
  reducers: {
    // Actions pour mettre à jour les résultats après une analyse via hook
    addFacialRecognitionResult: (state, action: PayloadAction<ResultatIA>) => {
      state.facialRecognitionResults.unshift(action.payload);
      state.currentFacialAnalysis = action.payload;
    },
    addImageComparisonResult: (state, action: PayloadAction<ResultatIA>) => {
      state.imageComparisonResults.unshift(action.payload);
      state.currentComparison = action.payload;
    },
    addSimilaritiesResult: (state, action: PayloadAction<ResultatIA>) => {
      state.similaritiesResults.unshift(action.payload);
      state.currentSimilarities = action.payload;
    },

    // Setters pour les résultats courants
    setCurrentFacialAnalysis: (state, action: PayloadAction<ResultatIA | null>) => {
      state.currentFacialAnalysis = action.payload;
    },
    setCurrentComparison: (state, action: PayloadAction<ResultatIA | null>) => {
      state.currentComparison = action.payload;
    },
    setCurrentLocationPrediction: (state, action: PayloadAction<ResultatIA | null>) => {
      state.currentLocationPrediction = action.payload;
    },
    setCurrentSimilarities: (state, action: PayloadAction<ResultatIA | null>) => {
      state.currentSimilarities = action.payload;
    },

    // UI state
    setSelectedPersonId: (state, action: PayloadAction<string | null>) => {
      state.selectedPersonId = action.payload;
    },
    setAnalysisMode: (state, action: PayloadAction<IAAnalysisState['analysisMode']>) => {
      state.analysisMode = action.payload;
    },
    setConfidenceThreshold: (state, action: PayloadAction<number>) => {
      state.confidenceThreshold = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetState: () => initialState,
  },
  extraReducers: (builder) => {
    // Facial Recognition Results Fetch
    builder
      .addCase(fetchFacialRecognitionResults.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFacialRecognitionResults.fulfilled, (state, action) => {
        state.loading = false;
        state.facialRecognitionResults = action.payload;
      })
      .addCase(fetchFacialRecognitionResults.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch facial recognition results';
      });

    // Image Comparison Results Fetch
    builder
      .addCase(fetchImageComparisonResults.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchImageComparisonResults.fulfilled, (state, action) => {
        state.loading = false;
        state.imageComparisonResults = action.payload;
      })
      .addCase(fetchImageComparisonResults.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch image comparison results';
      });

    // Location Predictions
    builder
      .addCase(fetchLocationPredictions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLocationPredictions.fulfilled, (state, action) => {
        state.loading = false;
        state.locationPredictions = action.payload;
      })
      .addCase(fetchLocationPredictions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch location predictions';
      })
      .addCase(performLocationPrediction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(performLocationPrediction.fulfilled, (state, action) => {
        state.loading = false;
        state.currentLocationPrediction = action.payload;
        state.locationPredictions.unshift(action.payload);
      })
      .addCase(performLocationPrediction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to perform location prediction';
      });

    // Similarities Results Fetch
    builder
      .addCase(fetchSimilaritiesResults.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSimilaritiesResults.fulfilled, (state, action) => {
        state.loading = false;
        state.similaritiesResults = action.payload;
      })
      .addCase(fetchSimilaritiesResults.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch similarities results';
      });
  },
});

// ============================================
// EXPORTS
// ============================================

export const {
  addFacialRecognitionResult,
  addImageComparisonResult,
  addSimilaritiesResult,
  setCurrentFacialAnalysis,
  setCurrentComparison,
  setCurrentLocationPrediction,
  setCurrentSimilarities,
  setSelectedPersonId,
  setAnalysisMode,
  setConfidenceThreshold,
  setLoading,
  setError,
  clearError,
  resetState,
} = iaSlice.actions;

export default iaSlice.reducer;
