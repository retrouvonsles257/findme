/**
 * =====================================================
 * RETROUVONSLES - RegisterStepSelector Component
 * Sélecteur du type de compte lors de l'inscription
 * =====================================================
 */

import React from 'react';
import { RegisterStepSelectorProps } from '../types';
import { TypeCompte } from '../../../@types/enums.types';

const RegisterStepSelector: React.FC<RegisterStepSelectorProps> = ({
  selectedType,
  onSelect,
  isLoading,
}) => {
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ fontSize: '1.75rem', textAlign: 'center', marginBottom: '0.5rem' }}>
        Créer un compte
      </h1>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '2rem' }}>
        Sélectionnez le type de compte qui vous convient
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Public Account */}
        <button
          onClick={() => onSelect(TypeCompte.GRAND_PUBLIC)}
          disabled={isLoading}
          style={{
            padding: '2rem',
            border: selectedType === TypeCompte.GRAND_PUBLIC ? '2px solid #0066cc' : '1px solid #ddd',
            background: selectedType === TypeCompte.GRAND_PUBLIC ? '#f0f6ff' : 'white',
            borderRadius: '8px',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👤</div>
          <h3 style={{ marginBottom: '0.5rem', color: '#1a1a1a' }}>Citoyen</h3>
          <p style={{ fontSize: '0.875rem', color: '#666', margin: 0 }}>
            Pour les citoyens souhaitant s'engager dans la recherche
          </p>
        </button>

        {/* Authority Account */}
        <button
          onClick={() => onSelect(TypeCompte.AUTORITE)}
          disabled={isLoading}
          style={{
            padding: '2rem',
            border: selectedType === TypeCompte.AUTORITE ? '2px solid #0066cc' : '1px solid #ddd',
            background: selectedType === TypeCompte.AUTORITE ? '#f0f6ff' : 'white',
            borderRadius: '8px',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🚔</div>
          <h3 style={{ marginBottom: '0.5rem', color: '#1a1a1a' }}>Autorité</h3>
          <p style={{ fontSize: '0.875rem', color: '#666', margin: 0 }}>
            Pour les autorités et organisations officielles
          </p>
        </button>
      </div>

      {selectedType && (
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button
            style={{
              padding: '0.75rem 2rem',
              background: '#0066cc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 500,
            }}
            disabled={isLoading}
          >
            {isLoading ? 'Chargement...' : 'Continuer'}
          </button>
        </div>
      )}
    </div>
  );
};

export default RegisterStepSelector;
