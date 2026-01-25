/**
 * =====================================================
 * RETROUVONSLES - FiliationVerification Component
 * Component for verifying filiation links
 * =====================================================
 */

import React, { useState } from 'react';
import type { FiliationLienDisplay } from '../types';
import { StatutVerification, TypePreuve } from '../../../@types/enums.types';

export interface FiliationVerificationProps {
  lien: FiliationLienDisplay;
  onVerify?: (
    lienId: string,
    statut: string,
    typePreuve: string,
    notes?: string,
  ) => Promise<void>;
  onCancel?: () => void;
}

export const FiliationVerification: React.FC<FiliationVerificationProps> = ({
  lien,
  onVerify,
  onCancel,
}) => {
  const [statut, setStatut] = useState<string>(lien.statut_verification);
  const [typePreuve, setTypePreuve] = useState<string>(lien.type_preuve);
  const [notes, setNotes] = useState<string>(lien.commentaire || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (onVerify) {
        await onVerify(lien.id, statut, typePreuve, notes);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
      <h3>Vérification du lien de filiation</h3>

      {error && (
        <div style={{ padding: '12px', background: '#fee2e2', color: '#dc2626', borderRadius: '4px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          Statut de vérification
        </label>
        <select
          value={statut}
          onChange={(e) => setStatut(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
          }}
        >
          <option value={StatutVerification.EN_VERIFICATION}>En vérification</option>
          <option value={StatutVerification.CONFIRME_OFFICIELLEMENT}>Confirmé (Officiel)</option>
          <option value={StatutVerification.CONFIRME_GENETIQUEMENT}>Confirmé (ADN)</option>
          <option value={StatutVerification.DECLARE_FAMILLE}>Déclaré</option>
          <option value={StatutVerification.SUPPOSE_IA}>Supposé (IA)</option>
          <option value={StatutVerification.CONTESTE}>Contesté</option>
          <option value={StatutVerification.INVALIDE}>Invalide</option>
        </select>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          Type de preuve
        </label>
        <select
          value={typePreuve}
          onChange={(e) => setTypePreuve(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
          }}
        >
          <option value={TypePreuve.AUCUNE}>Aucune</option>
          <option value={TypePreuve.ACTE_NAISSANCE}>Acte de naissance</option>
          <option value={TypePreuve.LIVRET_FAMILLE}>Livret de famille</option>
          <option value={TypePreuve.JUGEMENT_ADOPTION}>Jugement d'adoption</option>
          <option value={TypePreuve.TEST_ADN}>Test ADN</option>
          <option value={TypePreuve.TEMOIGNAGES}>Témoignages</option>
          <option value={TypePreuve.DOCUMENTS_IDENTITE}>Documents d'identité</option>
          <option value={TypePreuve.AUTRE}>Autre</option>
        </select>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            minHeight: '100px',
          }}
          placeholder="Ajouter des notes ou des commentaires..."
        />
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          style={{
            padding: '10px 20px',
            background: '#10b981',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.6 : 1,
          }}
        >
          {isSubmitting ? 'Vérification...' : 'Vérifier'}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              background: '#6b7280',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Annuler
          </button>
        )}
      </div>
    </div>
  );
};

export default FiliationVerification;
