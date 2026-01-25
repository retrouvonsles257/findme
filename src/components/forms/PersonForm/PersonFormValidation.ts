import React from 'react';

export interface PersonFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  idNumber: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
}

export const validatePersonForm = (data: Partial<PersonFormData>): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!data.firstName || data.firstName.trim() === '') {
    errors.firstName = 'First name is required';
  }

  if (!data.lastName || data.lastName.trim() === '') {
    errors.lastName = 'Last name is required';
  }

  if (!data.dateOfBirth) {
    errors.dateOfBirth = 'Date of birth is required';
  }

  if (!data.gender) {
    errors.gender = 'Gender is required';
  }

  if (!data.email || !data.email.includes('@')) {
    errors.email = 'Valid email is required';
  }

  if (!data.phone || data.phone.trim() === '') {
    errors.phone = 'Phone number is required';
  }

  return errors;
};
