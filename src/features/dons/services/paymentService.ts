/**
 * =====================================================
 * RETROUVONSLES - Don Payment Service
 * Gestion des paiements et transactions
 * =====================================================
 */

import type { Don, MethodePaiement, StatutPaiement } from '../../../@types';
import * as donAPI from './donAPI';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface PaymentInitiation {
  montant: number;
  devise: string;
  methode: MethodePaiement;
  email?: string;
  telephone?: string;
  description?: string;
  mobileMoneyOperator?: 'mtn_momo' | 'orange_money';
}

export interface PaymentVerification {
  transactionId: string;
  referenceTransaction: string;
}

export interface PaymentResult {
  success: boolean;
  donId?: string;
  transactionId?: string;
  message: string;
  code?: string;
}

// ============================================
// PAYMENT GATEWAY INTEGRATION
// ============================================

/**
 * Initialiser un paiement (mock)
 */
export const initiatePayment = async (
  input: PaymentInitiation,
): Promise<{ transactionId: string; redirectUrl?: string }> => {
  // TODO: Intégrer avec la vraie passerelle de paiement
  // (Stripe, PayPal, Mobile Money, etc.)

  const transactionId = `TRX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Simuler différentes méthodes de paiement
  switch (input.methode) {
    case 'carte_bancaire':
      return {
        transactionId,
        redirectUrl: `https://payment.example.com/card?transactionId=${transactionId}`,
      };

    case 'mobile_money':
      return {
        transactionId,
        redirectUrl: `https://payment.example.com/momo?transactionId=${transactionId}`,
      };

    case 'paypal':
      return {
        transactionId,
        redirectUrl: `https://paypal.example.com/checkout?transactionId=${transactionId}`,
      };

    case 'virement':
      return {
        transactionId,
        redirectUrl: `https://bank.example.com/transfer?transactionId=${transactionId}`,
      };

    default:
      return { transactionId };
  }
};

/**
 * Vérifier le statut d'un paiement
 */
export const verifyPayment = async (
  verificationData: PaymentVerification,
): Promise<PaymentResult> => {
  try {
    // TODO: Vérifier auprès de la passerelle de paiement
    // Pour maintenant, on simule un paiement réussi

    return {
      success: true,
      transactionId: verificationData.transactionId,
      message: 'Paiement vérifié avec succès',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erreur lors de la vérification',
    };
  }
};

/**
 * Traiter le callback d'un paiement
 */
export const handlePaymentCallback = async (
  donId: string,
  paymentData: {
    transactionId: string;
    status: StatutPaiement;
    reference?: string;
  },
): Promise<Don> => {
  return donAPI.updateDonPaymentStatus(donId, paymentData.status, paymentData.reference);
};

/**
 * Rembourser un paiement
 */
export const refundPayment = async (donId: string): Promise<PaymentResult> => {
  try {
    const don = await donAPI.getDonById(donId);

    if (don.statut_paiement !== 'reussi') {
      return {
        success: false,
        message: 'Seuls les paiements réussis peuvent être remboursés',
      };
    }

    // TODO: Appeler la passerelle de paiement pour le remboursement
    const refundedDon = await donAPI.updateDon(donId, {
      statut_paiement: 'rembourse' as any,
    });

    return {
      success: true,
      donId: refundedDon.id,
      transactionId: don.reference_transaction || undefined,
      message: 'Remboursement effectué avec succès',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erreur lors du remboursement',
    };
  }
};

/**
 * Générer une référence de transaction unique
 */
export const generateTransactionReference = (
  donateur: string,
  montant: number,
): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  const abbreviated = donateur.substr(0, 3).toUpperCase();
  return `DON-${abbreviated}-${montant}-${timestamp}-${random}`;
};

/**
 * Valider les données de paiement
 */
export const validatePaymentData = (data: PaymentInitiation): string[] => {
  const errors: string[] = [];

  if (!data.montant || data.montant <= 0) {
    errors.push('Le montant doit être supérieur à 0');
  }

  if (!data.devise) {
    errors.push('La devise est requise');
  }

  if (!data.methode) {
    errors.push('La méthode de paiement est requise');
  }

  if (data.methode === 'carte_bancaire' && !data.email) {
    errors.push('L\'email est requis pour la carte bancaire');
  }

  if (data.methode === 'mobile_money' && !data.telephone) {
    errors.push('Le numéro de téléphone est requis pour Mobile Money');
  }
  if (data.methode === 'mobile_money' && !data.mobileMoneyOperator) {
    errors.push('Veuillez choisir MTN MoMo ou Orange Money');
  }

  return errors;
};
