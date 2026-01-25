/**
 * =====================================================
 * RETROUVONSLES - useDossierCreate Hook
 * Form creation and validation
 * =====================================================
 */

import { useState, useCallback } from 'react';
import type { UseDossierCreateReturn, DossierFormValues, DossierValidationErrors, DossierDisplayData } from '../types';
import * as dossierService from '../services/dossierService';

export const useDossierCreate = (): UseDossierCreateReturn => {
  const [formData, setFormData] = useState<Partial<DossierFormValues>>({
    date_disparition: new Date().toISOString().split('T')[0],
    visible_public: false,
    diffusion_autorisee: false,
    diffusion_medias: false,
    diffusion_reseaux_sociaux: false,
    rayon_diffusion_km: 50,
  });

  const [errors, setErrors] = useState<DossierValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdDossier, setCreatedDossier] = useState<DossierDisplayData | null>(null);

  const setFieldValue = useCallback((field: keyof DossierFormValues, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const validateField = useCallback((field: keyof DossierFormValues): boolean => {
    const fieldErrors = dossierService.validateDossierForm({
      [field]: formData[field],
    });

    if (fieldErrors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: fieldErrors[field],
      }));
      return false;
    }

    return true;
  }, [formData]);

  const validateForm = useCallback((): boolean => {
    const validationErrors = dossierService.validateDossierForm(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return false;
    }

    return true;
  }, [formData]);

  const resetForm = useCallback(() => {
    setFormData({
      date_disparition: new Date().toISOString().split('T')[0],
      visible_public: false,
      diffusion_autorisee: false,
      diffusion_medias: false,
      diffusion_reseaux_sociaux: false,
      rayon_diffusion_km: 50,
    });
    setErrors({});
    setCreatedDossier(null);
  }, []);

  const submitForm = useCallback(async (): Promise<DossierDisplayData> => {
    if (!validateForm()) {
      throw new Error('Validation failed');
    }

    setIsSubmitting(true);

    try {
      // Get current user ID (should come from auth context)
      const userId = localStorage.getItem('userId') || 'anonymous';
      const orgId = localStorage.getItem('organizationId') || 'unknown';

      const result = await dossierService.createAndProcessDossier(
        formData as DossierFormValues,
        userId,
        orgId,
      );

      setCreatedDossier(result);
      resetForm();
      return result;
    } catch (err: any) {
      setErrors({
        circonstances: err.message || 'Erreur lors de la création',
      });
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, resetForm]);

  return {
    formData,
    errors,
    isSubmitting,
    createdDossier,
    setFieldValue,
    submitForm,
    resetForm,
    validateField,
    validateForm,
  };
};
