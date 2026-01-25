import React from 'react';
import { AlerteFormData } from './AlerteFormValidation';

export interface AlerteFormContentProps {
  data: Partial<AlerteFormData>;
  onChange: (field: keyof AlerteFormData, value: string) => void;
  errors: Record<string, string>;
}

export const AlerteFormContent: React.FC<AlerteFormContentProps> = ({ data, onChange, errors }) => {
  return (
    <div>
      <h3>Alert Information</h3>

      <div className="form-group">
        <label htmlFor="title">Alert Title *</label>
        <input
          id="title"
          type="text"
          value={data.title || ''}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder="Enter alert title"
          className={errors.title ? 'input-error' : ''}
        />
        {errors.title && <span className="error-message">{errors.title}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="description">Description *</label>
        <textarea
          id="description"
          value={data.description || ''}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="Enter alert description"
          rows={4}
          className={errors.description ? 'input-error' : ''}
        />
        {errors.description && <span className="error-message">{errors.description}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="category">Category *</label>
        <select
          id="category"
          value={data.category || ''}
          onChange={(e) => onChange('category', e.target.value)}
          className={errors.category ? 'input-error' : ''}
        >
          <option value="">Select a category</option>
          <option value="missing_person">Missing Person</option>
          <option value="found_person">Found Person</option>
          <option value="danger">Danger Zone</option>
          <option value="emergency">Emergency</option>
        </select>
        {errors.category && <span className="error-message">{errors.category}</span>}
      </div>
    </div>
  );
};
