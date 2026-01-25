import React from 'react';
import { DossierFormData } from './DossierFormValidation';

export interface DossierFormPersonInfoProps {
  data: Partial<DossierFormData>;
  onChange: (field: keyof DossierFormData, value: any) => void;
  errors: Record<string, string>;
}

export const DossierFormPersonInfo: React.FC<DossierFormPersonInfoProps> = ({ data, onChange, errors }) => {
  return (
    <div>
      <h3>Missing Person Information</h3>

      <div className="form-group">
        <label htmlFor="personName">Full Name *</label>
        <input
          id="personName"
          type="text"
          value={data.personName || ''}
          onChange={(e) => onChange('personName', e.target.value)}
          placeholder="Enter person's full name"
          className={errors.personName ? 'input-error' : ''}
        />
        {errors.personName && <span className="error-message">{errors.personName}</span>}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="personAge">Age *</label>
          <input
            id="personAge"
            type="number"
            value={data.personAge || ''}
            onChange={(e) => onChange('personAge', parseInt(e.target.value) || 0)}
            placeholder="Enter age"
            className={errors.personAge ? 'input-error' : ''}
          />
          {errors.personAge && <span className="error-message">{errors.personAge}</span>}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="personDescription">Physical Description *</label>
        <textarea
          id="personDescription"
          value={data.personDescription || ''}
          onChange={(e) => onChange('personDescription', e.target.value)}
          placeholder="Describe physical characteristics (height, hair color, clothing, etc.)"
          rows={4}
          className={errors.personDescription ? 'input-error' : ''}
        />
        {errors.personDescription && <span className="error-message">{errors.personDescription}</span>}
      </div>
    </div>
  );
};
