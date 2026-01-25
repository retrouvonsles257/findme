/**
 * =====================================================
 * RETROUVONSLES - Organisation Redux Slice
 * Redux state management for organisations
 * =====================================================
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { OrganisationState, OrganisationFilter } from '../types';
import {
  getOrganisations,
  getOrganisationById,
  createOrganisation,
  updateOrganisation,
  deleteOrganisation,
  getOrganisationMembers,
  addOrganisationMember,
  updateOrganisationMember,
  removeOrganisationMember,
  getOrganisationStats,
  getOrganisationSettings,
  updateOrganisationSettings,
  getUserOrganisations,
} from '../services/organisationAPI';
import type {
  OrganisationCreatePayload,
  OrganisationUpdatePayload,
  OrganisationMemberCreatePayload,
  OrganisationMemberUpdatePayload,
} from '../types';

// ============================================
// ASYNC THUNKS
// ============================================

export const fetchOrganisations = createAsyncThunk(
  'organisations/fetchOrganisations',
  async ({ filter, page = 1, pageSize = 20 }: { filter?: OrganisationFilter; page?: number; pageSize?: number }) => {
    return getOrganisations(filter, page, pageSize);
  }
);

export const fetchOrganisationById = createAsyncThunk(
  'organisations/fetchOrganisationById',
  async (id: string) => {
    return getOrganisationById(id);
  }
);

export const createNewOrganisation = createAsyncThunk(
  'organisations/createNew',
  async ({ payload, userId }: { payload: OrganisationCreatePayload; userId: string }) => {
    return createOrganisation(payload, userId);
  }
);

export const updateOrganisationData = createAsyncThunk(
  'organisations/update',
  async ({ id, payload }: { id: string; payload: OrganisationUpdatePayload }) => {
    return updateOrganisation(id, payload);
  }
);

export const deleteOrganisationData = createAsyncThunk(
  'organisations/delete',
  async (id: string) => {
    await deleteOrganisation(id);
    return id;
  }
);

export const fetchMembers = createAsyncThunk(
  'organisations/fetchMembers',
  async (organisationId: string) => {
    return getOrganisationMembers(organisationId);
  }
);

export const addMember = createAsyncThunk(
  'organisations/addMember',
  async ({ organisationId, payload }: { organisationId: string; payload: OrganisationMemberCreatePayload }) => {
    return addOrganisationMember(organisationId, payload);
  }
);

export const updateMember = createAsyncThunk(
  'organisations/updateMember',
  async ({ memberId, payload }: { memberId: string; payload: OrganisationMemberUpdatePayload }) => {
    return updateOrganisationMember(memberId, payload);
  }
);

export const removeMember = createAsyncThunk(
  'organisations/removeMember',
  async (memberId: string) => {
    await removeOrganisationMember(memberId);
    return memberId;
  }
);

export const fetchStats = createAsyncThunk(
  'organisations/fetchStats',
  async (organisationId: string) => {
    return getOrganisationStats(organisationId);
  }
);

export const fetchSettings = createAsyncThunk(
  'organisations/fetchSettings',
  async (organisationId: string) => {
    return getOrganisationSettings(organisationId);
  }
);

export const updateSettings = createAsyncThunk(
  'organisations/updateSettings',
  async ({ organisationId, settings }: any) => {
    return updateOrganisationSettings(organisationId, settings);
  }
);

export const fetchUserOrganisations = createAsyncThunk(
  'organisations/fetchUserOrganisations',
  async (userId: string) => {
    return getUserOrganisations(userId);
  }
);

// ============================================
// SLICE
// ============================================

const initialState: OrganisationState = {
  organisations: [],
  selectedOrganisation: null,
  members: [],
  stats: null,
  settings: null,
  isLoading: false,
  error: null,
  filter: {},
  pagination: {
    currentPage: 1,
    pageSize: 20,
    total: 0,
  },
};

export const organisationSlice = createSlice({
  name: 'organisations',
  initialState,
  reducers: {
    setSelectedOrganisation: (state, action) => {
      state.selectedOrganisation = action.payload;
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
    resetOrganisationState: () => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    // fetchOrganisations
    builder
      .addCase(fetchOrganisations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrganisations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.organisations = action.payload.data;
        state.pagination.total = action.payload.total;
      })
      .addCase(fetchOrganisations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch organisations';
      });

    // fetchOrganisationById
    builder
      .addCase(fetchOrganisationById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrganisationById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedOrganisation = action.payload;
      })
      .addCase(fetchOrganisationById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch organisation';
      });

    // createNewOrganisation
    builder
      .addCase(createNewOrganisation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createNewOrganisation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.organisations.unshift(action.payload);
        state.selectedOrganisation = action.payload;
        state.pagination.total += 1;
      })
      .addCase(createNewOrganisation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to create organisation';
      });

    // updateOrganisationData
    builder
      .addCase(updateOrganisationData.fulfilled, (state, action) => {
        const index = state.organisations.findIndex((o) => o.id === action.payload.id);
        if (index !== -1) {
          state.organisations[index] = action.payload;
        }
        if (state.selectedOrganisation?.id === action.payload.id) {
          state.selectedOrganisation = action.payload;
        }
      });

    // deleteOrganisationData
    builder
      .addCase(deleteOrganisationData.fulfilled, (state, action) => {
        state.organisations = state.organisations.filter((o) => o.id !== action.payload);
        if (state.selectedOrganisation?.id === action.payload) {
          state.selectedOrganisation = null;
        }
        state.pagination.total -= 1;
      });

    // fetchMembers
    builder
      .addCase(fetchMembers.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMembers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.members = action.payload;
      })
      .addCase(fetchMembers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch members';
      });

    // addMember
    builder
      .addCase(addMember.fulfilled, (state, action) => {
        state.members.push(action.payload);
        if (state.selectedOrganisation) {
          state.selectedOrganisation.member_count += 1;
        }
      });

    // updateMember
    builder
      .addCase(updateMember.fulfilled, (state, action) => {
        const index = state.members.findIndex((m) => m.id === action.payload.id);
        if (index !== -1) {
          state.members[index] = action.payload;
        }
      });

    // removeMember
    builder
      .addCase(removeMember.fulfilled, (state, action) => {
        state.members = state.members.filter((m) => m.id !== action.payload);
        if (state.selectedOrganisation) {
          state.selectedOrganisation.member_count = Math.max(0, state.selectedOrganisation.member_count - 1);
        }
      });

    // fetchStats
    builder
      .addCase(fetchStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });

    // fetchSettings
    builder
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
      });

    // updateSettings
    builder
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
      });

    // fetchUserOrganisations
    builder
      .addCase(fetchUserOrganisations.fulfilled, (state, action) => {
        state.organisations = action.payload;
        state.pagination.total = action.payload.length;
      });
  },
});

export const { setSelectedOrganisation, setFilter, setCurrentPage, clearError, resetOrganisationState } =
  organisationSlice.actions;

export default organisationSlice.reducer;
