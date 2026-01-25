/**
 * =====================================================
 * RETROUVONSLES - NewSignalement Component
 * Create new signalement form
 * =====================================================
 */

import React, { useState } from 'react';
import { useSignalementCreate } from '../hooks/useSignalementCreate';
import type { SignalementCreatePayload } from '../types';
import styles from './NewSignalement.module.css';

export interface NewSignalementProps {
  dossierId?: string;
  onSuccess?: () => void;
}

export const NewSignalement: React.FC<NewSignalementProps> = ({ dossierId, onSuccess }) => {
  const { isLoading, error, success, createSignalement, reset } = useSignalementCreate();
  const [formData, setFormData] = useState<Partial<SignalementCreatePayload>>({
    id_dossier: dossierId,
    description: '',
    lieu_observation: '',
    latitude_observation: 0,
    longitude_observation: 0,
    date_observation: new Date().toISOString().split('T')[0],
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'latitude_observation' || name === 'longitude_observation' ? parseFloat(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();

    try {
      await createSignalement(formData as SignalementCreatePayload, 'current-user-id');
      onSuccess?.();
      setFormData({
        id_dossier: dossierId,
        description: '',
        lieu_observation: '',
        latitude_observation: 0,
        longitude_observation: 0,
        date_observation: new Date().toISOString().split('T')[0],
      });
    } catch (err) {
      console.error('Error creating signalement:', err);
    }
  };

  return (
    <div className={styles.container}>
      <h2>Report New Sighting</h2>

      {success && <div className={styles.success}>Signalement created successfully!</div>}
      {error && <div className={styles.error}>Error: {error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="lieu_observation">Location</label>
          <input
            id="lieu_observation"
            type="text"
            name="lieu_observation"
            value={formData.lieu_observation || ''}
            onChange={handleInputChange}
            required
            placeholder="Where was the sighting?"
          />
        </div>

        <div className={styles.grid}>
          <div className={styles.formGroup}>
            <label htmlFor="latitude_observation">Latitude</label>
            <input
              id="latitude_observation"
              type="number"
              name="latitude_observation"
              value={formData.latitude_observation || ''}
              onChange={handleInputChange}
              step="0.0001"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="longitude_observation">Longitude</label>
            <input
              id="longitude_observation"
              type="number"
              name="longitude_observation"
              value={formData.longitude_observation || ''}
              onChange={handleInputChange}
              step="0.0001"
              required
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="date_observation">Date of Sighting</label>
          <input
            id="date_observation"
            type="date"
            name="date_observation"
            value={formData.date_observation || ''}
            onChange={handleInputChange}
            required
          />
        </div>



        <div className={styles.formGroup}>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description || ''}
            onChange={handleInputChange}
            required
            rows={4}
            placeholder="Describe what you saw..."
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="contexte_observation">Additional Notes (optional)</label>
          <textarea
            id="contexte_observation"
            name="contexte_observation"
            value={formData.contexte_observation || ''}
            onChange={handleInputChange}
            rows={3}
            placeholder="Any additional information..."
          />
        </div>

        <button type="submit" className={styles.submitButton} disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Signalement'}
        </button>
      </form>
    </div>
  );
};
