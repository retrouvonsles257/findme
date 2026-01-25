/**
 * =====================================================
 * RETROUVONSLES - Geolocation Redux Slice
 * Redux state management for geolocation
 * =====================================================
 */

// @ts-ignore - @reduxjs/toolkit includes its own types
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { GeolocationState, LocationDatabase, CurrentLocation } from '../types';
import * as geolocationAPI from '../services/geolocationAPI';

const initialState: GeolocationState = {
  currentLocation: null,
  locationHistory: [],
  selectedLocation: null,
  isTracking: false,
  trackingPermission: 'unknown',
  proximityAlerts: [],
  proximityZones: [],
  activeAlerts: [],
  loading: false,
  error: null,
  filters: {},
};

// ============================================
// ASYNC THUNKS
// ============================================

export const fetchLocationsByDossier = createAsyncThunk(
  'geolocation/fetchLocationsByDossier',
  async (idDossier: string, { rejectWithValue }: any) => {
    try {
      const locations = await geolocationAPI.getLocationsByDossier(idDossier);
      return locations;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchLocationsByType = createAsyncThunk(
  'geolocation/fetchLocationsByType',
  async (type: string, { rejectWithValue }: any) => {
    try {
      const locations = await geolocationAPI.getLocationsByType(type);
      return locations;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchNearbyLocations = createAsyncThunk(
  'geolocation/fetchNearbyLocations',
  async (
    { latitude, longitude, radiusKm }: { latitude: number; longitude: number; radiusKm: number },
    { rejectWithValue }: any,
  ) => {
    try {
      const locations = await geolocationAPI.getLocationsNearby(latitude, longitude, radiusKm);
      return locations;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const createNewLocation = createAsyncThunk(
  'geolocation/createNewLocation',
  async (input: any, { rejectWithValue }: any) => {
    try {
      const location = await geolocationAPI.createLocation(input);
      return location;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const updateLocationThunk = createAsyncThunk(
  'geolocation/updateLocation',
  async ({ id, input }: { id: string; input: any }, { rejectWithValue }: any) => {
    try {
      const location = await geolocationAPI.updateLocation(id, input);
      return location;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const deleteLocationThunk = createAsyncThunk(
  'geolocation/deleteLocation',
  async (id: string, { rejectWithValue }: any) => {
    try {
      await geolocationAPI.deleteLocation(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchProximityZones = createAsyncThunk(
  'geolocation/fetchProximityZones',
  async (_: undefined, { rejectWithValue }: any) => {
    try {
      const zones = await geolocationAPI.getProximityZones();
      return zones;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchAlerts = createAsyncThunk(
  'geolocation/fetchAlerts',
  async (_: undefined, { rejectWithValue }: any) => {
    try {
      const alerts = await geolocationAPI.getAlerts();
      return alerts;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

// ============================================
// SLICE DEFINITION
// ============================================

const geolocationSlice = createSlice({
  name: 'geolocation',
  initialState,
  reducers: {
    setCurrentLocation: (state: GeolocationState, action: PayloadAction<CurrentLocation | null>) => {
      state.currentLocation = action.payload;
    },
    setSelectedLocation: (state: GeolocationState, action: PayloadAction<any>) => {
      state.selectedLocation = action.payload;
    },
    setTracking: (state: GeolocationState, action: PayloadAction<boolean>) => {
      state.isTracking = action.payload;
    },
    setTrackingPermission: (
      state: GeolocationState,
      action: PayloadAction<'granted' | 'denied' | 'prompt' | 'unknown'>,
    ) => {
      state.trackingPermission = action.payload;
    },
    setFilters: (state: GeolocationState, action: PayloadAction<any>) => {
      state.filters = action.payload;
    },
    dismissAlert: (state: GeolocationState, action: PayloadAction<string>) => {
      state.activeAlerts = state.activeAlerts.filter((id) => id !== action.payload);
    },
    clearError: (state: GeolocationState) => {
      state.error = null;
    },
    resetState: () => initialState,
  },
  extraReducers: (builder: any) => {
    // Fetch locations by dossier
    builder
      .addCase(fetchLocationsByDossier.pending, (state: GeolocationState) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLocationsByDossier.fulfilled, (state: GeolocationState, action: any) => {
        state.loading = false;
        state.locationHistory = action.payload;
      })
      .addCase(fetchLocationsByDossier.rejected, (state: GeolocationState, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch locations by type
    builder
      .addCase(fetchLocationsByType.pending, (state: GeolocationState) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLocationsByType.fulfilled, (state: GeolocationState, action: any) => {
        state.loading = false;
        state.locationHistory = action.payload;
      })
      .addCase(fetchLocationsByType.rejected, (state: GeolocationState, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch nearby locations
    builder
      .addCase(fetchNearbyLocations.pending, (state: GeolocationState) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNearbyLocations.fulfilled, (state: GeolocationState, action: any) => {
        state.loading = false;
        state.locationHistory = action.payload;
      })
      .addCase(fetchNearbyLocations.rejected, (state: GeolocationState, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create location
    builder
      .addCase(createNewLocation.pending, (state: GeolocationState) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createNewLocation.fulfilled, (state: GeolocationState, action: any) => {
        state.loading = false;
        state.locationHistory.push(action.payload);
      })
      .addCase(createNewLocation.rejected, (state: GeolocationState, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update location
    builder
      .addCase(updateLocationThunk.pending, (state: GeolocationState) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateLocationThunk.fulfilled, (state: GeolocationState, action: any) => {
        state.loading = false;
        const index = state.locationHistory.findIndex((l: LocationDatabase) => l.id === action.payload.id);
        if (index !== -1) {
          state.locationHistory[index] = action.payload;
        }
      })
      .addCase(updateLocationThunk.rejected, (state: GeolocationState, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete location
    builder
      .addCase(deleteLocationThunk.pending, (state: GeolocationState) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteLocationThunk.fulfilled, (state: GeolocationState, action: any) => {
        state.loading = false;
        state.locationHistory = state.locationHistory.filter(
          (l: LocationDatabase) => l.id !== action.payload,
        );
      })
      .addCase(deleteLocationThunk.rejected, (state: GeolocationState, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch proximity zones
    builder
      .addCase(fetchProximityZones.pending, (state: GeolocationState) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProximityZones.fulfilled, (state: GeolocationState, action: any) => {
        state.loading = false;
        state.proximityZones = action.payload;
      })
      .addCase(fetchProximityZones.rejected, (state: GeolocationState, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch alerts
    builder
      .addCase(fetchAlerts.pending, (state: GeolocationState) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAlerts.fulfilled, (state: GeolocationState, action: any) => {
        state.loading = false;
        state.proximityAlerts = action.payload;
      })
      .addCase(fetchAlerts.rejected, (state: GeolocationState, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setCurrentLocation,
  setSelectedLocation,
  setTracking,
  setTrackingPermission,
  setFilters,
  dismissAlert,
  clearError,
  resetState,
} = geolocationSlice.actions;

export default geolocationSlice.reducer;
