/**
 * =====================================================
 * RETROUVONSLES - Hook useDonationCreate
 * Gestion de la création et traitement de dons
 * =====================================================
 */

import { useState, useCallback } from 'react';
import { useNotification } from '@/contexts';
import * as donService from '../services/donService';
import * as paymentService from '../services/paymentService';
import type { Don } from '../../../@types';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface UseDonationCreateState {
  formData: donService.DonFormData | null;
  validationErrors: donService.DonValidationErrors;
  isProcessing: boolean;
  isPaymentProcessing: boolean;
  error: string | null;
  createdDon: Don | null;
  paymentResult: paymentService.PaymentResult | null;
}

export interface UseDonationCreateActions {
  setFormData: (data: donService.DonFormData) => void;
  validateForm: (data: donService.DonFormData) => boolean;
  submitDonation: (data: donService.DonFormData) => Promise<Don>;
  processPayment: (donId: string, paymentData: paymentService.PaymentInitiation) => Promise<boolean>;
  resetForm: () => void;
  clearErrors: () => void;
}

export type UseDonationCreateReturn = UseDonationCreateState & UseDonationCreateActions;

// ============================================
// HOOK IMPLEMENTATION
// ============================================

/**
 * Hook personnalisé pour la création de dons
 */
export const useDonationCreate = (): UseDonationCreateReturn => {
  const [state, setState] = useState<UseDonationCreateState>({
    formData: null,
    validationErrors: {},
    isProcessing: false,
    isPaymentProcessing: false,
    error: null,
    createdDon: null,
    paymentResult: null,
  });

  const { addNotification } = useNotification();

  // ========== FORM MANAGEMENT ==========

  const setFormData = useCallback((data: donService.DonFormData) => {
    setState((prev) => ({
      ...prev,
      formData: data,
      validationErrors: {},
    }));
  }, []);

  const validateForm = useCallback((data: donService.DonFormData): boolean => {
    const errors = donService.validateDonForm(data);
    
    if (Object.keys(errors).length > 0) {
      setState((prev) => ({
        ...prev,
        validationErrors: errors,
      }));
      return false;
    }

    setState((prev) => ({
      ...prev,
      validationErrors: {},
    }));
    return true;
  }, []);

  // ========== DONATION SUBMISSION ==========

  const submitDonation = useCallback(
    async (data: donService.DonFormData): Promise<Don> => {
      try {
        // Valider d'abord
        if (!validateForm(data)) {
          throw new Error('Validation failed');
        }

        setState((prev) => ({
          ...prev,
          isProcessing: true,
          error: null,
        }));

        // Créer le don
        const don = await donService.createDraftDon(data);

        setState((prev) => ({
          ...prev,
          createdDon: don,
          formData: data,
          isProcessing: false,
        }));

        addNotification({
          title: 'Succès',
          message: 'Don créé avec succès',
          type: 'success',
        });

        return don;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur lors de la création';
        setState((prev) => ({
          ...prev,
          error: message,
          isProcessing: false,
        }));
        addNotification({
          title: 'Erreur',
          message,
          type: 'error',
        });
        throw err;
      }
    },
    [validateForm, addNotification],
  );

  // ========== PAYMENT PROCESSING ==========

  const processPayment = useCallback(
    async (donId: string, paymentData: paymentService.PaymentInitiation): Promise<boolean> => {
      try {
        setState((prev) => ({
          ...prev,
          isPaymentProcessing: true,
          error: null,
        }));

        // Valider les données de paiement
        const paymentErrors = paymentService.validatePaymentData(paymentData);
        if (paymentErrors.length > 0) {
          throw new Error(paymentErrors.join(', '));
        }

        // Initier le paiement
        const payment = await paymentService.initiatePayment(paymentData);

        // Traiter le callback (simulé)
        const verificationData: paymentService.PaymentVerification = {
          transactionId: payment.transactionId,
          referenceTransaction: `REF-${Date.now()}`,
        };

        const verificationResult = await paymentService.verifyPayment(verificationData);

        if (verificationResult.success) {
          // Mettre à jour le don avec le statut de paiement
          await paymentService.handlePaymentCallback(donId, {
            transactionId: payment.transactionId,
            status: 'reussi' as any,
            reference: verificationData.referenceTransaction,
          });

          setState((prev) => ({
            ...prev,
            paymentResult: verificationResult,
            isPaymentProcessing: false,
          }));

          addNotification({
            title: 'Succès',
            message: 'Paiement traité avec succès',
            type: 'success',
          });

          return true;
        } else {
          throw new Error(verificationResult.message);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur lors du paiement';
        setState((prev) => ({
          ...prev,
          error: message,
          isPaymentProcessing: false,
          paymentResult: {
            success: false,
            message,
          },
        }));
        addNotification({
          title: 'Erreur',
          message,
          type: 'error',
        });
        return false;
      }
    },
    [addNotification],
  );

  // ========== FORM RESET ==========

  const resetForm = useCallback(() => {
    setState((prev) => ({
      ...prev,
      formData: null,
      validationErrors: {},
      error: null,
      createdDon: null,
      paymentResult: null,
    }));
  }, []);

  const clearErrors = useCallback(() => {
    setState((prev) => ({
      ...prev,
      error: null,
      validationErrors: {},
    }));
  }, []);

  return {
    ...state,
    setFormData,
    validateForm,
    submitDonation,
    processPayment,
    resetForm,
    clearErrors,
  };
};
