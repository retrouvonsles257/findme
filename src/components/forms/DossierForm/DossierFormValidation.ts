import React from 'react';

export interface DossierFormData {
  personName: string;
  personAge: number;
  personDescription: string;
  lastSeenLocation: string;
  lastSeenDate: string;
  circumstances: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  latitude?: number;
  longitude?: number;
}

export const validateDossierForm = (data: Partial<DossierFormData>): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!data.personName || data.personName.trim() === '') {
    errors.personName = 'Person name is required';
  }

  if (!data.personAge || data.personAge < 0 || data.personAge > 150) {
    errors.personAge = 'Valid age is required';
  }

  if (!data.personDescription || data.personDescription.trim() === '') {
    errors.personDescription = 'Physical description is required';
  }

  if (!data.lastSeenLocation || data.lastSeenLocation.trim() === '') {
    errors.lastSeenLocation = 'Last seen location is required';
  }

  if (!data.lastSeenDate) {
    errors.lastSeenDate = 'Last seen date is required';
  }

  if (!data.circumstances || data.circumstances.trim() === '') {
    errors.circumstances = 'Circumstances are required';
  }

  if (!data.contactName || data.contactName.trim() === '') {
    errors.contactName = 'Contact name is required';
  }

  if (!data.contactPhone || data.contactPhone.trim() === '') {
    errors.contactPhone = 'Contact phone is required';
  }

  if (!data.contactEmail || !data.contactEmail.includes('@')) {
    errors.contactEmail = 'Valid email is required';
  }

  return errors;
};
