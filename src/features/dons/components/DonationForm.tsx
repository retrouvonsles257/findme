/**
 * =====================================================
 * RETROUVONSLES - DonationForm Component
 * Formulaire unifié : même rendu partout (connecté / non connecté).
 * Style maquette + champs adaptés au formulaire actuel.
 * ===================================================== */

import React, { useState, useCallback } from 'react';
import { TypeDon, MethodePaiement } from '../../../@types';
import { useDonationCreate } from '../hooks/useDonationCreate';
import * as donService from '../services/donService';
import styles from './DonationForm.module.css';

export interface DonationFormProps {
  onSuccess?: (donId: string) => void;
  onCancel?: () => void;
  prefilledAmount?: number;
  prefilledType?: string;
  showPaymentOptions?: boolean;
  availablePaymentMethods?: string[];
  className?: string;
}

const AMOUNT_PRESETS = [1000, 5000, 10000, 20000];

export const DonationForm: React.FC<DonationFormProps> = ({
  onSuccess,
  onCancel,
  prefilledAmount = 1000,
  prefilledType,
  showPaymentOptions = true,
  availablePaymentMethods,
  className = '',
}) => {
  const { validationErrors, isProcessing, processPayment, submitDonation, clearErrors } = useDonationCreate();
  const initialAmount = prefilledAmount || 1000;
  const [otherAmount, setOtherAmount] = useState(String(initialAmount));

  const [localFormData, setLocalFormData] = useState<donService.DonFormData>({
    montant: initialAmount,
    devise: 'XAF',
    type_don: prefilledType === 'mensuel' ? TypeDon.MENSUEL : TypeDon.PONCTUEL,
    methode_paiement: MethodePaiement.MOBILE_MONEY,
    mobile_money_operator: 'orange_money',
    donateur_anonyme: false,
    nom_donateur: '',
    email_donateur: '',
    telephone_donateur: '',
    organisation_donatrice: '',
    message_donateur: '',
  });

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const target = e.currentTarget;
      const { name, value, type } = target;
      const nextValue = type === 'checkbox' ? (target as HTMLInputElement).checked : value;
      setLocalFormData((prev) => ({ ...prev, [name]: nextValue }));
      if (validationErrors[name as keyof typeof validationErrors]) clearErrors();
    },
    [validationErrors, clearErrors],
  );

  /** Montant à payer : preset sélectionné, ou valeur "Autre montant" si l'utilisateur a saisi un montant. */
  const getAmount = useCallback(() => {
    if (otherAmount.trim()) {
      const raw = parseFloat(otherAmount.replace(/\s/g, '').replace(/\u202f/g, '')) || 0;
      return raw > 0 ? Math.round(raw / 5) * 5 : localFormData.montant;
    }
    return localFormData.montant;
  }, [otherAmount, localFormData.montant]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const montant = Math.max(5, getAmount());
      const data: donService.DonFormData = {
        ...localFormData,
        montant,
        devise: 'XAF',
        methode_paiement: MethodePaiement.MOBILE_MONEY,
        mobile_money_operator: localFormData.mobile_money_operator || 'orange_money',
      };
      try {
        const don = await submitDonation(data);
        if (showPaymentOptions) {
          const ok = await processPayment(don.id, {
            montant: data.montant,
            devise: data.devise,
            methode: MethodePaiement.MOBILE_MONEY,
            email: data.email_donateur || undefined,
            telephone: data.telephone_donateur || undefined,
            description: data.message_donateur || undefined,
            mobileMoneyOperator: data.mobile_money_operator,
          });
          if (!ok) return;
        }
        if (onSuccess) onSuccess(don.id);
      } catch {
        // error handled in hook
      }
    },
    [localFormData, getAmount, submitDonation, processPayment, showPaymentOptions, onSuccess],
  );

  const typeDon = localFormData.type_don === TypeDon.MENSUEL ? TypeDon.MENSUEL : TypeDon.PONCTUEL;

  return (
    <form onSubmit={handleSubmit} className={`${styles.donationForm} ${styles.unified} ${className}`}>
      {/* Ligne 1 : Type + Montant (côte à côte sur desktop) */}
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.maquetteLabel}>Type de don</label>
          <div className={styles.typeDonRow}>
            <button
              type="button"
              className={`${styles.typeDonBtn} ${typeDon === TypeDon.PONCTUEL ? styles.typeDonBtnActive : ''}`}
              onClick={() => setLocalFormData((p) => ({ ...p, type_don: TypeDon.PONCTUEL }))}
              disabled={isProcessing}
            >
              Ponctuel
            </button>
            <button
              type="button"
              className={`${styles.typeDonBtn} ${typeDon === TypeDon.MENSUEL ? styles.typeDonBtnActive : ''}`}
              onClick={() => setLocalFormData((p) => ({ ...p, type_don: TypeDon.MENSUEL }))}
              disabled={isProcessing}
            >
              Mensuel
            </button>
          </div>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.maquetteLabel}>Montant (XAF)</label>
          <div className={styles.amountPresets}>
            {AMOUNT_PRESETS.map((a) => (
              <button
                key={a}
                type="button"
                className={`${styles.presetBtn} ${getAmount() === a ? styles.presetBtnActive : ''}`}
                onClick={() => {
                  setLocalFormData((p) => ({ ...p, montant: a }));
                  setOtherAmount(String(a));
                }}
                disabled={isProcessing}
              >
                {a.toLocaleString('fr-FR')}
              </button>
            ))}
          </div>
          <div className={styles.otherAmountRow}>
            <input
              type="text"
              inputMode="numeric"
              placeholder="— — .."
              value={otherAmount}
              onChange={(e) => {
                const v = e.target.value;
                setOtherAmount(v);
                const n = parseFloat(v.replace(/\s/g, '').replace(/\u202f/g, '')) || 0;
                if (n > 0) setLocalFormData((p) => ({ ...p, montant: Math.round(n / 5) * 5 }));
              }}
              className={styles.otherAmountInput}
              disabled={isProcessing}
            />
            <span className={styles.xafSuffix}>XAF</span>
          </div>
        </div>
      </div>

      {/* Ligne 2 : Paiement + Téléphone (côte à côte sur desktop) */}
      <div className={styles.formRow}>
        {showPaymentOptions && (
          <div className={styles.formGroup}>
            <label className={styles.maquetteLabel}>Méthode de paiement</label>
            <div className={styles.paymentCards}>
              <button
                type="button"
                className={`${styles.paymentCard} ${(localFormData.mobile_money_operator || 'orange_money') === 'orange_money' ? styles.paymentCardActive : ''}`}
                onClick={() => setLocalFormData((p) => ({ ...p, mobile_money_operator: 'orange_money' }))}
                disabled={isProcessing}
              >
                <span className={styles.paymentCardLogo}>Orange Money</span>
                {(localFormData.mobile_money_operator || 'orange_money') === 'orange_money' && (
                  <span className={styles.paymentCardCheck}>✓</span>
                )}
              </button>
              <button
                type="button"
                className={`${styles.paymentCard} ${localFormData.mobile_money_operator === 'mtn_momo' ? styles.paymentCardActive : ''}`}
                onClick={() => setLocalFormData((p) => ({ ...p, mobile_money_operator: 'mtn_momo' }))}
                disabled={isProcessing}
              >
                <span className={styles.paymentCardLogo}>MTN MoMo</span>
                {localFormData.mobile_money_operator === 'mtn_momo' && (
                  <span className={styles.paymentCardCheck}>✓</span>
                )}
              </button>
            </div>
            <p className={styles.paymentHint}>CARTE / PAYPAL</p>
          </div>
        )}
        <div className={styles.formGroup}>
          <label htmlFor="telephone_donateur" className={styles.maquetteLabel}>Téléphone</label>
          <div className={styles.phonePrefixGroup}>
            <span className={styles.phonePrefix}>+237</span>
            <input
              id="telephone_donateur"
              type="tel"
              name="telephone_donateur"
              value={localFormData.telephone_donateur}
              onChange={handleInputChange}
              placeholder="6XX XXX XXX"
              className={validationErrors.telephone_donateur ? styles.error : ''}
              disabled={isProcessing}
              required
            />
          </div>
          {validationErrors.telephone_donateur && (
            <span className={styles.errorText}>{validationErrors.telephone_donateur}</span>
          )}
        </div>
      </div>

      {/* Anonyme */}
      <div className={styles.formGroup}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            name="donateur_anonyme"
            checked={localFormData.donateur_anonyme}
            onChange={handleInputChange}
            disabled={isProcessing}
          />
          Faire un don de manière anonyme
        </label>
      </div>

      {/* Champs donateur si non anonyme (grille 2 col sur desktop) */}
      {!localFormData.donateur_anonyme && (
        <div className={styles.donorFields}>
          <div className={styles.formGroup}>
            <label htmlFor="nom_donateur" className={styles.maquetteLabel}>Nom *</label>
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
              <span className={styles.errorText}>{validationErrors.nom_donateur}</span>
            )}
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="email_donateur" className={styles.maquetteLabel}>Email</label>
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
              <span className={styles.errorText}>{validationErrors.email_donateur}</span>
            )}
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="organisation_donatrice" className={styles.maquetteLabel}>Organisation</label>
            <input
              id="organisation_donatrice"
              type="text"
              name="organisation_donatrice"
              value={localFormData.organisation_donatrice}
              onChange={handleInputChange}
              disabled={isProcessing}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="message_donateur" className={styles.maquetteLabel}>Message</label>
            <textarea
              id="message_donateur"
              name="message_donateur"
              value={localFormData.message_donateur}
              onChange={handleInputChange}
              rows={1}
              disabled={isProcessing}
              className={styles.messageInput}
            />
          </div>
        </div>
      )}

      {/* CTA */}
      <button type="submit" className={styles.maquetteSubmitBtn} disabled={isProcessing}>
        <span className={styles.heartIcon}>♥</span> Faire un don maintenant
      </button>

      {onCancel && (
        <button type="button" className={styles.cancelBtn} onClick={onCancel} disabled={isProcessing}>
          Annuler
        </button>
      )}

      <p className={styles.maquetteDisclaimer}>
        En cliquant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité. Vos données sont traitées de manière sécurisée.
      </p>
    </form>
  );
};

export default DonationForm;
