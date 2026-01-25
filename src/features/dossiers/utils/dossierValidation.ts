/**
 * =====================================================
 * RETROUVONSLES - Dossier Validation Utilities
 * Validation functions for dossier forms and operations
 * =====================================================
 */

import type { DossierFormValues, DossierValidationErrors } from '../types';

/**
 * Email validation
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Phone validation
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[\d\s\-+()]{9,}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Validate single field
 */
export const validateField = (
  field: keyof DossierFormValues,
  value: any,
): string | null => {
  switch (field) {
    case 'date_disparition':
      if (!value) return 'Date de disparition requise';
      if (new Date(value) > new Date()) return 'La date ne peut pas être dans le futur';
      return null;

    case 'type_disparition':
      if (!value) return 'Type de disparition requis';
      return null;

    case 'niveau_urgence':
      if (!value) return 'Niveau d\'urgence requis';
      return null;

    case 'circonstances':
      if (!value || value.trim().length === 0) return 'Circonstances requises';
      if (value.trim().length < 10) return 'Circonstances: minimum 10 caractères';
      return null;

    case 'lieu_disparition':
      if (!value || value.trim().length === 0) return 'Lieu requis';
      return null;

    case 'ville_disparition':
      if (!value || value.trim().length === 0) return 'Ville requise';
      return null;

    case 'region_disparition':
      if (!value || value.trim().length === 0) return 'Région requise';
      return null;

    case 'pays_disparition':
      if (!value || value.trim().length === 0) return 'Pays requis';
      return null;

    case 'precision_lieu':
      if (!value) return 'Précision du lieu requise';
      return null;

    case 'email_contact':
      if (value && !isValidEmail(value)) return 'Email invalide';
      return null;

    case 'telephone_contact':
      if (value && !isValidPhoneNumber(value)) return 'Numéro de téléphone invalide';
      return null;

    case 'contact_enqueteur':
      if (value && !isValidPhoneNumber(value) && !isValidEmail(value)) {
        return 'Numéro de téléphone ou email invalide';
      }
      return null;

    case 'numero_plainte':
      if (value && value.trim().length < 5) return 'Numéro de plainte: minimum 5 caractères';
      return null;

    case 'contexte_specifique':
      if (value && value.trim().length < 5) return 'Contexte: minimum 5 caractères';
      return null;

    case 'destination_prevue':
      if (value && value.trim().length < 3) return 'Destination prévue: minimum 3 caractères';
      return null;

    case 'moyen_transport':
      if (value && value.trim().length < 3) return 'Moyen de transport: minimum 3 caractères';
      return null;

    default:
      return null;
  }
};

/**
 * Validate entire form
 */
export const validateDossierFormComplete = (
  data: Partial<DossierFormValues>,
): DossierValidationErrors => {
  const errors: DossierValidationErrors = {};

  // Validate required fields
  const requiredFields: Array<keyof DossierFormValues> = [
    'date_disparition',
    'type_disparition',
    'niveau_urgence',
    'circonstances',
    'lieu_disparition',
    'ville_disparition',
    'region_disparition',
    'pays_disparition',
    'precision_lieu',
  ];

  requiredFields.forEach((field) => {
    const error = validateField(field, (data as any)[field]);
    if (error) {
      errors[field] = error;
    }
  });

  // Validate optional fields
  const optionalFields: Array<keyof DossierFormValues> = [
    'email_contact',
    'telephone_contact',
    'contact_enqueteur',
    'numero_plainte',
    'contexte_specifique',
    'destination_prevue',
    'moyen_transport',
  ];

  optionalFields.forEach((field) => {
    const error = validateField(field, (data as any)[field]);
    if (error) {
      errors[field] = error;
    }
  });

  return errors;
};

/**
 * Check if form has errors
 */
export const hasValidationErrors = (errors: DossierValidationErrors): boolean => {
  return Object.keys(errors).length > 0;
};

/**
 * Get error message for field
 */
export const getFieldError = (errors: DossierValidationErrors, field: keyof DossierFormValues): string | null => {
  return errors[field] || null;
};

/**
 * Validate date range
 */
export const isValidDateRange = (startDate: string, endDate: string): boolean => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start <= end;
};

/**
 * Check if dossier is valid for creation
 */
export const isValidForCreation = (data: Partial<DossierFormValues>): boolean => {
  const errors = validateDossierFormComplete(data);
  return !hasValidationErrors(errors);
};

/**
 * Validate location coordinates
 */
export const isValidCoordinates = (latitude?: number, longitude?: number): boolean => {
  if (!latitude || !longitude) return true;
  return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
};

/**
 * Validate file size (in MB)
 */
export const isValidFileSize = (sizeInBytes: number, maxSizeInMB: number = 5): boolean => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return sizeInBytes <= maxSizeInBytes;
};

/**
 * Validate image file
 */
export const isValidImageFile = (file: File): boolean => {
  const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  return validImageTypes.includes(file.type) && isValidFileSize(file.size, 5);
};

/**
 * Sanitize input string
 */
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '')
    .slice(0, 1000);
};

/**
 * Validate search query
 */
export const isValidSearchQuery = (query: string): boolean => {
  return query.length >= 2 && query.length <= 200;
};
