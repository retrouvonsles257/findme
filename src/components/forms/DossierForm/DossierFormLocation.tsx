import React from 'react';
import { DossierFormData } from './DossierFormValidation';

export interface DossierFormLocationProps {
  data: Partial<DossierFormData>;
  onChange: (field: keyof DossierFormData, value: any) => void;
  errors: Record<string, string>;
}

export const DossierFormLocation: React.FC<DossierFormLocationProps> = ({ data, onChange, errors }) => {
  return (
    <div>
      <h3>Last Seen Location</h3>

      <div className="form-group">
        <label htmlFor="lastSeenLocation">Location *</label>
        <input
          id="lastSeenLocation"
          type="text"
          value={data.lastSeenLocation || ''}
          onChange={(e) => onChange('lastSeenLocation', e.target.value)}
          placeholder="Enter location address or description"
          className={errors.lastSeenLocation ? 'input-error' : ''}
        />
        {errors.lastSeenLocation && <span className="error-message">{errors.lastSeenLocation}</span>}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="lastSeenDate">Date Last Seen *</label>
          <input
            id="lastSeenDate"
            type="date"
            value={data.lastSeenDate || ''}
            onChange={(e) => onChange('lastSeenDate', e.target.value)}
            className={errors.lastSeenDate ? 'input-error' : ''}
          />
          {errors.lastSeenDate && <span className="error-message">{errors.lastSeenDate}</span>}
        </div>
      </div>
    </div>
  );
};
