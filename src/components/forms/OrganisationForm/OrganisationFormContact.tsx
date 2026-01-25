import React from 'react';
import { OrganisationFormData } from './OrganisationFormValidation';

export interface OrganisationFormContactProps {
  data: Partial<OrganisationFormData>;
  onChange: (field: keyof OrganisationFormData, value: string) => void;
  errors: Record<string, string>;
}

export const OrganisationFormContact: React.FC<OrganisationFormContactProps> = ({ data, onChange, errors }) => {
  return (
    <div>
      <h3>Contact Information</h3>

      <div className="form-group">
        <label htmlFor="phone">Phone</label>
        <input
          id="phone"
          type="tel"
          value={data.phone || ''}
          onChange={(e) => onChange('phone', e.target.value)}
          placeholder="Enter phone number"
        />
      </div>

      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={data.email || ''}
          onChange={(e) => onChange('email', e.target.value)}
          placeholder="Enter email address"
          className={errors.email ? 'input-error' : ''}
        />
        {errors.email && <span className="error-message">{errors.email}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          type="url"
          value={data.website || ''}
          onChange={(e) => onChange('website', e.target.value)}
          placeholder="Enter website URL"
        />
      </div>

      <div className="form-group">
        <label htmlFor="address">Address</label>
        <input
          id="address"
          type="text"
          value={data.address || ''}
          onChange={(e) => onChange('address', e.target.value)}
          placeholder="Enter organization address"
        />
      </div>
    </div>
  );
};
