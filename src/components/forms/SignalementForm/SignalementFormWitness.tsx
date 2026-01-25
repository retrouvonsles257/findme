import React from 'react';
import { SignalementFormData } from './SignalementFormValidation';

export interface SignalementFormWitnessProps {
  data: Partial<SignalementFormData>;
  onChange: (field: keyof SignalementFormData, value: string) => void;
  errors: Record<string, string>;
}

export const SignalementFormWitness: React.FC<SignalementFormWitnessProps> = ({ data, onChange, errors }) => {
  return (
    <div>
      <h3>Witness Information</h3>

      <div className="form-group">
        <label htmlFor="witnessName">Witness Name *</label>
        <input
          id="witnessName"
          type="text"
          value={data.witnessName || ''}
          onChange={(e) => onChange('witnessName', e.target.value)}
          placeholder="Enter witness name"
          className={errors.witnessName ? 'input-error' : ''}
        />
        {errors.witnessName && <span className="error-message">{errors.witnessName}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="witnessPhone">Witness Phone *</label>
        <input
          id="witnessPhone"
          type="tel"
          value={data.witnessPhone || ''}
          onChange={(e) => onChange('witnessPhone', e.target.value)}
          placeholder="Enter witness phone"
          className={errors.witnessPhone ? 'input-error' : ''}
        />
        {errors.witnessPhone && <span className="error-message">{errors.witnessPhone}</span>}
      </div>
    </div>
  );
};
