import React from 'react';
import { PersonFormData } from './PersonFormValidation';

export interface PersonFormStep2Props {
  data: Partial<PersonFormData>;
  onChange: (field: keyof PersonFormData, value: string) => void;
  errors: Record<string, string>;
}

export const PersonFormStep2: React.FC<PersonFormStep2Props> = ({ data, onChange, errors }) => {
  return (
    <div>
      <h3>Identity Information</h3>

      <div className="form-group">
        <label htmlFor="nationality">Nationality</label>
        <input
          id="nationality"
          type="text"
          value={data.nationality || ''}
          onChange={(e) => onChange('nationality', e.target.value)}
          placeholder="Enter nationality"
        />
      </div>

      <div className="form-group">
        <label htmlFor="idNumber">ID Number</label>
        <input
          id="idNumber"
          type="text"
          value={data.idNumber || ''}
          onChange={(e) => onChange('idNumber', e.target.value)}
          placeholder="Enter ID number"
        />
      </div>
    </div>
  );
};
