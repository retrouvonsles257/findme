/**
 * =====================================================
 * RETROUVONSLES - DonationForm Component
 * Formulaire de création/édition de don
 * =====================================================
 */

import React, { useState, useCallback } from 'react';
import { useDonationCreate } from '../hooks/useDonationCreate';
import * as donService from '../services/donService';
import styles from './DonationForm.module.css';

// ============================================
// COMPONENT PROPS
// ============================================

export interface DonationFormProps {
  onSuccess?: (donId: string) => void;
  onCancel?: () => void;
  prefilledAmount?: number;
  prefilledType?: string;
  showPaymentOptions?: boolean;
  /**
   * Permet de restreindre les méthodes affichées (ex: ['mobile_money'] pour Citizen).
   * Si non fourni, toutes les options sont disponibles.
   */
  availablePaymentMethods?: string[];
  className?: string;
}

// ============================================
// COMPONENT
// ============================================

/**
 * Composant formulaire de don
 */
export const DonationForm: React.FC<DonationFormProps> = ({
  onSuccess,
  onCancel,
  prefilledAmount,
  prefilledType,
  showPaymentOptions = true,
  availablePaymentMethods,
  className = '',
}) => {
  const {
    validationErrors,
    isProcessing,
    processPayment,
    submitDonation,
    clearErrors,
  } = useDonationCreate();

  const defaultPaymentMethod =
    availablePaymentMethods && availablePaymentMethods.length > 0
      ? availablePaymentMethods[0]
      : 'carte_bancaire';

  const [localFormData, setLocalFormData] = useState<donService.DonFormData>({
    montant: prefilledAmount || 0,
    devise: 'XAF',
    type_don: (prefilledType as any) || 'ponctuel',
    methode_paiement: defaultPaymentMethod,
    mobile_money_operator: 'mtn_momo',
    donateur_anonyme: false,
    nom_donateur: '',
    email_donateur: '',
    telephone_donateur: '',
    organisation_donatrice: '',
    message_donateur: '',
  });

  // ========== FIELD HANDLERS ==========

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.currentTarget;

      setLocalFormData((prev) => ({
        ...prev,
        [name]:
          type === 'checkbox' ? (e.currentTarget as HTMLInputElement).checked : value,
      }));

      // Nettoyer l'erreur du champ
      if (validationErrors[name as keyof typeof validationErrors]) {
        clearErrors();
      }
    },
    [validationErrors, clearErrors],
  );

  const handleNumberChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.currentTarget;
      setLocalFormData((prev) => ({
        ...prev,
        [name]: parseFloat(value) || 0,
      }));
    },
    [],
  );

  // ========== FORM SUBMISSION ==========

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      try {
        const don = await submitDonation(localFormData);

        // Traiter le paiement (simulé) si on affiche les options de paiement
        // -> met à jour statut_paiement, date_traitement, reference_transaction, etc.
        if (showPaymentOptions) {
          const ok = await processPayment(don.id, {
            montant: localFormData.montant,
            devise: localFormData.devise,
            methode: localFormData.methode_paiement as any,
            email: localFormData.email_donateur || undefined,
            telephone: localFormData.telephone_donateur || undefined,
            description: localFormData.message_donateur || undefined,
            mobileMoneyOperator: localFormData.mobile_money_operator,
          });
          if (!ok) return;
        }

        if (onSuccess) onSuccess(don.id);
      } catch (error) {
        // L'erreur est déjà gérée par le hook
      }
    },
    [localFormData, submitDonation, processPayment, onSuccess, showPaymentOptions],
  );

  // ========== RENDER ==========

  return (
    <form onSubmit={handleSubmit} className={`${styles.donationForm} ${className}`}>
      {/* Montant */}
      <div className={styles.formGroup}>
        <label htmlFor="montant">Montant du don *</label>
        <div className={styles.inputGroup}>
          <input
            id="montant"
            type="number"
            name="montant"
            min="1"
            max="1000000"
            step="100"
            value={localFormData.montant}
            onChange={handleNumberChange}
            className={validationErrors.montant ? styles.error : ''}
            required
            disabled={isProcessing}
          />
          <select
            name="devise"
            value={localFormData.devise}
            onChange={handleInputChange}
            disabled={isProcessing}
          >
            <option value="XAF">XAF (Franc CFA)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
          </select>
        </div>
        {validationErrors.montant && (
          <span className={styles.error}>{validationErrors.montant}</span>
        )}
      </div>

      {/* Type de don */}
      <div className={styles.formGroup}>
        <label htmlFor="type_don">Type de don *</label>
        <select
          id="type_don"
          name="type_don"
          value={localFormData.type_don}
          onChange={handleInputChange}
          className={validationErrors.type_don ? styles.error : ''}
          required
          disabled={isProcessing}
        >
          <option value="ponctuel">Ponctuel</option>
          <option value="mensuel">Mensuel</option>
          <option value="annuel">Annuel</option>
          <option value="entreprise">Entreprise</option>
          <option value="fondation">Fondation</option>
        </select>
        {validationErrors.type_don && (
          <span className={styles.error}>{validationErrors.type_don}</span>
        )}
      </div>

      {/* Donateur anonyme */}
      <div className={styles.formGroup}>
        <label>
          <input
            type="checkbox"
            name="donateur_anonyme"
            checked={localFormData.donateur_anonyme}
            onChange={handleInputChange}
            disabled={isProcessing}
          />
          Faire un don anonyme
        </label>
      </div>

      {/* Informations donateur */}
      {!localFormData.donateur_anonyme && (
        <>
          <div className={styles.formGroup}>
            <label htmlFor="nom_donateur">Nom *</label>
            <input
              id="nom_donateur"
              type="text"
              name="nom_donateur"
              value={localFormData.nom_donateur}
              onChange={handleInputChange}
              className={validationErrors.nom_donateur ? styles.error : ''}
              required
              disabled={isProcessing}
            />
            {validationErrors.nom_donateur && (
              <span className={styles.error}>{validationErrors.nom_donateur}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email_donateur">Email</label>
            <input
              id="email_donateur"
              type="email"
              name="email_donateur"
              value={localFormData.email_donateur}
              onChange={handleInputChange}
              className={validationErrors.email_donateur ? styles.error : ''}
              disabled={isProcessing}
            />
            {validationErrors.email_donateur && (
              <span className={styles.error}>{validationErrors.email_donateur}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="organisation_donatrice">Organisation (optionnel)</label>
            <input
              id="organisation_donatrice"
              type="text"
              name="organisation_donatrice"
              value={localFormData.organisation_donatrice}
              onChange={handleInputChange}
              disabled={isProcessing}
            />
          </div>
        </>
      )}

      {/* Téléphone (toujours disponible, requis pour Mobile Money) */}
      <div className={styles.formGroup}>
        <label htmlFor="telephone_donateur">
          Téléphone{localFormData.methode_paiement === 'mobile_money' ? ' *' : ''}
        </label>
        <input
          id="telephone_donateur"
          type="tel"
          name="telephone_donateur"
          value={localFormData.telephone_donateur}
          onChange={handleInputChange}
          className={validationErrors.telephone_donateur ? styles.error : ''}
          disabled={isProcessing}
          required={localFormData.methode_paiement === 'mobile_money'}
        />
        {validationErrors.telephone_donateur && (
          <span className={styles.error}>{validationErrors.telephone_donateur}</span>
        )}
      </div>

      {/* Message */}
      <div className={styles.formGroup}>
        <label htmlFor="message_donateur">Message (optionnel)</label>
        <textarea
          id="message_donateur"
          name="message_donateur"
          value={localFormData.message_donateur}
          onChange={handleInputChange}
          rows={4}
          disabled={isProcessing}
        />
      </div>

      {/* Méthode de paiement */}
      {showPaymentOptions && (
        <div className={styles.formGroup}>
          <label htmlFor="methode_paiement">Méthode de paiement *</label>
          <select
            id="methode_paiement"
            name="methode_paiement"
            value={localFormData.methode_paiement}
            onChange={handleInputChange}
            className={validationErrors.methode_paiement ? styles.error : ''}
            required
            disabled={isProcessing}
          >
            {(!availablePaymentMethods || availablePaymentMethods.includes('carte_bancaire')) && (
              <option value="carte_bancaire">Carte Bancaire</option>
            )}
            {(!availablePaymentMethods || availablePaymentMethods.includes('mobile_money')) && (
              <option value="mobile_money">Mobile Money</option>
            )}
            {(!availablePaymentMethods || availablePaymentMethods.includes('virement')) && (
              <option value="virement">Virement</option>
            )}
            {(!availablePaymentMethods || availablePaymentMethods.includes('paypal')) && (
              <option value="paypal">PayPal</option>
            )}
            {(!availablePaymentMethods || availablePaymentMethods.includes('autre')) && (
              <option value="autre">Autre</option>
            )}
          </select>
          {validationErrors.methode_paiement && (
            <span className={styles.error}>{validationErrors.methode_paiement}</span>
          )}
        </div>
      )}

      {/* Mobile Money: opérateur */}
      {showPaymentOptions && localFormData.methode_paiement === 'mobile_money' && (
        <div className={styles.formGroup}>
          <label htmlFor="mobile_money_operator">Opérateur Mobile Money *</label>
          <select
            id="mobile_money_operator"
            name="mobile_money_operator"
            value={localFormData.mobile_money_operator || 'mtn_momo'}
            onChange={handleInputChange}
            required
            disabled={isProcessing}
          >
            <option value="mtn_momo">MTN MoMo</option>
            <option value="orange_money">Orange Money</option>
          </select>
        </div>
      )}

      {/* Boutons */}
      <div className={styles.formActions}>
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={isProcessing}
        >
          {isProcessing ? 'Traitement...' : 'Continuer'}
        </button>
        {onCancel && (
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onCancel}
            disabled={isProcessing}
          >
            Annuler
          </button>
        )}
      </div>
    </form>
  );
};

export default DonationForm;
