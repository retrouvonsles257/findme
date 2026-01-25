/**
 * =====================================================
 * RETROUVONSLES - Notification Redux Slice
 * Redux state management for notifications
 * =====================================================
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { NotificationState, INotification, NotificationFilter } from '../types';
import {
  createNotification,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  filterNotifications,
  getNotificationsByCategory,
} from '../services/notificationAPI';

// ============================================
// ASYNC THUNKS
// ============================================

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (userId: string) => {
    return getNotifications(userId);
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async (userId: string) => {
    return getUnreadCount(userId);
  }
);

export const createNewNotification = createAsyncThunk(
  'notifications/createNewNotification',
  async (data: Omit<INotification, 'id' | 'timestamp'>) => {
    return createNotification(data);
  }
);

export const toggleNotificationRead = createAsyncThunk(
  'notifications/toggleNotificationRead',
  async (notificationId: string) => {
    return markAsRead(notificationId);
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (userId: string) => {
    await markAllAsRead(userId);
    return userId;
  }
);

export const removeNotification = createAsyncThunk(
  'notifications/removeNotification',
  async (notificationId: string) => {
    await deleteNotification(notificationId);
    return notificationId;
  }
);

export const clearAllNotifications = createAsyncThunk(
  'notifications/clearAllNotifications',
  async (userId: string) => {
    await deleteAllNotifications(userId);
    return userId;
  }
);

export const applyNotificationFilter = createAsyncThunk(
  'notifications/applyFilter',
  async ({ userId, filter }: { userId: string; filter: NotificationFilter }) => {
    return filterNotifications(userId, filter);
  }
);

export const fetchNotificationsByCategory = createAsyncThunk(
  'notifications/fetchByCategory',
  async ({ userId, category }: { userId: string; category: string }) => {
    return getNotificationsByCategory(userId, category);
  }
);

// ============================================
// SLICE
// ============================================

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  selectedNotification: null,
  isLoading: false,
  error: null,
  filter: {},
};

export const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setSelectedNotification: (state, action) => {
      state.selectedNotification = action.payload;
    },
    setFilter: (state, action) => {
      state.filter = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetNotificationState: () => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    // fetchNotifications
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notifications = action.payload;
        state.unreadCount = action.payload.filter((n) => !n.read).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch notifications';
      });

    // fetchUnreadCount
    builder
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      });

    // createNewNotification
    builder
      .addCase(createNewNotification.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createNewNotification.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notifications.unshift(action.payload);
        if (!action.payload.read) {
          state.unreadCount += 1;
        }
      })
      .addCase(createNewNotification.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to create notification';
      });

    // toggleNotificationRead
    builder
      .addCase(toggleNotificationRead.fulfilled, (state, action) => {
        const index = state.notifications.findIndex((n) => n.id === action.payload.id);
        if (index !== -1) {
          state.notifications[index] = action.payload;
          if (action.payload.read && !state.notifications[index].read) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
        }
      });

    // markAllNotificationsAsRead
    builder
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.notifications.forEach((n) => {
          n.read = true;
        });
        state.unreadCount = 0;
      });

    // removeNotification
    builder
      .addCase(removeNotification.fulfilled, (state, action) => {
        const notification = state.notifications.find((n) => n.id === action.payload);
        if (notification && !notification.read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications = state.notifications.filter((n) => n.id !== action.payload);
      });

    // clearAllNotifications
    builder
      .addCase(clearAllNotifications.fulfilled, (state) => {
        state.notifications = [];
        state.unreadCount = 0;
      });

    // applyNotificationFilter
    builder
      .addCase(applyNotificationFilter.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(applyNotificationFilter.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notifications = action.payload;
      })
      .addCase(applyNotificationFilter.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to filter notifications';
      });

    // fetchNotificationsByCategory
    builder
      .addCase(fetchNotificationsByCategory.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchNotificationsByCategory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notifications = action.payload;
      })
      .addCase(fetchNotificationsByCategory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch notifications by category';
      });
  },
});

export const { setSelectedNotification, setFilter, clearError, resetNotificationState } =
  notificationSlice.actions;

export default notificationSlice.reducer;
