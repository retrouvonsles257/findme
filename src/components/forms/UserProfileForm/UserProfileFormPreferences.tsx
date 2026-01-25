import React from 'react';
import { UserProfileFormData } from './UserProfileFormValidation';

export interface UserProfileFormPreferencesProps {
  data: Partial<UserProfileFormData>;
  onChange: (field: keyof UserProfileFormData, value: boolean | string) => void;
}

export const UserProfileFormPreferences: React.FC<UserProfileFormPreferencesProps> = ({ data, onChange }) => {
  return (
    <div>
      <h3>Preferences</h3>

      <div className="form-group">
        <label htmlFor="language">Language</label>
        <select
          id="language"
          value={data.language || 'en'}
          onChange={(e) => onChange('language', e.target.value)}
        >
          <option value="en">English</option>
          <option value="fr">French</option>
          <option value="es">Spanish</option>
          <option value="de">German</option>
          <option value="it">Italian</option>
        </select>
      </div>

      <div className="form-group checkbox-group">
        <label>
          <input
            type="checkbox"
            checked={data.notifications || false}
            onChange={(e) => onChange('notifications', e.target.checked)}
          />
          <span>Enable notifications</span>
        </label>
      </div>

      <div className="form-group checkbox-group">
        <label>
          <input
            type="checkbox"
            checked={data.newsletter || false}
            onChange={(e) => onChange('newsletter', e.target.checked)}
          />
          <span>Subscribe to newsletter</span>
        </label>
      </div>

      <div className="form-group checkbox-group">
        <label>
          <input
            type="checkbox"
            checked={data.privacy || false}
            onChange={(e) => onChange('privacy', e.target.checked)}
          />
          <span>I agree to privacy policy</span>
        </label>
      </div>
    </div>
  );
};
