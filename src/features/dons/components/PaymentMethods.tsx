/**
 * =====================================================
 * RETROUVONSLES - PaymentMethods Component
 * Sélection et gestion des méthodes de paiement
 * =====================================================
 */

import React, { useCallback } from 'react';

// ============================================
// COMPONENT PROPS
// ============================================

export interface PaymentMethodsProps {
  onSelectMethod: (method: string) => void;
  selectedMethod?: string;
  availableMethods?: string[];
  className?: string;
}

// ============================================
// CONSTANTS
// ============================================

const PAYMENT_METHODS = [
  {
    id: 'carte_bancaire',
    label: 'Carte Bancaire',
    description: 'Visa, Mastercard, American Express',
    icon: '💳',
  },
  {
    id: 'mobile_money',
    label: 'Mobile Money',
    description: 'MTN Mobile Money, Orange Money',
    icon: '📱',
  },
  {
    id: 'virement',
    label: 'Virement Bancaire',
    description: 'Virement direct à notre compte',
    icon: '🏦',
  },
  {
    id: 'paypal',
    label: 'PayPal',
    description: 'Paiement sécurisé via PayPal',
    icon: '🌐',
  },
  {
    id: 'autre',
    label: 'Autre méthode',
    description: 'Contactez-nous pour d\'autres options',
    icon: '❓',
  },
];

// ============================================
// COMPONENT
// ============================================

/**
 * Composant sélection des méthodes de paiement
 */
export const PaymentMethods: React.FC<PaymentMethodsProps> = ({
  onSelectMethod,
  selectedMethod,
  availableMethods = PAYMENT_METHODS.map((m) => m.id),
  className = '',
}) => {
  const handleMethodSelect = useCallback(
    (methodId: string) => {
      onSelectMethod(methodId);
    },
    [onSelectMethod],
  );

  const filteredMethods = PAYMENT_METHODS.filter((method) =>
    availableMethods.includes(method.id),
  );

  return (
    <div className={`payment-methods ${className}`}>
      <h3>Choisir une méthode de paiement</h3>

      <div className="methods-grid">
        {filteredMethods.map((method) => (
          <div
            key={method.id}
            className={`method-card ${selectedMethod === method.id ? 'selected' : ''}`}
            onClick={() => handleMethodSelect(method.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleMethodSelect(method.id);
              }
            }}
          >
            <div className="method-icon">{method.icon}</div>
            <div className="method-info">
              <h4>{method.label}</h4>
              <p>{method.description}</p>
            </div>
            {selectedMethod === method.id && (
              <div className="method-check">✓</div>
            )}
          </div>
        ))}
      </div>

      {/* Notes spécifiques par méthode */}
      {selectedMethod && (
        <div className="method-notes">
          {selectedMethod === 'mobile_money' && (
            <div className="note">
              <strong>Mobile Money:</strong> Vous serez redirigé vers votre opérateur pour
              confirmer le paiement. Frais: 0%
            </div>
          )}
          {selectedMethod === 'carte_bancaire' && (
            <div className="note">
              <strong>Carte Bancaire:</strong> Paiement sécurisé via notre partenaire agréé.
              Votre information est cryptée. Frais: 1.5%
            </div>
          )}
          {selectedMethod === 'virement' && (
            <div className="note">
              <strong>Virement Bancaire:</strong> Nous vous fournirons les coordonnées bancaires
              après confirmation. Frais: 0%
            </div>
          )}
          {selectedMethod === 'paypal' && (
            <div className="note">
              <strong>PayPal:</strong> Paiement sécurisé via votre compte PayPal. Frais: 3%
            </div>
          )}
          {selectedMethod === 'autre' && (
            <div className="note">
              <strong>Autre méthode:</strong> Contactez-nous à{' '}
              <a href="mailto:dons@retrouvonsles.org">dons@retrouvonsles.org</a> pour d\'autres
              options de paiement.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentMethods;
