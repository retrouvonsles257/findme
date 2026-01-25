import React from 'react';
import { FiliationFormData } from './FiliationFormValidation';

export interface FiliationFormProofProps {
  data: Partial<FiliationFormData>;
  onChange: (field: keyof FiliationFormData, value: string) => void;
  errors: Record<string, string>;
}

export const FiliationFormProof: React.FC<FiliationFormProofProps> = ({ data, onChange, errors }) => {
  return (
    <div>
      <h3>Proof of Relation</h3>

      <div className="form-group">
        <label htmlFor="proofType">Proof Type *</label>
        <select
          id="proofType"
          value={data.proofType || ''}
          onChange={(e) => onChange('proofType', e.target.value)}
          className={errors.proofType ? 'input-error' : ''}
        >
          <option value="">Select proof type</option>
          <option value="dna">DNA Test</option>
          <option value="document">Official Document</option>
          <option value="witness">Witness Testimony</option>
          <option value="other">Other</option>
        </select>
        {errors.proofType && <span className="error-message">{errors.proofType}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="proofDetails">Proof Details *</label>
        <textarea
          id="proofDetails"
          value={data.proofDetails || ''}
          onChange={(e) => onChange('proofDetails', e.target.value)}
          placeholder="Describe the proof in detail"
          rows={4}
          className={errors.proofDetails ? 'input-error' : ''}
        />
        {errors.proofDetails && <span className="error-message">{errors.proofDetails}</span>}
      </div>

      <div className="info-box">
        <p>📋 Provide detailed information about the proof of relation.</p>
      </div>
    </div>
  );
};
