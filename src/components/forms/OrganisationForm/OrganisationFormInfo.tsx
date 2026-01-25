import React from 'react';
import { OrganisationFormData } from './OrganisationFormValidation';

export interface OrganisationFormInfoProps {
  data: Partial<OrganisationFormData>;
  onChange: (field: keyof OrganisationFormData, value: string) => void;
  errors: Record<string, string>;
}

export const OrganisationFormInfo: React.FC<OrganisationFormInfoProps> = ({ data, onChange, errors }) => {
  return (
    <div>
      <h3>Organization Information</h3>

      <div className="form-group">
        <label htmlFor="name">Organization Name *</label>
        <input
          id="name"
          type="text"
          value={data.name || ''}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder="Enter organization name"
          className={errors.name ? 'input-error' : ''}
        />
        {errors.name && <span className="error-message">{errors.name}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="type">Organization Type *</label>
        <input
          id="type"
          type="text"
          value={data.type || ''}
          onChange={(e) => onChange('type', e.target.value)}
          placeholder="e.g., NGO, Government, Private"
          className={errors.type ? 'input-error' : ''}
        />
        {errors.type && <span className="error-message">{errors.type}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="description">Description *</label>
        <textarea
          id="description"
          value={data.description || ''}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="Describe the organization"
          rows={4}
          className={errors.description ? 'input-error' : ''}
        />
        {errors.description && <span className="error-message">{errors.description}</span>}
      </div>
    </div>
  );
};
