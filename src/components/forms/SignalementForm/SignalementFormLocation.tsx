import React from 'react';
import { SignalementFormData } from './SignalementFormValidation';

export interface SignalementFormLocationProps {
  data: Partial<SignalementFormData>;
  onChange: (field: keyof SignalementFormData, value: any) => void;
  errors: Record<string, string>;
}

export const SignalementFormLocation: React.FC<SignalementFormLocationProps> = ({ data, onChange, errors }) => {
  return (
    <div>
      <h3>Sighting Location</h3>

      <div className="form-group">
        <label htmlFor="location">Location *</label>
        <input
          id="location"
          type="text"
          value={data.location || ''}
          onChange={(e) => onChange('location', e.target.value)}
          placeholder="Enter location"
          className={errors.location ? 'input-error' : ''}
        />
        {errors.location && <span className="error-message">{errors.location}</span>}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="date">Date *</label>
          <input
            id="date"
            type="date"
            value={data.date || ''}
            onChange={(e) => onChange('date', e.target.value)}
            className={errors.date ? 'input-error' : ''}
          />
          {errors.date && <span className="error-message">{errors.date}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="time">Time</label>
          <input
            id="time"
            type="time"
            value={data.time || ''}
            onChange={(e) => onChange('time', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};
