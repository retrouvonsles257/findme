/**
 * =====================================================
 * RETROUVONSLES - useFiliationTree Hook
 * Hook for building and managing family trees
 * =====================================================
 */

import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../../../store/types';
import { fetchFamilyTree, fetchFiliationStatistics } from '../store/filiationSlice';
import {
  selectCurrentTree,
  selectFiliationStatistics,
  selectFiliationLoading,
  selectFiliationError,
} from '../store/filiationSelectors';
import type { FiliationNode } from '../types';
import * as filiationService from '../services';

export const useFiliationTree = (idPersonne: string, autoFetch: boolean = true) => {
  const dispatch = useDispatch<AppDispatch>();
  const [familyRelations, setFamilyRelations] = useState<any>(null);

  const currentTree = useSelector(selectCurrentTree);
  const statistics = useSelector(selectFiliationStatistics);
  const loading = useSelector(selectFiliationLoading);
  const error = useSelector(selectFiliationError);

  const fetchTree = useCallback(() => {
    dispatch(fetchFamilyTree(idPersonne));
  }, [dispatch, idPersonne]);

  const fetchStatistics = useCallback(() => {
    dispatch(fetchFiliationStatistics());
  }, [dispatch]);

  const loadFamilyRelations = useCallback(async () => {
    try {
      const relations = await filiationService.getPersonneFamilyRelations(idPersonne);
      setFamilyRelations(relations);
    } catch (err) {
      console.error('Error loading family relations:', err);
    }
  }, [idPersonne]);

  useEffect(() => {
    if (autoFetch) {
      fetchTree();
      fetchStatistics();
      loadFamilyRelations();
    }
  }, [autoFetch, fetchTree, fetchStatistics, loadFamilyRelations]);

  const calculateTreeStats = useCallback(() => {
    if (!currentTree) return null;

    return {
      totalPersonnes: currentTree.totalPersonnes,
      generations: currentTree.generations,
      liens: currentTree.liens.length,
    };
  }, [currentTree]);

  const getNodeByid = useCallback(
    (id: string) => {
      if (!currentTree) return null;

      // BFS to find node
      const queue = [currentTree.racine];
      while (queue.length > 0) {
        const node = queue.shift();
        if (node?.id === id) return node;
        if (node?.enfants) {
          queue.push(...node.enfants);
        }
      }
      return null;
    },
    [currentTree],
  );

  const getPathToRoot = useCallback(
    (id: string) => {
      const path = [];
      let current: FiliationNode | null = getNodeByid(id) || null;

      while (current) {
        path.unshift(current);
        current = current.parent || null;
      }

      return path;
    },
    [getNodeByid],
  );

  return {
    currentTree,
    statistics,
    familyRelations,
    loading,
    error,
    fetchTree,
    fetchStatistics,
    loadFamilyRelations,
    calculateTreeStats,
    getNodeByid,
    getPathToRoot,
  };
};
