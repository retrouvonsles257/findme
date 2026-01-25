/**
 * =====================================================
 * RETROUVONSLES - Filiation Redux Slice
 * Redux state management for filiation
 * =====================================================
 */

// @ts-ignore - @reduxjs/toolkit includes its own types
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { FiliationState, FiliationLienDisplay } from '../types';
import * as filiationService from '../services';

const initialState: FiliationState = {
  liens: [],
  loading: false,
  error: null,
  currentTree: null,
  statistiques: null,
  selectedLien: null,
  filters: {},
};

// Async thunks
export const fetchFiliationLiens = createAsyncThunk(
  'filiation/fetchLiens',
  async (idPersonne: string, { rejectWithValue }: any) => {
    try {
      const liens = await filiationService.getFiliationLiensByPersonne(idPersonne);
      return liens;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchFamilyTree = createAsyncThunk(
  'filiation/fetchTree',
  async (idPersonne: string, { rejectWithValue }: any) => {
    try {
      const tree = await filiationService.buildFamilyTree(idPersonne);
      return tree;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchFiliationStatistics = createAsyncThunk(
  'filiation/fetchStatistics',
  async (_: undefined, { rejectWithValue }: any) => {
    try {
      const stats = await filiationService.getFiliationStatistics();
      return stats;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const createNewFiliationLien = createAsyncThunk(
  'filiation/createLien',
  async (input: any, { rejectWithValue }: any) => {
    try {
      const lien = await filiationService.createFiliationLink(input);
      return lien;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const updateFiliationLien = createAsyncThunk(
  'filiation/updateLien',
  async ({ id, input }: { id: string; input: any }, { rejectWithValue }: any) => {
    try {
      const lien = await filiationService.updateFiliationLien(id, input);
      return lien;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const deleteFiliationLien = createAsyncThunk(
  'filiation/deleteLien',
  async (id: string, { rejectWithValue }: any) => {
    try {
      await filiationService.deleteFiliationLien(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

const filiationSlice = createSlice({
  name: 'filiation',
  initialState,
  reducers: {
    setSelectedLien: (state: FiliationState, action: PayloadAction<FiliationLienDisplay | null>) => {
      state.selectedLien = action.payload;
    },
    setFilters: (state: FiliationState, action: PayloadAction<any>) => {
      state.filters = action.payload;
    },
    clearError: (state: FiliationState) => {
      state.error = null;
    },
    resetState: () => initialState,
  },
  extraReducers: (builder: any) => {
    // Fetch liens
    builder
      .addCase(fetchFiliationLiens.pending, (state: FiliationState) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFiliationLiens.fulfilled, (state: FiliationState, action: any) => {
        state.loading = false;
        state.liens = action.payload;
      })
      .addCase(fetchFiliationLiens.rejected, (state: FiliationState, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch tree
    builder
      .addCase(fetchFamilyTree.pending, (state: FiliationState) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFamilyTree.fulfilled, (state: FiliationState, action: any) => {
        state.loading = false;
        state.currentTree = action.payload;
      })
      .addCase(fetchFamilyTree.rejected, (state: FiliationState, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch statistics
    builder
      .addCase(fetchFiliationStatistics.pending, (state: FiliationState) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFiliationStatistics.fulfilled, (state: FiliationState, action: any) => {
        state.loading = false;
        state.statistiques = action.payload;
      })
      .addCase(fetchFiliationStatistics.rejected, (state: FiliationState, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create lien
    builder
      .addCase(createNewFiliationLien.pending, (state: FiliationState) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createNewFiliationLien.fulfilled, (state: FiliationState, action: any) => {
        state.loading = false;
        state.liens.push(action.payload);
      })
      .addCase(createNewFiliationLien.rejected, (state: FiliationState, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update lien
    builder
      .addCase(updateFiliationLien.pending, (state: FiliationState) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateFiliationLien.fulfilled, (state: FiliationState, action: any) => {
        state.loading = false;
        const index = state.liens.findIndex((l: FiliationLienDisplay) => l.id === action.payload.id);
        if (index !== -1) {
          state.liens[index] = action.payload;
        }
      })
      .addCase(updateFiliationLien.rejected, (state: FiliationState, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete lien
    builder
      .addCase(deleteFiliationLien.pending, (state: FiliationState) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteFiliationLien.fulfilled, (state: FiliationState, action: any) => {
        state.loading = false;
        state.liens = state.liens.filter((l: FiliationLienDisplay) => l.id !== action.payload);
      })
      .addCase(deleteFiliationLien.rejected, (state: FiliationState, action: any) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSelectedLien, setFilters, clearError, resetState } = filiationSlice.actions;

export default filiationSlice.reducer;
