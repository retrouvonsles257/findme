import React from 'react';

export interface SignalementFormData {
  location: string;
  latitude: number;
  longitude: number;
  date: string;
  time: string;
  observation: string;
  witnessName: string;
  witnessPhone: string;
  photos: File[];
}

export const validateSignalementForm = (data: Partial<SignalementFormData>): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!data.location || data.location.trim() === '') {
    errors.location = 'Location is required';
  }

  if (!data.date) {
    errors.date = 'Date is required';
  }

  if (!data.observation || data.observation.trim() === '') {
    errors.observation = 'Observation is required';
  }

  if (!data.witnessName || data.witnessName.trim() === '') {
    errors.witnessName = 'Witness name is required';
  }

  if (!data.witnessPhone || data.witnessPhone.trim() === '') {
    errors.witnessPhone = 'Witness phone is required';
  }

  return errors;
};
