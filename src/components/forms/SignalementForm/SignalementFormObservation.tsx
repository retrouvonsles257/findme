import React from 'react';
import { SignalementFormData } from './SignalementFormValidation';

export interface SignalementFormObservationProps {
  data: Partial<SignalementFormData>;
  onChange: (field: keyof SignalementFormData, value: string) => void;
  errors: Record<string, string>;
}

export const SignalementFormObservation: React.FC<SignalementFormObservationProps> = ({
  data,
  onChange,
  errors,
}) => {
  return (
    <div>
      <h3>Observation Details</h3>

      <div className="form-group">
        <label htmlFor="observation">Observation *</label>
        <textarea
          id="observation"
          value={data.observation || ''}
          onChange={(e) => onChange('observation', e.target.value)}
          placeholder="Describe what you observed"
          rows={4}
          className={errors.observation ? 'input-error' : ''}
        />
        {errors.observation && <span className="error-message">{errors.observation}</span>}
      </div>
    </div>
  );
};
