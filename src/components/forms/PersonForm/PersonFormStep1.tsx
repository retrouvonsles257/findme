import React from 'react';
import { PersonFormData } from './PersonFormValidation';

export interface PersonFormStep1Props {
  data: Partial<PersonFormData>;
  onChange: (field: keyof PersonFormData, value: string) => void;
  errors: Record<string, string>;
}

export const PersonFormStep1: React.FC<PersonFormStep1Props> = ({ data, onChange, errors }) => {
  return (
    <div>
      <h3>Personal Information</h3>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="firstName">First Name *</label>
          <input
            id="firstName"
            type="text"
            value={data.firstName || ''}
            onChange={(e) => onChange('firstName', e.target.value)}
            placeholder="Enter first name"
            className={errors.firstName ? 'input-error' : ''}
          />
          {errors.firstName && <span className="error-message">{errors.firstName}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="lastName">Last Name *</label>
          <input
            id="lastName"
            type="text"
            value={data.lastName || ''}
            onChange={(e) => onChange('lastName', e.target.value)}
            placeholder="Enter last name"
            className={errors.lastName ? 'input-error' : ''}
          />
          {errors.lastName && <span className="error-message">{errors.lastName}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="dateOfBirth">Date of Birth *</label>
          <input
            id="dateOfBirth"
            type="date"
            value={data.dateOfBirth || ''}
            onChange={(e) => onChange('dateOfBirth', e.target.value)}
            className={errors.dateOfBirth ? 'input-error' : ''}
          />
          {errors.dateOfBirth && <span className="error-message">{errors.dateOfBirth}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="gender">Gender *</label>
          <select
            id="gender"
            value={data.gender || ''}
            onChange={(e) => onChange('gender', e.target.value)}
            className={errors.gender ? 'input-error' : ''}
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          {errors.gender && <span className="error-message">{errors.gender}</span>}
        </div>
      </div>
    </div>
  );
};
