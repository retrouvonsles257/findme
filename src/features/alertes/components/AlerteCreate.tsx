/**
 * =====================================================
 * RETROUVONSLES - AlerteCreate Component
 * Formulaire de création d'alerte
 * =====================================================
 */

import React, { useState, useCallback } from 'react';
import styles from './AlerteCreate.module.css';
import { useAlertes } from '../hooks/useAlertes';
import { useNotification } from '../../../contexts';
import type { AlerteFormData } from '../services/alerteService';
import type { TypeAlerte } from '../../../@types/enums.types';
import { TypeAlerte as TypeAlerteEnum } from '../../../@types/enums.types';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface AlerteCreateProps {
  dossierId: string;
  onSuccess?: (alerteId: string) => void;
  onCancel?: () => void;
}

// ============================================
// COMPONENT
// ============================================

export const AlerteCreate: React.FC<AlerteCreateProps> = ({
  dossierId,
  onSuccess,
  onCancel,
}) => {
  const { createDraft, createAndBroadcast } = useAlertes();
  const { addNotification } = useNotification();

  const [formData, setFormData] = useState<AlerteFormData>({
    titre: '',
    message: '',
    type_alerte: TypeAlerteEnum.DISPARITION_STANDARD,
    id_dossier: dossierId,
    rayon_km: 50,
    canaux_diffusion: ['push', 'in_app'],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publishImmediately, setPublishImmediately] = useState(false);

  // ========== HANDLERS ==========

  const handleInputChange = useCallback(
    (field: keyof AlerteFormData, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      // Clear error for this field
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [errors],
  );

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.titre.trim()) {
      newErrors.titre = 'Le titre est requis';
    }
    if (formData.titre.length > 255) {
      newErrors.titre = 'Le titre ne peut pas dépasser 255 caractères';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Le message est requis';
    }
    if (formData.message.length > 5000) {
      newErrors.message = 'Le message ne peut pas dépasser 5000 caractères';
    }

    if (formData.rayon_km && (formData.rayon_km < 1 || formData.rayon_km > 500)) {
      newErrors.rayon_km = 'Le rayon doit être entre 1 et 500 km';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      addNotification({
        title: 'Validation échouée',
        message: 'Veuillez corriger les erreurs',
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (publishImmediately) {
        const alerte = await createAndBroadcast(formData);
        onSuccess?.(alerte.id);
      } else {
        const alerte = await createDraft(formData);
        onSuccess?.(alerte.id);
      }
    } catch (err) {
      console.error('Erreur lors de la création:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ========== RENDER ==========

  const typeAlerteOptions: Array<{ value: TypeAlerte; label: string }> = [
    { value: TypeAlerteEnum.AMBER_ALERT, label: 'AMBER Alert' },
    { value: TypeAlerteEnum.DISPARITION_ENFANT, label: 'Disparition d\'enfant' },
    { value: TypeAlerteEnum.DISPARITION_ADULTE_VULNERABLE, label: 'Adulte vulnérable' },
    { value: TypeAlerteEnum.DISPARITION_STANDARD, label: 'Disparition standard' },
    { value: TypeAlerteEnum.MISE_A_JOUR, label: 'Mise à jour' },
    { value: TypeAlerteEnum.PERSONNE_RETROUVEE, label: 'Personne retrouvée' },
  ];

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Créer une nouvelle alerte</h2>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Titre */}
        <div className={styles.formGroup}>
          <label htmlFor="titre" className={styles.label}>
            Titre *
          </label>
          <input
            id="titre"
            type="text"
            value={formData.titre}
            onChange={(e) => handleInputChange('titre', e.target.value)}
            placeholder="Ex: Disparition suspecte à Douala"
            maxLength={255}
            className={`${styles.input} ${errors.titre ? styles.inputError : ''}`}
          />
          {errors.titre && <span className={styles.error}>{errors.titre}</span>}
          <small className={styles.charCount}>
            {formData.titre.length}/255
          </small>
        </div>

        {/* Type d'alerte */}
        <div className={styles.formGroup}>
          <label htmlFor="type_alerte" className={styles.label}>
            Type d'alerte *
          </label>
          <select
            id="type_alerte"
            value={formData.type_alerte}
            onChange={(e) => handleInputChange('type_alerte', e.target.value as TypeAlerte)}
            className={styles.select}
          >
            {typeAlerteOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Message */}
        <div className={styles.formGroup}>
          <label htmlFor="message" className={styles.label}>
            Message détaillé *
          </label>
          <textarea
            id="message"
            value={formData.message}
            onChange={(e) => handleInputChange('message', e.target.value)}
            placeholder="Décrivez en détail la disparition, les circonstances..."
            maxLength={5000}
            rows={6}
            className={`${styles.textarea} ${errors.message ? styles.inputError : ''}`}
          />
          {errors.message && <span className={styles.error}>{errors.message}</span>}
          <small className={styles.charCount}>
            {formData.message.length}/5000
          </small>
        </div>

        {/* Rayon de diffusion */}
        <div className={styles.formGroup}>
          <label htmlFor="rayon_km" className={styles.label}>
            Rayon de diffusion (km)
          </label>
          <input
            id="rayon_km"
            type="number"
            min="1"
            max="500"
            value={formData.rayon_km || 50}
            onChange={(e) => handleInputChange('rayon_km', parseInt(e.target.value))}
            className={`${styles.input} ${errors.rayon_km ? styles.inputError : ''}`}
          />
          {errors.rayon_km && <span className={styles.error}>{errors.rayon_km}</span>}
        </div>

        {/* Canaux de diffusion */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Canaux de diffusion</label>
          <div className={styles.checkboxGroup}>
            {['push', 'in_app', 'email', 'sms'].map((canal) => (
              <label key={canal} className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={formData.canaux_diffusion?.includes(canal) || false}
                  onChange={(e) => {
                    const newCanaux = e.target.checked
                      ? [...(formData.canaux_diffusion || []), canal]
                      : (formData.canaux_diffusion || []).filter((c) => c !== canal);
                    handleInputChange('canaux_diffusion', newCanaux);
                  }}
                />
                {canal.charAt(0).toUpperCase() + canal.slice(1)}
              </label>
            ))}
          </div>
        </div>

        {/* Publish immediately */}
        <div className={styles.formGroup}>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={publishImmediately}
              onChange={(e) => setPublishImmediately(e.target.checked)}
            />
            Publier et diffuser immédiatement
          </label>
          <small className={styles.hint}>
            Si décoché, l'alerte sera créée en brouillon pour édition ultérieure
          </small>
        </div>

        {/* Buttons */}
        <div className={styles.formActions}>
          <button
            type="button"
            onClick={onCancel}
            className={styles.buttonSecondary}
            disabled={isSubmitting}
          >
            Annuler
          </button>
          <button
            type="submit"
            className={styles.buttonPrimary}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Création en cours...'
              : publishImmediately
                ? 'Créer et diffuser'
                : 'Créer en brouillon'}
          </button>
        </div>
      </form>
    </div>
  );
};

AlerteCreate.displayName = 'AlerteCreate';
