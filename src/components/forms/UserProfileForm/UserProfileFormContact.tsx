import React from 'react';
import { UserProfileFormData } from './UserProfileFormValidation';

export interface UserProfileFormContactProps {
  data: Partial<UserProfileFormData>;
  onChange: (field: keyof UserProfileFormData, value: string) => void;
  errors: Record<string, string>;
}

export const UserProfileFormContact: React.FC<UserProfileFormContactProps> = ({ data, onChange, errors }) => {
  return (
    <div>
      <h3>Contact Information</h3>

      <div className="form-group">
        <label htmlFor="email">Email *</label>
        <input
          id="email"
          type="email"
          value={data.email || ''}
          onChange={(e) => onChange('email', e.target.value)}
          placeholder="Enter email"
          className={errors.email ? 'input-error' : ''}
        />
        {errors.email && <span className="error-message">{errors.email}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="phone">Phone *</label>
        <input
          id="phone"
          type="tel"
          value={data.phone || ''}
          onChange={(e) => onChange('phone', e.target.value)}
          placeholder="Enter phone"
          className={errors.phone ? 'input-error' : ''}
        />
        {errors.phone && <span className="error-message">{errors.phone}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="address">Address</label>
        <input
          id="address"
          type="text"
          value={data.address || ''}
          onChange={(e) => onChange('address', e.target.value)}
          placeholder="Enter address"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="city">City</label>
          <input
            id="city"
            type="text"
            value={data.city || ''}
            onChange={(e) => onChange('city', e.target.value)}
            placeholder="Enter city"
          />
        </div>

        <div className="form-group">
          <label htmlFor="country">Country</label>
          <input
            id="country"
            type="text"
            value={data.country || ''}
            onChange={(e) => onChange('country', e.target.value)}
            placeholder="Enter country"
          />
        </div>
      </div>
    </div>
  );
};
