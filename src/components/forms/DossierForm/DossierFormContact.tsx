import React from 'react';
import { DossierFormData } from './DossierFormValidation';

export interface DossierFormContactProps {
  data: Partial<DossierFormData>;
  onChange: (field: keyof DossierFormData, value: string) => void;
  errors: Record<string, string>;
}

export const DossierFormContact: React.FC<DossierFormContactProps> = ({ data, onChange, errors }) => {
  return (
    <div>
      <h3>Reporting Contact</h3>

      <div className="form-group">
        <label htmlFor="contactName">Contact Name *</label>
        <input
          id="contactName"
          type="text"
          value={data.contactName || ''}
          onChange={(e) => onChange('contactName', e.target.value)}
          placeholder="Name of person reporting"
          className={errors.contactName ? 'input-error' : ''}
        />
        {errors.contactName && <span className="error-message">{errors.contactName}</span>}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="contactPhone">Phone Number *</label>
          <input
            id="contactPhone"
            type="tel"
            value={data.contactPhone || ''}
            onChange={(e) => onChange('contactPhone', e.target.value)}
            placeholder="Contact phone number"
            className={errors.contactPhone ? 'input-error' : ''}
          />
          {errors.contactPhone && <span className="error-message">{errors.contactPhone}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="contactEmail">Email Address *</label>
          <input
            id="contactEmail"
            type="email"
            value={data.contactEmail || ''}
            onChange={(e) => onChange('contactEmail', e.target.value)}
            placeholder="Contact email"
            className={errors.contactEmail ? 'input-error' : ''}
          />
          {errors.contactEmail && <span className="error-message">{errors.contactEmail}</span>}
        </div>
      </div>
    </div>
  );
};
