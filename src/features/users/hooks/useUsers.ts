/**
 * =====================================================
 * RETROUVONSLES - useUsers Hook
 * Hook for user list operations
 * =====================================================
 */

import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../../../store/types';
import {
  fetchAllUsers,
  searchUsersList,
  setFilter,
  setPagination,
  selectUser,
  clearUsers,
} from '../store/userSlice';
import {
  selectAllUsers,
  selectSelectedUser,
  selectIsLoading,
  selectError,
  selectPagination,
  selectUserFilter,
} from '../store/userSelectors';
import type { UserProfile, UserFilter } from '../types';

export interface UseUsersResult {
  users: UserProfile[];
  selectedUser: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  pagination: any;
  filter: UserFilter;

  fetch: (filter?: UserFilter) => void;
  search: (query: string) => void;
  selectUser: (user: UserProfile | null) => void;
  updateFilter: (filter: UserFilter) => void;
  updatePagination: (page: number, limit: number) => void;
  clearAll: () => void;
}

export const useUsers = (): UseUsersResult => {
  const dispatch = useDispatch<AppDispatch>();

  const users = useSelector(selectAllUsers);
  const selectedUser = useSelector(selectSelectedUser);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);
  const pagination = useSelector(selectPagination);
  const filter = useSelector(selectUserFilter);

  const fetch = useCallback(
    (filterData?: UserFilter) => {
      dispatch(fetchAllUsers(filterData));
    },
    [dispatch]
  );

  const search = useCallback(
    (query: string) => {
      dispatch(searchUsersList(query));
    },
    [dispatch]
  );

  const selectUserCallback = useCallback(
    (user: UserProfile | null) => {
      dispatch(selectUser(user));
    },
    [dispatch]
  );

  const updateFilter = useCallback(
    (newFilter: UserFilter) => {
      dispatch(setFilter(newFilter));
    },
    [dispatch]
  );

  const updatePagination = useCallback(
    (page: number, limit: number) => {
      dispatch(
        setPagination({
          page,
          limit,
          total: pagination.total,
          totalPages: pagination.totalPages,
        })
      );
    },
    [dispatch, pagination]
  );

  const clearAll = useCallback(() => {
    dispatch(clearUsers());
  }, [dispatch]);

  return {
    users,
    selectedUser,
    isLoading,
    error,
    pagination,
    filter,
    fetch,
    search,
    selectUser: selectUserCallback,
    updateFilter,
    updatePagination,
    clearAll,
  };
};
