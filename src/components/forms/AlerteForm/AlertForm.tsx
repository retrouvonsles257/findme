import React, { useState } from 'react';
import styles from './AlerteForm.module.css';
import { AlerteFormContent } from './AlerteFormContent';
import { AlerteFormZone } from './AlerteFormZone';
import { AlerteFormSchedule } from './AlerteFormSchedule';
import { AlerteFormData, validateAlertForm } from './AlerteFormValidation';

export interface AlertFormProps {
  onSubmit: (data: AlerteFormData) => void;
}

export const AlertForm: React.FC<AlertFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<Partial<AlerteFormData>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState(1);

  const handleChange = (field: keyof AlerteFormData, value: string) => {
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

  const handleNextStep = () => {
    const newErrors = validateAlertForm(formData);
    if (Object.keys(newErrors).length === 0) {
      setStep(step + 1);
    } else {
      setErrors(newErrors);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validateAlertForm(formData);
    if (Object.keys(newErrors).length === 0) {
      onSubmit(formData as AlerteFormData);
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.alerteForm}>
      <div className={styles.formHeader}>
        <h2>Create Alert</h2>
        <p>Step {step} of 3</p>
      </div>

      <div className={styles.formContent}>
        {step === 1 && <AlerteFormContent data={formData} onChange={handleChange} errors={errors} />}
        {step === 2 && <AlerteFormZone data={formData} onChange={handleChange} errors={errors} />}
        {step === 3 && <AlerteFormSchedule data={formData} onChange={handleChange} errors={errors} />}
      </div>

      <div className={styles.formActions}>
        {step > 1 && (
          <button type="button" onClick={() => setStep(step - 1)} className={styles.secondaryBtn}>
            ← Previous
          </button>
        )}

        {step < 3 ? (
          <button type="button" onClick={handleNextStep} className={styles.primaryBtn}>
            Next →
          </button>
        ) : (
          <button type="submit" className={styles.primaryBtn}>
            Create Alert
          </button>
        )}
      </div>
    </form>
  );
};
