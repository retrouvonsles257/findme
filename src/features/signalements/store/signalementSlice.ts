/**
 * =====================================================
 * RETROUVONSLES - Signalement Redux Slice
 * Redux state management for signalements
 * =====================================================
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { SignalementState, SignalementFilter } from '../types';
import {
  getSignalements,
  getSignalementById,
  createSignalement,
  updateSignalement,
  deleteSignalement,
  searchSignalements,
  getSignalementContacts,
  addSignalementContact,
  deleteSignalementContact,
  getSignalementVerifications,
  addSignalementVerification,
  getSignalementStats,
} from '../services/signalementAPI';

// ============================================
// THUNKS
// ============================================

export const fetchSignalements = createAsyncThunk(
  'signalements/fetchAll',
  async ({ filter, page }: { filter?: SignalementFilter; page?: number } = {}) => {
    return getSignalements(page || 1, 20, filter);
  }
);

export const fetchSignalementById = createAsyncThunk(
  'signalements/fetchById',
  async (id: string) => {
    return getSignalementById(id);
  }
);

export const createNewSignalement = createAsyncThunk(
  'signalements/createNew',
  async ({ payload, userId }: { payload: any; userId: string }) => {
    return createSignalement(payload, userId);
  }
);

export const updateSignalementData = createAsyncThunk(
  'signalements/update',
  async ({ id, payload }: { id: string; payload: any }) => {
    return updateSignalement(id, payload);
  }
);

export const deleteSignalementData = createAsyncThunk(
  'signalements/delete',
  async (id: string) => {
    await deleteSignalement(id);
    return id;
  }
);

export const searchSignalementsData = createAsyncThunk(
  'signalements/search',
  async (filter: SignalementFilter) => {
    return searchSignalements(filter.search || '');
  }
);

export const fetchSignalementContacts = createAsyncThunk(
  'signalements/fetchContacts',
  async (signalementId: string) => {
    return getSignalementContacts(signalementId);
  }
);

export const addSignalementContactData = createAsyncThunk(
  'signalements/addContact',
  async ({ signalementId, contact }: { signalementId: string; contact: any }) => {
    return addSignalementContact(signalementId, contact);
  }
);

export const deleteSignalementContactData = createAsyncThunk(
  'signalements/deleteContact',
  async (contactId: string) => {
    await deleteSignalementContact(contactId);
    return contactId;
  }
);

export const fetchSignalementVerifications = createAsyncThunk(
  'signalements/fetchVerifications',
  async (signalementId: string) => {
    return getSignalementVerifications(signalementId);
  }
);

export const addSignalementVerificationData = createAsyncThunk(
  'signalements/addVerification',
  async ({ signalementId, verificateurId, payload }: { signalementId: string; verificateurId: string; payload: any }) => {
    return addSignalementVerification(signalementId, verificateurId, payload);
  }
);

export const fetchSignalementStats = createAsyncThunk('signalements/fetchStats', async () => {
  return getSignalementStats();
});

// ============================================
// SLICE
// ============================================

const initialState: SignalementState = {
  signalements: [],
  selectedSignalement: null,
  isLoading: false,
  error: null,
  pagination: {
    currentPage: 1,
    pageSize: 20,
    total: 0,
  },
  stats: null,
};

const signalementSlice = createSlice({
  name: 'signalements',
  initialState,
  reducers: {
    clearSelectedSignalement: (state) => {
      state.selectedSignalement = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchSignalements
    builder
      .addCase(fetchSignalements.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSignalements.fulfilled, (state, action) => {
        state.isLoading = false;
        state.signalements = action.payload.data;
        state.pagination.total = action.payload.total;
      })
      .addCase(fetchSignalements.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch signalements';
      });

    // fetchSignalementById
    builder
      .addCase(fetchSignalementById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSignalementById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedSignalement = action.payload;
      })
      .addCase(fetchSignalementById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch signalement';
      });

    // createNewSignalement
    builder
      .addCase(createNewSignalement.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createNewSignalement.fulfilled, (state, action) => {
        state.isLoading = false;
        state.signalements.unshift(action.payload);
      })
      .addCase(createNewSignalement.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to create signalement';
      });

    // updateSignalementData
    builder
      .addCase(updateSignalementData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateSignalementData.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.signalements.findIndex((s) => s.id === action.payload.id);
        if (index > -1) {
          state.signalements[index] = action.payload;
        }
        if (state.selectedSignalement?.id === action.payload.id) {
          state.selectedSignalement = action.payload;
        }
      })
      .addCase(updateSignalementData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to update signalement';
      });

    // deleteSignalementData
    builder
      .addCase(deleteSignalementData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteSignalementData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.signalements = state.signalements.filter((s) => s.id !== action.payload);
        if (state.selectedSignalement?.id === action.payload) {
          state.selectedSignalement = null;
        }
      })
      .addCase(deleteSignalementData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to delete signalement';
      });

    // searchSignalementsData
    builder
      .addCase(searchSignalementsData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchSignalementsData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.signalements = action.payload;
      })
      .addCase(searchSignalementsData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to search signalements';
      });

    // fetchSignalementStats
    builder
      .addCase(fetchSignalementStats.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchSignalementStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchSignalementStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch stats';
      });
  },
});

export const { clearSelectedSignalement, clearError } = signalementSlice.actions;
export const signalementReducer = signalementSlice.reducer;
