/**
 * =====================================================
 * RETROUVONSLES - FiliationLink Component
 * Component to display and manage filiation links
 * =====================================================
 */

import React, { useState } from 'react';
import type { FiliationLienDisplay } from '../types';

export interface FiliationLinkProps {
  lien: FiliationLienDisplay;
  onEdit?: (lien: FiliationLienDisplay) => void;
  onDelete?: (lienId: string) => void;
  onVerify?: (lienId: string) => void;
}

export const FiliationLink: React.FC<FiliationLinkProps> = ({
  lien,
  onEdit,
  onDelete,
  onVerify,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getVerificationBadgeColor = () => {
    switch (lien.statut_verification) {
      case 'confirme_officiellement':
        return '#10b981'; // Green
      case 'confirme_genetiquement':
        return '#8b5cf6'; // Purple
      case 'en_verification':
        return '#f59e0b'; // Amber
      case 'suppose_ia':
        return '#3b82f6'; // Blue
      default:
        return '#6b7280'; // Gray
    }
  };

  const getVerificationLabel = () => {
    const labels: Record<string, string> = {
      confirme_officiellement: 'Confirmé (Officiel)',
      confirme_genetiquement: 'Confirmé (ADN)',
      en_verification: 'En vérification',
      suppose_ia: 'Supposé (IA)',
      declare_famille: 'Déclaré',
      conteste: 'Contesté',
      invalide: 'Invalide',
    };
    return labels[lien.statut_verification] || lien.statut_verification;
  };

  return (
    <div style={{ margin: '16px 0', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
            {lien.personneSouceNom} {lien.personneSourcePrenom}
            <span style={{ margin: '0 8px' }}>→</span>
            {lien.type_lien}
            <span style={{ margin: '0 8px' }}>→</span>
            {lien.personneCibleNom} {lien.personneCiblePrenom}
          </div>
          <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
            {lien.nature_filiation}
          </div>
        </div>
        <div
          style={{
            background: getVerificationBadgeColor(),
            color: '#fff',
            padding: '6px 12px',
            borderRadius: '4px',
            fontSize: '12px',
          }}
        >
          {getVerificationLabel()}
        </div>
      </div>

      {isExpanded && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontWeight: 'bold' }}>Score compatibilité:</label>
              <p>{lien.score_compatibilite_physique || 'N/A'}%</p>
            </div>
            <div>
              <label style={{ fontWeight: 'bold' }}>Type de preuve:</label>
              <p>{lien.type_preuve}</p>
            </div>
            {lien.date_etablissement_lien && (
              <div>
                <label style={{ fontWeight: 'bold' }}>Date du lien:</label>
                <p>{new Date(lien.date_etablissement_lien).toLocaleDateString()}</p>
              </div>
            )}
            {lien.autorite_parentale && (
              <div>
                <label style={{ fontWeight: 'bold' }}>Autorité parentale:</label>
                <p>{lien.autorite_parentale}</p>
              </div>
            )}
          </div>

          {lien.commentaire && (
            <div style={{ marginTop: '12px' }}>
              <label style={{ fontWeight: 'bold' }}>Commentaires:</label>
              <p>{lien.commentaire}</p>
            </div>
          )}

          <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
            {onEdit && (
              <button
                onClick={() => onEdit(lien)}
                style={{
                  padding: '8px 16px',
                  background: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Modifier
              </button>
            )}
            {onVerify && (
              <button
                onClick={() => onVerify(lien.id)}
                style={{
                  padding: '8px 16px',
                  background: '#10b981',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Vérifier
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(lien.id)}
                style={{
                  padding: '8px 16px',
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Supprimer
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FiliationLink;
