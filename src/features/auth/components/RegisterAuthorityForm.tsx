/**
 * =====================================================
 * RETROUVONSLES - RegisterAuthorityForm Component
 * Formulaire d'inscription pour les autorités
 * =====================================================
 */

import React, { useState } from 'react';
import { useNotification } from '../../../contexts';
import { useRegister } from '../hooks';
import { TypeCompte } from '../../../@types/enums.types';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import styles from './RegisterForm.module.css';

export interface RegisterAuthorityFormProps {
  onSuccess?: () => void;
  onBack?: () => void;
  className?: string;
}

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  nomComplet: string;
  telephone: string;
  nomOrganisation: string;
  typeOrganisation: string;
  acceptTerms: boolean;
}

interface FieldErrors {
  [key: string]: string | undefined;
}

const RegisterAuthorityForm: React.FC<RegisterAuthorityFormProps> = ({
  onSuccess,
  onBack,
  className = ''
}) => {
  const notification = useNotification();
  const { register, isLoading } = useRegister();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    nomComplet: '',
    telephone: '',
    nomOrganisation: '',
    typeOrganisation: 'police',
    acceptTerms: false
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const showError = (title: string, message: string) => {
    notification.addNotification({
      title,
      message,
      type: 'error'
    });
  };

  const showSuccess = (title: string, message: string) => {
    notification.addNotification({
      title,
      message,
      type: 'success'
    });
  };

  const validateForm = (): boolean => {
    const errors: FieldErrors = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      errors.email = 'Email invalide';
    }

    // Password validation
    if (formData.password.length < 8) {
      errors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    // Name validation
    if (formData.nomComplet.length < 3) {
      errors.nomComplet = 'Le nom doit contenir au moins 3 caractères';
    }

    // Organization name validation
    if (formData.nomOrganisation.length < 3) {
      errors.nomOrganisation = 'Le nom de l\'organisation doit contenir au moins 3 caractères';
    }

    // Phone validation (format international)
    const phoneRegex = /^[\d\s\-+()]{10,}$/;
    if (!phoneRegex.test(formData.telephone.replace(/\s/g, ''))) {
      errors.telephone = 'Numéro de téléphone invalide';
    }

    // Terms acceptance
    if (!formData.acceptTerms) {
      errors.acceptTerms = 'Vous devez accepter les conditions';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.currentTarget as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const { user, error: registerError } = await register({
        email: formData.email,
        password: formData.password,
        nom_complet: formData.nomComplet,
        telephone: formData.telephone,
        type_compte: TypeCompte.AUTORITE,
        organisation_id: undefined // Will be created/associated in the backend
      });

      if (registerError) {
        showError('Inscription échouée', registerError.message || 'Une erreur est survenue');
        return;
      }

      if (user) {
        showSuccess(
          'Inscription réussie',
          'Vérifiez votre email pour confirmer votre compte'
        );

        // Reset form
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          nomComplet: '',
          telephone: '',
          nomOrganisation: '',
          typeOrganisation: 'police',
          acceptTerms: false
        });
        setFieldErrors({});

        setTimeout(() => onSuccess?.(), 1500);
      }
    } catch (err) {
      showError(
        'Erreur',
        err instanceof Error ? err.message : 'Une erreur est survenue'
      );
    }
  };

  return (
    <div className={`${styles.container} ${className}`}>
      <h1 className={styles.title}>Inscription - Autorité</h1>
      <p className={styles.subtitle}>
        Créez un compte pour votre organisation
      </p>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Nom Complet */}
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="nomComplet">
            Nom complet *
          </label>
          <input
            id="nomComplet"
            type="text"
            name="nomComplet"
            value={formData.nomComplet}
            onChange={handleChange}
            placeholder="Jean Dupont"
            className={`${styles.input} ${
              fieldErrors.nomComplet ? styles.inputError : ''
            }`}
            disabled={isLoading}
            required
          />
          {fieldErrors.nomComplet && (
            <p className={styles.fieldError}>{fieldErrors.nomComplet}</p>
          )}
        </div>

        {/* Nom Organisation */}
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="nomOrganisation">
            Nom de l'organisation *
          </label>
          <input
            id="nomOrganisation"
            type="text"
            name="nomOrganisation"
            value={formData.nomOrganisation}
            onChange={handleChange}
            placeholder="Police Nationale"
            className={`${styles.input} ${
              fieldErrors.nomOrganisation ? styles.inputError : ''
            }`}
            disabled={isLoading}
            required
          />
          {fieldErrors.nomOrganisation && (
            <p className={styles.fieldError}>
              {fieldErrors.nomOrganisation}
            </p>
          )}
        </div>

        {/* Type Organisation */}
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="typeOrganisation">
            Type d'organisation *
          </label>
          <select
            id="typeOrganisation"
            name="typeOrganisation"
            value={formData.typeOrganisation}
            onChange={handleChange}
            className={styles.input}
            disabled={isLoading}
            required
          >
            <option value="police">Police Nationale</option>
            <option value="gendarmerie">Gendarmerie</option>
            <option value="ong">ONG Humanitaire</option>
            <option value="croix_rouge">Croix-Rouge</option>
            <option value="protection_civile">Protection Civile</option>
            <option value="unicef">UNICEF</option>
            <option value="gouvernement">Gouvernement</option>
            <option value="autre">Autre</option>
          </select>
        </div>

        {/* Email */}
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="email">
            Email professionnel *
          </label>
          <input
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="votre@organisation.com"
            className={`${styles.input} ${
              fieldErrors.email ? styles.inputError : ''
            }`}
            disabled={isLoading}
            required
          />
          {fieldErrors.email && (
            <p className={styles.fieldError}>{fieldErrors.email}</p>
          )}
        </div>

        {/* Telephone */}
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="telephone">
            Téléphone professionnel *
          </label>
          <input
            id="telephone"
            type="tel"
            name="telephone"
            value={formData.telephone}
            onChange={handleChange}
            placeholder="+33 1 23 45 67 89"
            className={`${styles.input} ${
              fieldErrors.telephone ? styles.inputError : ''
            }`}
            disabled={isLoading}
            required
          />
          {fieldErrors.telephone && (
            <p className={styles.fieldError}>{fieldErrors.telephone}</p>
          )}
        </div>

        {/* Password */}
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="password">
            Mot de passe *
          </label>
          <input
            id="password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            className={`${styles.input} ${
              fieldErrors.password ? styles.inputError : ''
            }`}
            disabled={isLoading}
            required
          />
          {formData.password && (
            <PasswordStrengthIndicator password={formData.password} />
          )}
          {fieldErrors.password && (
            <p className={styles.fieldError}>{fieldErrors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="confirmPassword">
            Confirmer le mot de passe *
          </label>
          <input
            id="confirmPassword"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="••••••••"
            className={`${styles.input} ${
              fieldErrors.confirmPassword ? styles.inputError : ''
            }`}
            disabled={isLoading}
            required
          />
          {fieldErrors.confirmPassword && (
            <p className={styles.fieldError}>
              {fieldErrors.confirmPassword}
            </p>
          )}
        </div>

        {/* Accept Terms */}
        <div className={styles.checkboxGroup}>
          <input
            id="acceptTerms"
            type="checkbox"
            name="acceptTerms"
            checked={formData.acceptTerms}
            onChange={handleChange}
            disabled={isLoading}
            required
          />
          <label htmlFor="acceptTerms" className={styles.checkboxLabel}>
            J'accepte les conditions d'utilisation et la politique de
            confidentialité *
          </label>
        </div>
        {fieldErrors.acceptTerms && (
          <p className={styles.fieldError}>{fieldErrors.acceptTerms}</p>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className={styles.button}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className={styles.spinner}></span>
              Inscription en cours...
            </>
          ) : (
            'S\'inscrire'
          )}
        </button>
      </form>

      {onBack && (
        <button
          onClick={onBack}
          className={styles.backLink}
          disabled={isLoading}
          type="button"
        >
          ← Retour
        </button>
      )}
    </div>
  );
};

export default RegisterAuthorityForm;
