import React from 'react';
import { AlerteFormData } from './AlerteFormValidation';

export interface AlerteFormZoneProps {
  data: Partial<AlerteFormData>;
  onChange: (field: keyof AlerteFormData, value: string) => void;
  errors: Record<string, string>;
}

export const AlerteFormZone: React.FC<AlerteFormZoneProps> = ({ data, onChange, errors }) => {
  return (
    <div>
      <h3>Geographic Zone</h3>

      <div className="form-group">
        <label htmlFor="zone">Zone *</label>
        <input
          id="zone"
          type="text"
          value={data.zone || ''}
          onChange={(e) => onChange('zone', e.target.value)}
          placeholder="Enter geographic zone or region"
          className={errors.zone ? 'input-error' : ''}
        />
        {errors.zone && <span className="error-message">{errors.zone}</span>}
      </div>

      <div className="info-box">
        <p>📍 The alert will be sent to users in the specified geographic zone.</p>
      </div>
    </div>
  );
};
