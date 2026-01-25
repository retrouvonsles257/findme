/**
 * =====================================================
 * RETROUVONSLES - PersonneProfile Component
 * Main profile view with edit mode
 * =====================================================
 */

import React, { useEffect, useState } from 'react';
import { usePersonneDetail } from '../hooks/usePersonneDetail';
import type { PersonneUpdatePayload } from '../types';
import styles from './PersonneProfile.module.css';

export interface PersonneProfileProps {
  personneId: string;
  onUpdate?: () => void;
}

/**
 * PersonneProfile component
 */
export const PersonneProfile: React.FC<PersonneProfileProps> = ({ personneId, onUpdate }) => {
  const { personne, isLoading, error, fetchPersonne, updatePersonne } = usePersonneDetail();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<PersonneUpdatePayload>({});

  useEffect(() => {
    fetchPersonne(personneId);
  }, [personneId, fetchPersonne]);

  useEffect(() => {
    if (personne) {
      setFormData({
        nom: personne.nom,
        prenom: personne.prenom,
        nom_complet: personne.nom_complet,
        sexe: personne.sexe,
        date_naissance: personne.date_naissance?.toString().split('T')[0],
        description_physique: personne.description_physique,
        nationalite: personne.nationalite,
      });
    }
  }, [personne]);

  const handleSave = async () => {
    try {
      await updatePersonne(personneId, formData);
      setIsEditing(false);
      onUpdate?.();
    } catch (err) {
      console.error('Failed to update personne:', err);
    }
  };

  if (isLoading) return <div className={styles.loading}>Loading...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!personne) return <div className={styles.notFound}>Personne not found</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Person Profile</h2>
        <button
          className={styles.editButton}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      <div className={styles.content}>
        {isEditing ? (
          <div className={styles.formContainer}>
            <div className={styles.formGroup}>
              <label>First Name</label>
              <input
                type="text"
                value={formData.prenom || ''}
                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Last Name</label>
              <input
                type="text"
                value={formData.nom || ''}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Gender</label>
              <select
                value={formData.sexe || ''}
                onChange={(e) => setFormData({ ...formData, sexe: e.target.value as any })}
              >
                <option value="">Select...</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="U">Unknown</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Birth Date</label>
              <input
                type="date"
                value={formData.date_naissance || ''}
                onChange={(e) => setFormData({ ...formData, date_naissance: e.target.value })}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Physical Description</label>
              <textarea
                value={formData.description_physique || ''}
                onChange={(e) => setFormData({ ...formData, description_physique: e.target.value })}
                rows={4}
              />
            </div>
            <button className={styles.saveButton} onClick={handleSave}>
              Save
            </button>
          </div>
        ) : (
          <div className={styles.viewContainer}>
            <div className={styles.infoSection}>
              <div className={styles.infoGroup}>
                <span className={styles.label}>Full Name:</span>
                <span>{personne.nom_complet || `${personne.prenom} ${personne.nom}`}</span>
              </div>
              <div className={styles.infoGroup}>
                <span className={styles.label}>Gender:</span>
                <span>{personne.sexe}</span>
              </div>
              {personne.date_naissance && (
                <div className={styles.infoGroup}>
                  <span className={styles.label}>Birth Date:</span>
                  <span>{new Date(personne.date_naissance).toLocaleDateString()}</span>
                </div>
              )}
              {personne.nationalite && (
                <div className={styles.infoGroup}>
                  <span className={styles.label}>Nationality:</span>
                  <span>{personne.nationalite}</span>
                </div>
              )}
              {personne.description_physique && (
                <div className={styles.infoGroup}>
                  <span className={styles.label}>Physical Description:</span>
                  <span>{personne.description_physique}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
