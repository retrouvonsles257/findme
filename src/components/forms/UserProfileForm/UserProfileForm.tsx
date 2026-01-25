import React, { useState } from 'react';
import { UserProfileFormData, UserProfileFormValidation } from './UserProfileFormValidation';
import { UserProfileFormBasic } from './UserProfileFormBasic';
import { UserProfileFormContact } from './UserProfileFormContact';
import { UserProfileFormPreferences } from './UserProfileFormPreferences';
import styles from './UserProfileForm.module.css';

export interface UserProfileFormProps {
  initialData?: Partial<UserProfileFormData>;
  onSubmit?: (data: UserProfileFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const UserProfileForm: React.FC<UserProfileFormProps> = ({
  initialData = {},
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<Partial<UserProfileFormData>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof UserProfileFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = UserProfileFormValidation(formData);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (onSubmit) {
      onSubmit(formData as UserProfileFormData);
    }
  };

  const handleReset = () => {
    setFormData(initialData);
    setErrors({});
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formContainer}>
        <h2>Edit Profile</h2>

        <div className={styles.formSection}>
          <UserProfileFormBasic
            data={formData}
            onChange={handleChange}
            errors={errors}
          />
        </div>

        <div className={styles.formSection}>
          <UserProfileFormContact
            data={formData}
            onChange={handleChange}
            errors={errors}
          />
        </div>

        <div className={styles.formSection}>
          <UserProfileFormPreferences
            data={formData}
            onChange={handleChange}
          />
        </div>

        <div className={styles.formActions}>
          <button
            type="submit"
            disabled={isLoading}
            className={styles.submitButton}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className={styles.resetButton}
          >
            Reset
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className={styles.cancelButton}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </form>
  );
};
