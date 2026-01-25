import React, { useState } from 'react';
import { PersonFormData, validatePersonForm } from './PersonFormValidation';
import { PersonFormStep1 } from './PersonFormStep1';
import { PersonFormStep2 } from './PersonFormStep2';
import { PersonFormStep3 } from './PersonFormStep3';
import styles from './PersonForm.module.css';

export interface PersonFormProps {
  onSubmit: (data: PersonFormData) => void;
  isLoading?: boolean;
}

export const PersonForm: React.FC<PersonFormProps> = ({ onSubmit, isLoading = false }) => {
  const [formData, setFormData] = useState<Partial<PersonFormData>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState(1);

  const handleChange = (field: keyof PersonFormData, value: any) => {
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

  const handleNext = () => {
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const handlePrev = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = validatePersonForm(formData);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (onSubmit) {
      onSubmit(formData as PersonFormData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formContainer}>
        <h2>Person Profile</h2>

        <div className={styles.stepIndicator}>
          <div className={step >= 1 ? styles.stepActive : ''}>Step 1</div>
          <div className={step >= 2 ? styles.stepActive : ''}>Step 2</div>
          <div className={step >= 3 ? styles.stepActive : ''}>Step 3</div>
        </div>

        <div className={styles.formSection}>
          {step === 1 && (
            <PersonFormStep1 data={formData} onChange={handleChange} errors={errors} />
          )}
          {step === 2 && (
            <PersonFormStep2 data={formData} onChange={handleChange} errors={errors} />
          )}
          {step === 3 && (
            <PersonFormStep3 data={formData} onChange={handleChange} errors={errors} />
          )}
        </div>

        <div className={styles.formActions}>
          {step > 1 && (
            <button type="button" onClick={handlePrev} className={styles.prevButton}>
              Previous
            </button>
          )}
          {step < 3 && (
            <button type="button" onClick={handleNext} className={styles.nextButton}>
              Next
            </button>
          )}
          {step === 3 && (
            <button type="submit" disabled={isLoading} className={styles.submitButton}>
              {isLoading ? 'Submitting...' : 'Submit'}
            </button>
          )}
        </div>
      </div>
    </form>
  );
};
