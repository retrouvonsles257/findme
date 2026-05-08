/**
 * =====================================================
 * RETROUVONSLES - Users Redux Slice
 * Redux store for users feature
 * =====================================================
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type {
  UserState,
  UserProfile,
  UserPreferences,
  UserFilter,
  UserCreatePayload,
  UserUpdatePayload,
  UserPreferencesUpdatePayload,
} from '../types';
import {
  getAllUsers,
  getUserById,
  searchUsers,
  createUser,
  updateUser,
  deleteUser,
  updateUserPreferences,
  getUserActivity,
  getUserStats,
  suspendUser,
  activateUser,
  getUsersByRole,
  getUsersByOrganization,
} from '../services';
import {
  loginThunk,
  logoutThunk,
  restoreSessionThunk,
  signInAnonymousThunk,
  upgradeAnonymousThunk,
} from '../../auth/store/authThunks';

// ============================================
// ASYNC THUNKS
// ============================================

export const fetchAllUsers = createAsyncThunk(
  'users/fetchAll',
  async (filter: UserFilter | undefined, { rejectWithValue }) => {
    try {
      const result = await getAllUsers(filter);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserById = createAsyncThunk(
  'users/fetchById',
  async (userId: string, { rejectWithValue }) => {
    try {
      const user = await getUserById(userId);
      return user;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const searchUsersList = createAsyncThunk(
  'users/search',
  async (query: string, { rejectWithValue }) => {
    try {
      const users = await searchUsers(query);
      return users;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createNewUser = createAsyncThunk(
  'users/create',
  async (payload: UserCreatePayload, { rejectWithValue }) => {
    try {
      const user = await createUser(payload);
      return user;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'users/update',
  async ({ userId, payload }: { userId: string; payload: UserUpdatePayload }, { rejectWithValue }) => {
    try {
      const user = await updateUser(userId, payload);
      return user;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteUserAccount = createAsyncThunk(
  'users/delete',
  async (userId: string, { rejectWithValue }) => {
    try {
      const success = await deleteUser(userId);
      return success ? userId : null;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateUserPrefs = createAsyncThunk<
  UserPreferences,
  { userId: string; payload: UserPreferencesUpdatePayload },
  { rejectValue: string }
>(
  'users/updatePreferences',
  async (
    { userId, payload }: { userId: string; payload: UserPreferencesUpdatePayload },
    { rejectWithValue }
  ) => {
    try {
      const prefs = await updateUserPreferences(userId, payload);
      return prefs;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserActivityLog = createAsyncThunk(
  'users/fetchActivity',
  async (userId: string, { rejectWithValue }) => {
    try {
      const activities = await getUserActivity(userId);
      return activities;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserStatistics = createAsyncThunk(
  'users/fetchStats',
  async (userId: string, { rejectWithValue }) => {
    try {
      const stats = await getUserStats(userId);
      return stats;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const suspendUserAccount = createAsyncThunk(
  'users/suspend',
  async ({ userId, raison }: { userId: string; raison?: string }, { rejectWithValue }) => {
    try {
      const user = await suspendUser(userId, raison);
      return user;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const activateUserAccount = createAsyncThunk(
  'users/activate',
  async (userId: string, { rejectWithValue }) => {
    try {
      const user = await activateUser(userId);
      return user;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUsersByRole = createAsyncThunk(
  'users/fetchByRole',
  async (role: string, { rejectWithValue }) => {
    try {
      const users = await getUsersByRole(role);
      return users;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUsersByOrganization = createAsyncThunk(
  'users/fetchByOrganization',
  async (organizationId: string, { rejectWithValue }) => {
    try {
      const users = await getUsersByOrganization(organizationId);
      return users;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// ============================================
// INITIAL STATE
// ============================================

const initialState: UserState = {
  users: [],
  selectedUser: null,
  currentUser: null,
  roles: [],
  activities: [],
  stats: [],
  preferences: null,
  isLoading: false,
  error: null,
  filter: {},
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
};

// ============================================
// SLICE
// ============================================

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilter: (state, action: PayloadAction<UserFilter>) => {
      state.filter = action.payload;
    },
    setPagination: (
      state,
      action: PayloadAction<{
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      }>
    ) => {
      state.pagination = action.payload;
    },
    selectUser: (state, action: PayloadAction<UserProfile | null>) => {
      state.selectedUser = action.payload;
    },
    setCurrentUser: (state, action: PayloadAction<UserProfile | null>) => {
      state.currentUser = action.payload;
    },
    clearUsers: (state) => {
      state.users = [];
      state.selectedUser = null;
      state.currentUser = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch all users
    builder
      .addCase(fetchAllUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = action.payload.users;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          totalPages: Math.ceil(action.payload.total / action.payload.limit),
        };
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch user by ID
    builder
      .addCase(fetchUserById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedUser = action.payload;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Search users
    builder
      .addCase(searchUsersList.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchUsersList.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = action.payload;
      })
      .addCase(searchUsersList.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create user
    builder
      .addCase(createNewUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createNewUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users.push(action.payload);
      })
      .addCase(createNewUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update user
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.users.findIndex((u) => u.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        if (state.selectedUser?.id === action.payload.id) {
          state.selectedUser = action.payload;
        }
        if (state.currentUser?.id === action.payload.id) {
          state.currentUser = action.payload;
        }
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Delete user
    builder
      .addCase(deleteUserAccount.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteUserAccount.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = state.users.filter((u) => u.id !== action.payload);
        if (state.selectedUser?.id === action.payload) {
          state.selectedUser = null;
        }
      })
      .addCase(deleteUserAccount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update preferences
    builder
      .addCase(updateUserPrefs.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateUserPrefs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.preferences = action.payload as any;
      })
      .addCase(updateUserPrefs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch activity
    builder
      .addCase(fetchUserActivityLog.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchUserActivityLog.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activities = action.payload;
      })
      .addCase(fetchUserActivityLog.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch stats
    builder
      .addCase(fetchUserStatistics.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchUserStatistics.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          const index = state.stats.findIndex((s) => s.user_id === (action.payload as any).user_id);
          if (index !== -1) {
            state.stats[index] = action.payload;
          } else {
            state.stats.push(action.payload);
          }
        }
      })
      .addCase(fetchUserStatistics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Suspend/Activate
    builder
      .addCase(suspendUserAccount.fulfilled, (state, action) => {
        const index = state.users.findIndex((u) => u.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      })
      .addCase(activateUserAccount.fulfilled, (state, action) => {
        const index = state.users.findIndex((u) => u.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      });

    // Fetch by role
    builder
      .addCase(fetchUsersByRole.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchUsersByRole.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsersByRole.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch by organization
    builder
      .addCase(fetchUsersByOrganization.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchUsersByOrganization.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsersByOrganization.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ============================================
    // AUTH THUNKS - Sync currentUser with auth state
    // ============================================

    // Login success - set currentUser
    builder.addCase(loginThunk.fulfilled, (state, action) => {
      state.currentUser = action.payload.user as unknown as UserProfile;
    });

    // Logout - clear currentUser
    builder.addCase(logoutThunk.fulfilled, (state) => {
      state.currentUser = null;
    });

    // Restore session - set currentUser
    builder.addCase(restoreSessionThunk.fulfilled, (state, action) => {
      if (action.payload) {
        state.currentUser = action.payload.user as unknown as UserProfile;
      }
    });

    builder.addCase(signInAnonymousThunk.fulfilled, (state, action) => {
      state.currentUser = action.payload.user as unknown as UserProfile;
    });

    builder.addCase(upgradeAnonymousThunk.fulfilled, (state, action) => {
      state.currentUser = action.payload.user as unknown as UserProfile;
    });
  },
});

export const { clearError, setFilter, setPagination, selectUser, setCurrentUser, clearUsers } =
  userSlice.actions;

export default userSlice.reducer;
