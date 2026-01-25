import React from 'react';
import { FiliationFormData } from './FiliationFormValidation';

export interface FiliationFormRelationTypeProps {
  data: Partial<FiliationFormData>;
  onChange: (field: keyof FiliationFormData, value: any) => void;
  errors: Record<string, string>;
}

export const FiliationFormRelationType: React.FC<FiliationFormRelationTypeProps> = ({
  data,
  onChange,
  errors,
}) => {
  return (
    <div>
      <h3>Person Information</h3>

      <div className="form-group">
        <label htmlFor="person1Name">First Person Name *</label>
        <input
          id="person1Name"
          type="text"
          value={data.person1Name || ''}
          onChange={(e) => onChange('person1Name', e.target.value)}
          placeholder="Enter first person's name"
          className={errors.person1Name ? 'input-error' : ''}
        />
        {errors.person1Name && <span className="error-message">{errors.person1Name}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="person1Age">First Person Age *</label>
        <input
          id="person1Age"
          type="number"
          value={data.person1Age || ''}
          onChange={(e) => onChange('person1Age', parseInt(e.target.value) || 0)}
          placeholder="Enter age"
          className={errors.person1Age ? 'input-error' : ''}
        />
        {errors.person1Age && <span className="error-message">{errors.person1Age}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="person2Name">Second Person Name *</label>
        <input
          id="person2Name"
          type="text"
          value={data.person2Name || ''}
          onChange={(e) => onChange('person2Name', e.target.value)}
          placeholder="Enter second person's name"
          className={errors.person2Name ? 'input-error' : ''}
        />
        {errors.person2Name && <span className="error-message">{errors.person2Name}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="person2Age">Second Person Age *</label>
        <input
          id="person2Age"
          type="number"
          value={data.person2Age || ''}
          onChange={(e) => onChange('person2Age', parseInt(e.target.value) || 0)}
          placeholder="Enter age"
          className={errors.person2Age ? 'input-error' : ''}
        />
        {errors.person2Age && <span className="error-message">{errors.person2Age}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="relationType">Relation Type *</label>
        <select
          id="relationType"
          value={data.relationType || ''}
          onChange={(e) => onChange('relationType', e.target.value)}
          className={errors.relationType ? 'input-error' : ''}
        >
          <option value="">Select relation type</option>
          <option value="parent_child">Parent & Child</option>
          <option value="sibling">Siblings</option>
          <option value="other">Other</option>
        </select>
        {errors.relationType && <span className="error-message">{errors.relationType}</span>}
      </div>
    </div>
  );
};
