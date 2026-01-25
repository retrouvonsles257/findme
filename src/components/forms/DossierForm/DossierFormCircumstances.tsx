import React from 'react';
import { DossierFormData } from './DossierFormValidation';

export interface DossierFormCircumstancesProps {
  data: Partial<DossierFormData>;
  onChange: (field: keyof DossierFormData, value: string) => void;
  errors: Record<string, string>;
}

export const DossierFormCircumstances: React.FC<DossierFormCircumstancesProps> = ({ data, onChange, errors }) => {
  return (
    <div>
      <h3>Circumstances</h3>

      <div className="form-group">
        <label htmlFor="circumstances">Circumstances of Disappearance *</label>
        <textarea
          id="circumstances"
          value={data.circumstances || ''}
          onChange={(e) => onChange('circumstances', e.target.value)}
          placeholder="Describe the circumstances of the disappearance"
          rows={5}
          className={errors.circumstances ? 'input-error' : ''}
        />
        {errors.circumstances && <span className="error-message">{errors.circumstances}</span>}
      </div>

      <div className="info-box">
        <p>📋 Provide any relevant details about mental state, habits, or potential risks.</p>
      </div>
    </div>
  );
};
