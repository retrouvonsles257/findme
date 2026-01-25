import React from 'react';
import { UserProfileFormData } from './UserProfileFormValidation';

export interface UserProfileFormBasicProps {
  data: Partial<UserProfileFormData>;
  onChange: (field: keyof UserProfileFormData, value: any) => void;
  errors: Record<string, string>;
}

export const UserProfileFormBasic: React.FC<UserProfileFormBasicProps> = ({ data, onChange, errors }) => {
  return (
    <div>
      <h3>Basic Information</h3>

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
    </div>
  );
};
