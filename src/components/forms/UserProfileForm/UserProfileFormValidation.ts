import React from 'react';

export interface UserProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  language: string;
  notifications: boolean;
  newsletter: boolean;
  privacy: boolean;
}

export const UserProfileFormValidation = (data: Partial<UserProfileFormData>): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!data.firstName || data.firstName.trim() === '') {
    errors.firstName = 'First name is required';
  }

  if (!data.lastName || data.lastName.trim() === '') {
    errors.lastName = 'Last name is required';
  }

  if (!data.email || !data.email.includes('@')) {
    errors.email = 'Valid email is required';
  }

  if (!data.phone || data.phone.trim() === '') {
    errors.phone = 'Phone is required';
  }

  return errors;
};
