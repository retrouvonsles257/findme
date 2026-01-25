import React from 'react';

export interface OrganisationFormData {
  name: string;
  type: string;
  description: string;
  website: string;
  phone: string;
  email: string;
  address: string;
}

export const validateOrganisationForm = (data: Partial<OrganisationFormData>): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!data.name || data.name.trim() === '') {
    errors.name = 'Organization name is required';
  }

  if (!data.type || data.type.trim() === '') {
    errors.type = 'Organization type is required';
  }

  if (!data.description || data.description.trim() === '') {
    errors.description = 'Description is required';
  }

  if (data.email && !data.email.includes('@')) {
    errors.email = 'Valid email is required';
  }

  return errors;
};
