/**
 * =====================================================
 * RETROUVONSLES - useCampagneCreate Hook
 * Hook pour la création d'une nouvelle campagne
 * =====================================================
 */

import { useState, useCallback } from 'react';
import { useNotification } from '@/contexts';
import { campagneService } from '../services';
import type { CampagneSensibilisation } from '@types';
import type { CampagneCreatePayload, CampagneFormValues } from '../types';

export interface UseCampagneCreateReturn {
  isCreating: boolean;
  error: string | null;
  errors: Record<string, string>;
  createCampagne: (payload: CampagneCreatePayload) => Promise<CampagneSensibilisation | null>;
  validateForm: (values: CampagneFormValues) => Record<string, string>;
  clearErrors: () => void;
}

/**
 * Hook pour la création d'une campagne
 */
export const useCampagneCreate = (): UseCampagneCreateReturn => {
  const notification = useNotification();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validate form
  const validateForm = useCallback((values: CampagneFormValues): Record<string, string> => {
    const formErrors: Record<string, string> = {};

    // Title
    if (!values.titre || values.titre.trim().length === 0) {
      formErrors.titre = 'Le titre est requis';
    } else if (values.titre.length > 255) {
      formErrors.titre = 'Le titre ne doit pas dépasser 255 caractères';
    }

    // Type campagne
    if (!values.type_campagne) {
      formErrors.type_campagne = 'Le type de campagne est requis';
    }

    // Date debut
    if (!values.date_debut) {
      formErrors.date_debut = 'La date de début est requise';
    } else {
      const debut = new Date(values.date_debut);
      if (debut < new Date()) {
        formErrors.date_debut = 'La date de début ne peut pas être dans le passé';
      }
    }

    // Date fin
    if (values.date_fin) {
      const debut = new Date(values.date_debut);
      const fin = new Date(values.date_fin);
      if (fin <= debut) {
        formErrors.date_fin = 'La date de fin doit être après la date de début';
      }
    }

    // Budget
    if (values.budget_alloue !== undefined && values.budget_alloue < 0) {
      formErrors.budget_alloue = 'Le budget ne peut pas être négatif';
    }

    return formErrors;
  }, []);

  // Create campagne
  const createCampagne = useCallback(
    async (payload: CampagneCreatePayload): Promise<CampagneSensibilisation | null> => {
      setIsCreating(true);
      setError(null);
      setErrors({});

      try {
        const campagne = await campagneService.createCampagne(payload);
        notification.addNotification({
          title: 'Succès',
          message: 'Campagne créée avec succès',
          type: 'success',
        });

        return campagne;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur lors de la création';
        setError(message);
        notification.addNotification({
          title: 'Erreur',
          message,
          type: 'error',
        });

        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [notification],
  );

  // Clear errors
  const clearErrors = useCallback(() => {
    setError(null);
    setErrors({});
  }, []);

  return {
    isCreating,
    error,
    errors,
    createCampagne,
    validateForm,
    clearErrors,
  };
};
