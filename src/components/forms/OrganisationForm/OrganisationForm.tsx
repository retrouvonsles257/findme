import React, { useState } from 'react';
import styles from './OrganisationForm.module.css';
import { OrganisationFormInfo } from './OrganisationFormInfo';
import { OrganisationFormContact } from './OrganisationFormContact';
import { OrganisationFormData, validateOrganisationForm } from './OrganisationFormValidation';

export interface OrganisationFormProps {
  onSubmit: (data: OrganisationFormData) => void;
}

export const OrganisationForm: React.FC<OrganisationFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<Partial<OrganisationFormData>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof OrganisationFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validateOrganisationForm(formData);
    if (Object.keys(newErrors).length === 0) {
      onSubmit(formData as OrganisationFormData);
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.organisationForm}>
      <div className={styles.formHeader}>
        <h2>Register Organization</h2>
      </div>

      <div className={styles.formContent}>
        <OrganisationFormInfo data={formData} onChange={handleChange} errors={errors} />
        <OrganisationFormContact data={formData} onChange={handleChange} errors={errors} />
      </div>

      <div className={styles.formActions}>
        <button type="submit" className={styles.primaryBtn}>
          Register Organization
        </button>
      </div>
    </form>
  );
};
