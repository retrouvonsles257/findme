import React, { useState } from 'react';
import { SignalementFormData, validateSignalementForm } from './SignalementFormValidation';
import { SignalementFormLocation } from './SignalementFormLocation';
import { SignalementFormObservation } from './SignalementFormObservation';
import { SignalementFormWitness } from './SignalementFormWitness';
import { SignalementFormPhotos } from './SignalementFormPhotos';
import styles from './SignalementForm.module.css';

export interface SignalementFormProps {
  onSubmit: (data: SignalementFormData) => void;
  isLoading?: boolean;
}

export const SignalementForm: React.FC<SignalementFormProps> = ({ onSubmit, isLoading = false }) => {
  const [formData, setFormData] = useState<Partial<SignalementFormData>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState(1);

  const handleChange = (field: keyof SignalementFormData, value: any) => {
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
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrev = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = validateSignalementForm(formData);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (onSubmit) {
      onSubmit(formData as SignalementFormData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formContainer}>
        <h2>Report Sighting</h2>

        <div className={styles.stepIndicator}>
          <div className={step >= 1 ? styles.stepActive : ''}>Location</div>
          <div className={step >= 2 ? styles.stepActive : ''}>Observation</div>
          <div className={step >= 3 ? styles.stepActive : ''}>Witness</div>
          <div className={step >= 4 ? styles.stepActive : ''}>Photos</div>
        </div>

        <div className={styles.formSection}>
          {step === 1 && (
            <SignalementFormLocation data={formData} onChange={handleChange} errors={errors} />
          )}
          {step === 2 && (
            <SignalementFormObservation data={formData} onChange={handleChange} errors={errors} />
          )}
          {step === 3 && (
            <SignalementFormWitness data={formData} onChange={handleChange} errors={errors} />
          )}
          {step === 4 && (
            <SignalementFormPhotos data={formData} onChange={handleChange} errors={errors} />
          )}
        </div>

        <div className={styles.formActions}>
          {step > 1 && (
            <button type="button" onClick={handlePrev} className={styles.prevButton}>
              Previous
            </button>
          )}
          {step < 4 && (
            <button type="button" onClick={handleNext} className={styles.nextButton}>
              Next
            </button>
          )}
          {step === 4 && (
            <button type="submit" disabled={isLoading} className={styles.submitButton}>
              {isLoading ? 'Submitting...' : 'Submit Report'}
            </button>
          )}
        </div>
      </div>
    </form>
  );
};
