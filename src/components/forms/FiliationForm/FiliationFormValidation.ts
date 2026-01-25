import React from 'react';

export interface FiliationFormData {
  person1Name: string;
  person1Age: number;
  person2Name: string;
  person2Age: number;
  relationType: 'parent_child' | 'sibling' | 'other';
  proofType: 'dna' | 'document' | 'witness' | 'other';
  proofDetails: string;
}

export const validateFiliationForm = (data: Partial<FiliationFormData>): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!data.person1Name || data.person1Name.trim() === '') {
    errors.person1Name = 'First person name is required';
  }

  if (!data.person1Age || data.person1Age < 0 || data.person1Age > 150) {
    errors.person1Age = 'Valid age is required';
  }

  if (!data.person2Name || data.person2Name.trim() === '') {
    errors.person2Name = 'Second person name is required';
  }

  if (!data.person2Age || data.person2Age < 0 || data.person2Age > 150) {
    errors.person2Age = 'Valid age is required';
  }

  if (!data.relationType) {
    errors.relationType = 'Relation type is required';
  }

  if (!data.proofType) {
    errors.proofType = 'Proof type is required';
  }

  if (!data.proofDetails || data.proofDetails.trim() === '') {
    errors.proofDetails = 'Proof details are required';
  }

  return errors;
};
