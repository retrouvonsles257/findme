import React, { useState } from 'react';
import styles from './FiliationForm.module.css';
import { FiliationFormRelationType } from './FiliationFormRelationType';
import { FiliationFormProof } from './FiliationFormProof';
import { FiliationFormData, validateFiliationForm } from './FiliationFormValidation';

export interface FiliationFormProps {
  onSubmit: (data: FiliationFormData) => void;
}

export const FiliationForm: React.FC<FiliationFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<Partial<FiliationFormData>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof FiliationFormData, value: any) => {
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
    const newErrors = validateFiliationForm(formData);
    if (Object.keys(newErrors).length === 0) {
      onSubmit(formData as FiliationFormData);
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.filiationForm}>
      <div className={styles.formHeader}>
        <h2>Create Filiation Record</h2>
        <p>Establish family relations with proof</p>
      </div>

      <div className={styles.formContent}>
        <FiliationFormRelationType data={formData} onChange={handleChange} errors={errors} />
        <FiliationFormProof data={formData} onChange={handleChange} errors={errors} />
      </div>

      <div className={styles.formActions}>
        <button type="submit" className={styles.primaryBtn}>
          Submit Filiation
        </button>
      </div>
    </form>
  );
};
