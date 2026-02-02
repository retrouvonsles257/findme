/**
 * =====================================================
 * RETROUVONSLES - useOrganisationMembers Hook
 * Hook for organisation member operations
 * =====================================================
 */

import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../../../store/types';
import {
  fetchMembers,
  addMember,
  updateMember,
  removeMember,
} from '../store/organisationSlice';
import {
  selectOrganisationMembers,
  selectIsLoading,
  selectError,
  selectMemberStatistics,
} from '../store/organisationSelectors';
import type { OrganisationMember, OrganisationMemberCreatePayload, OrganisationMemberUpdatePayload } from '../types';

export interface UseOrganisationMembersResult {
  members: OrganisationMember[];
  isLoading: boolean;
  error: string | null;
  statistics: ReturnType<typeof selectMemberStatistics>;
  fetchMembers: (organisationId: string) => Promise<any>;
  addMember: (organisationId: string, payload: OrganisationMemberCreatePayload) => Promise<any>;
  updateMember: (memberId: string, payload: OrganisationMemberUpdatePayload) => Promise<any>;
  removeMember: (memberId: string) => Promise<any>;
}

/**
 * useOrganisationMembers hook
 */
export const useOrganisationMembers = (): UseOrganisationMembersResult => {
  const dispatch = useDispatch<AppDispatch>();
  const members = useSelector(selectOrganisationMembers);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);
  const statistics = useSelector(selectMemberStatistics);

  const handleFetchMembers = useCallback(
    (organisationId: string) => {
      return (dispatch(fetchMembers(organisationId)) as any).unwrap();
    },
    [dispatch]
  );

  const handleAddMember = useCallback(
    (organisationId: string, payload: OrganisationMemberCreatePayload) => {
      return (dispatch(addMember({ organisationId, payload })) as any).unwrap();
    },
    [dispatch]
  );

  const handleUpdateMember = useCallback(
    (memberId: string, payload: OrganisationMemberUpdatePayload) => {
      return (dispatch(updateMember({ memberId, payload })) as any).unwrap();
    },
    [dispatch]
  );

  const handleRemoveMember = useCallback(
    (memberId: string) => {
      return (dispatch(removeMember(memberId)) as any).unwrap();
    },
    [dispatch]
  );

  return {
    members,
    isLoading,
    error,
    statistics,
    fetchMembers: handleFetchMembers,
    addMember: handleAddMember,
    updateMember: handleUpdateMember,
    removeMember: handleRemoveMember,
  };
};
