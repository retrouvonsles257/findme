/**
 * =====================================================
 * RETROUVONSLES - Personne Redux Slice
 * Redux state management for personnes
 * =====================================================
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PersonneState, PersonneFilter, Personne, PersonneCreatePayload, PersonneUpdatePayload, LienFiliation } from '../types';
import {
  getPersonnes,
  getPersonneById,
  createPersonne,
  updatePersonne,
  deletePersonne,
  getPersonnePhotos,
  addPersonnePhoto,
  deletePersonnePhoto,
  getPersonneFiliations,
  createFiliation,
  updateFiliation,
  getPersonneStats,
  searchPersonnesByDescription,
} from '../services/personneAPI';

// ============================================
// ASYNC THUNKS
// ============================================

export const fetchPersonnes = createAsyncThunk(
  'personnes/fetchPersonnes',
  async ({ filter, page = 1, pageSize = 20 }: { filter?: PersonneFilter; page?: number; pageSize?: number }) => {
    return getPersonnes(filter, page, pageSize);
  }
);

export const fetchPersonneById = createAsyncThunk(
  'personnes/fetchPersonneById',
  async (id: string) => {
    return getPersonneById(id);
  }
);

export const createNewPersonne = createAsyncThunk<Personne, { payload: PersonneCreatePayload; userId: string }>(
  'personnes/createNew',
  async ({ payload, userId }: { payload: PersonneCreatePayload; userId: string }) => {
    return createPersonne(payload, userId);
  }
);

export const updatePersonneData = createAsyncThunk(
  'personnes/update',
  async ({ id, payload }: { id: string; payload: PersonneUpdatePayload }) => {
    return updatePersonne(id, payload);
  }
);

export const deletePersonneData = createAsyncThunk(
  'personnes/delete',
  async (id: string) => {
    await deletePersonne(id);
    return id;
  }
);

export const fetchPersonnePhotos = createAsyncThunk(
  'personnes/fetchPhotos',
  async (personneId: string) => {
    return getPersonnePhotos(personneId);
  }
);

export const addPersonnePhotoData = createAsyncThunk(
  'personnes/addPhoto',
  async ({ personneId, url, type_photo }: { personneId: string; url: string; type_photo: string }) => {
    return addPersonnePhoto(personneId, url, type_photo);
  }
);

export const deletePersonnePhotoData = createAsyncThunk(
  'personnes/deletePhoto',
  async (photoId: string) => {
    await deletePersonnePhoto(photoId);
    return photoId;
  }
);

export const fetchPersonneFiliations = createAsyncThunk(
  'personnes/fetchFiliations',
  async (personneId: string) => {
    return getPersonneFiliations(personneId);
  }
);

export const createNewFiliation = createAsyncThunk(
  'personnes/createFiliation',
  async (filiation: Omit<LienFiliation, 'id' | 'created_at' | 'updated_at'>) => {
    return createFiliation(filiation);
  }
);

export const updateFiliationData = createAsyncThunk(
  'personnes/updateFiliation',
  async ({ id, updates }: { id: string; updates: Partial<LienFiliation> }) => {
    return updateFiliation(id, updates);
  }
);

export const fetchPersonneStats = createAsyncThunk(
  'personnes/fetchStats',
  async () => {
    return getPersonneStats();
  }
);

export const searchPersonnes = createAsyncThunk(
  'personnes/search',
  async (filter: PersonneFilter) => {
    return searchPersonnesByDescription(filter.search || '');
  }
);

// ============================================
// SLICE
// ============================================

const initialState: PersonneState = {
  personnes: [],
  selectedPersonne: null,
  photos: [],
  filions: [],
  isLoading: false,
  error: null,
  filter: {},
  pagination: {
    currentPage: 1,
    pageSize: 20,
    total: 0,
  },
  stats: null,
};

export const personneSlice = createSlice({
  name: 'personnes',
  initialState,
  reducers: {
    setSelectedPersonne: (state, action) => {
      state.selectedPersonne = action.payload;
    },
    setFilter: (state, action) => {
      state.filter = action.payload;
      state.pagination.currentPage = 1;
    },
    setCurrentPage: (state, action) => {
      state.pagination.currentPage = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetPersonneState: () => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    // fetchPersonnes
    builder
      .addCase(fetchPersonnes.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPersonnes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.personnes = action.payload.data;
        state.pagination.total = action.payload.total;
      })
      .addCase(fetchPersonnes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch personnes';
      });

    // fetchPersonneById
    builder
      .addCase(fetchPersonneById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPersonneById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedPersonne = action.payload;
      })
      .addCase(fetchPersonneById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch personne';
      });

    // createNewPersonne
    builder
      .addCase(createNewPersonne.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createNewPersonne.fulfilled, (state, action) => {
        state.isLoading = false;
        state.personnes.unshift(action.payload);
        state.selectedPersonne = action.payload;
        state.pagination.total += 1;
      })
      .addCase(createNewPersonne.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to create personne';
      });

    // updatePersonneData
    builder
      .addCase(updatePersonneData.fulfilled, (state, action) => {
        const index = state.personnes.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.personnes[index] = action.payload;
        }
        if (state.selectedPersonne?.id === action.payload.id) {
          state.selectedPersonne = action.payload;
        }
      });

    // deletePersonneData
    builder
      .addCase(deletePersonneData.fulfilled, (state, action) => {
        state.personnes = state.personnes.filter((p) => p.id !== action.payload);
        if (state.selectedPersonne?.id === action.payload) {
          state.selectedPersonne = null;
        }
        state.pagination.total -= 1;
      });

    // fetchPersonnePhotos
    builder
      .addCase(fetchPersonnePhotos.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchPersonnePhotos.fulfilled, (state, action) => {
        state.isLoading = false;
        state.photos = action.payload;
      })
      .addCase(fetchPersonnePhotos.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch photos';
      });

    // addPersonnePhotoData
    builder
      .addCase(addPersonnePhotoData.fulfilled, (state, action) => {
        state.photos.push(action.payload);
      });

    // deletePersonnePhotoData
    builder
      .addCase(deletePersonnePhotoData.fulfilled, (state, action) => {
        state.photos = state.photos.filter((p) => p.id !== action.payload);
      });

    // fetchPersonneFiliations
    builder
      .addCase(fetchPersonneFiliations.fulfilled, (state, action) => {
        state.filions = action.payload;
      });

    // createNewFiliation
    builder
      .addCase(createNewFiliation.fulfilled, (state, action) => {
        state.filions.push(action.payload);
      });

    // updateFiliationData
    builder
      .addCase(updateFiliationData.fulfilled, (state, action) => {
        const index = state.filions.findIndex((f) => f.id === action.payload.id);
        if (index !== -1) {
          state.filions[index] = action.payload;
        }
      });

    // fetchPersonneStats
    builder
      .addCase(fetchPersonneStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });

    // searchPersonnes
    builder
      .addCase(searchPersonnes.fulfilled, (state, action) => {
        state.personnes = action.payload;
      });
  },
});

export const { setSelectedPersonne, setFilter, setCurrentPage, clearError, resetPersonneState } =
  personneSlice.actions;

export default personneSlice.reducer;
