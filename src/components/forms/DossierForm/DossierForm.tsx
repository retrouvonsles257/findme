import React, { useState } from 'react';
import styles from './DossierForm.module.css';
import { DossierFormPersonInfo } from './DossierFormPersonInfo';
import { DossierFormLocation } from './DossierFormLocation';
import { DossierFormCircumstances } from './DossierFormCircumstances';
import { DossierFormContact } from './DossierFormContact';
import { DossierFormData, validateDossierForm } from './DossierFormValidation';

export interface DossierFormProps {
  onSubmit: (data: DossierFormData) => void;
}

export const DossierForm: React.FC<DossierFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<Partial<DossierFormData>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof DossierFormData, value: any) => {
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
    const newErrors = validateDossierForm(formData);
    if (Object.keys(newErrors).length === 0) {
      onSubmit(formData as DossierFormData);
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.dossierForm}>
      <div className={styles.formHeader}>
        <h2>Create Missing Person Dossier</h2>
      </div>

      <div className={styles.formContent}>
        <DossierFormPersonInfo data={formData} onChange={handleChange} errors={errors} />
        <DossierFormLocation data={formData} onChange={handleChange} errors={errors} />
        <DossierFormCircumstances data={formData} onChange={handleChange} errors={errors} />
        <DossierFormContact data={formData} onChange={handleChange} errors={errors} />
      </div>

      <div className={styles.formActions}>
        <button type="submit" className={styles.primaryBtn}>
          Create Dossier
        </button>
      </div>
    </form>
  );
};
