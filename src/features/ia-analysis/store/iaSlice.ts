/**
 * =====================================================
 * RETROUVONSLES - IA Redux Slice
 * Redux state management for IA analysis
 * =====================================================
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { IAAnalysisState, FacialRecognitionResult, LocationPredictionResult } from '../types';
import {
  analyzeFacialImage,
  getFacialRecognitionResults,
  compareImages,
  getImageComparisonResults,
  predictLocation,
  getLocationPredictions,
  detectSimilarities,
  getSimilaritiesResults,
} from '../services/iaAPI';
import type {
  FacialRecognitionFormData,
  ImageComparisonFormData,
  LocationPredictionFormData,
  SimilaritiesDetectionFormData,
} from '../types';

// ============================================
// ASYNC THUNKS
// ============================================

export const fetchFacialRecognitionResults = createAsyncThunk<FacialRecognitionResult[], string | undefined>(
  'ia/fetchFacialRecognitionResults',
  async (personId?: string) => {
    return getFacialRecognitionResults(personId);
  },
);

export const performFacialAnalysis = createAsyncThunk<FacialRecognitionResult, FacialRecognitionFormData>(
  'ia/performFacialAnalysis',
  async (data: FacialRecognitionFormData) => {
    return analyzeFacialImage(data);
  },
);

export const fetchImageComparisonResults = createAsyncThunk(
  'ia/fetchImageComparisonResults',
  async () => {
    return getImageComparisonResults();
  },
);

export const performImageComparison = createAsyncThunk(
  'ia/performImageComparison',
  async (data: ImageComparisonFormData) => {
    return compareImages(data);
  },
);

export const fetchLocationPredictions = createAsyncThunk<LocationPredictionResult[], string | undefined>(
  'ia/fetchLocationPredictions',
  async (personId?: string) => {
    return getLocationPredictions(personId);
  },
);

export const performLocationPrediction = createAsyncThunk<LocationPredictionResult, LocationPredictionFormData>(
  'ia/performLocationPrediction',
  async (data: LocationPredictionFormData) => {
    return predictLocation(data);
  },
);

export const fetchSimilaritiesResults = createAsyncThunk(
  'ia/fetchSimilaritiesResults',
  async () => {
    return getSimilaritiesResults();
  },
);

export const performSimilaritiesDetection = createAsyncThunk(
  'ia/performSimilaritiesDetection',
  async (data: SimilaritiesDetectionFormData) => {
    return detectSimilarities(data);
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
    setCurrentFacialAnalysis: (state, action) => {
      state.currentFacialAnalysis = action.payload;
    },
    setCurrentComparison: (state, action) => {
      state.currentComparison = action.payload;
    },
    setCurrentLocationPrediction: (state, action) => {
      state.currentLocationPrediction = action.payload;
    },
    setCurrentSimilarities: (state, action) => {
      state.currentSimilarities = action.payload;
    },
    setSelectedPersonId: (state, action) => {
      state.selectedPersonId = action.payload;
    },
    setAnalysisMode: (state, action) => {
      state.analysisMode = action.payload;
    },
    setConfidenceThreshold: (state, action) => {
      state.confidenceThreshold = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetState: () => initialState,
  },
  extraReducers: (builder) => {
    // Facial Recognition
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

    builder
      .addCase(performFacialAnalysis.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(performFacialAnalysis.fulfilled, (state, action) => {
        state.loading = false;
        state.currentFacialAnalysis = action.payload;
        state.facialRecognitionResults.unshift(action.payload);
      })
      .addCase(performFacialAnalysis.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to perform facial analysis';
      });

    // Image Comparison
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

    builder
      .addCase(performImageComparison.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(performImageComparison.fulfilled, (state, action) => {
        state.loading = false;
        state.currentComparison = action.payload;
        state.imageComparisonResults.unshift(action.payload);
      })
      .addCase(performImageComparison.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to perform image comparison';
      });

    // Location Prediction
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
      });

    builder
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

    // Similarities Detection
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

    builder
      .addCase(performSimilaritiesDetection.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(performSimilaritiesDetection.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSimilarities = action.payload;
        state.similaritiesResults.unshift(action.payload);
      })
      .addCase(performSimilaritiesDetection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to perform similarities detection';
      });
  },
});

export const {
  setCurrentFacialAnalysis,
  setCurrentComparison,
  setCurrentLocationPrediction,
  setCurrentSimilarities,
  setSelectedPersonId,
  setAnalysisMode,
  setConfidenceThreshold,
  clearError,
  resetState,
} = iaSlice.actions;

export default iaSlice.reducer;
export { iaSlice };
