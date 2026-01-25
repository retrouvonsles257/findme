/**
 * =====================================================
 * RETROUVONSLES - usePersonneDetail Hook
 * Hook for personne detail operations
 * =====================================================
 */

import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '@/store/types';
import {
  fetchPersonneById,
  fetchPersonnePhotos,
  addPersonnePhotoData,
  deletePersonnePhotoData,
  fetchPersonneFiliations,
  createNewFiliation,
  updateFiliationData,
  updatePersonneData,
} from '../store/personneSlice';
import {
  selectSelectedPersonne,
  selectPersonnePhotos,
  selectPersonneFiliations,
  selectIsLoading,
  selectError,
} from '../store/personneSelectors';
import type { Personne, PersonnePhoto, PersonneUpdatePayload, LienFiliation } from '../types';

export interface UsePersonneDetailResult {
  personne: Personne | null;
  photos: PersonnePhoto[];
  filiations: LienFiliation[];
  isLoading: boolean;
  error: string | null;
  fetchPersonne: (id: string) => Promise<any>;
  updatePersonne: (id: string, payload: PersonneUpdatePayload) => Promise<any>;
  fetchPhotos: (id: string) => Promise<any>;
  addPhoto: (personneId: string, url: string, typePhoto: string) => Promise<any>;
  deletePhoto: (photoId: string) => Promise<any>;
  fetchFiliations: (id: string) => Promise<any>;
  addFiliation: (filiation: Omit<LienFiliation, 'id' | 'created_at' | 'updated_at'>) => Promise<any>;
  updateFiliation: (id: string, updates: Partial<LienFiliation>) => Promise<any>;
}

/**
 * usePersonneDetail hook
 */
export const usePersonneDetail = (): UsePersonneDetailResult => {
  const dispatch = useDispatch<AppDispatch>();
  const personne = useSelector(selectSelectedPersonne);
  const photos = useSelector(selectPersonnePhotos);
  const filiations = useSelector(selectPersonneFiliations);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);

  const handleFetchPersonne = useCallback(
    (id: string) => {
      return (dispatch(fetchPersonneById(id)) as any).unwrap();
    },
    [dispatch]
  );

  const handleUpdatePersonne = useCallback(
    (id: string, payload: PersonneUpdatePayload) => {
      return (dispatch(updatePersonneData({ id, payload })) as any).unwrap();
    },
    [dispatch]
  );

  const handleFetchPhotos = useCallback(
    (id: string) => {
      return (dispatch(fetchPersonnePhotos(id)) as any).unwrap();
    },
    [dispatch]
  );

  const handleAddPhoto = useCallback(
    (personneId: string, url: string, typePhoto: string) => {
      return (dispatch(addPersonnePhotoData({ personneId, url, type_photo: typePhoto })) as any).unwrap();
    },
    [dispatch]
  );

  const handleDeletePhoto = useCallback(
    (photoId: string) => {
      return (dispatch(deletePersonnePhotoData(photoId)) as any).unwrap();
    },
    [dispatch]
  );

  const handleFetchFiliations = useCallback(
    (id: string) => {
      return (dispatch(fetchPersonneFiliations(id)) as any).unwrap();
    },
    [dispatch]
  );

  const handleAddFiliation = useCallback(
    (filiation: Omit<LienFiliation, 'id' | 'created_at' | 'updated_at'>) => {
      return (dispatch(createNewFiliation(filiation)) as any).unwrap();
    },
    [dispatch]
  );

  const handleUpdateFiliation = useCallback(
    (id: string, updates: Partial<LienFiliation>) => {
      return (dispatch(updateFiliationData({ id, updates })) as any).unwrap();
    },
    [dispatch]
  );

  return {
    personne,
    photos,
    filiations,
    isLoading,
    error,
    fetchPersonne: handleFetchPersonne,
    updatePersonne: handleUpdatePersonne,
    fetchPhotos: handleFetchPhotos,
    addPhoto: handleAddPhoto,
    deletePhoto: handleDeletePhoto,
    fetchFiliations: handleFetchFiliations,
    addFiliation: handleAddFiliation,
    updateFiliation: handleUpdateFiliation,
  };
};
