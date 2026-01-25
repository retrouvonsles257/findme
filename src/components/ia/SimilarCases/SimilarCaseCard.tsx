import React, { useState } from 'react';

export interface SimilarCase {
  id: string;
  title: string;
  description: string;
  similarity: number;
  image?: string;
  date?: string;
  status?: 'resolved' | 'pending' | 'closed';
}

export interface SimilarCaseCardProps {
  case: SimilarCase;
  onSelect?: (caseId: string) => void;
  onViewDetails?: (caseId: string) => void;
}

export const SimilarCaseCard: React.FC<SimilarCaseCardProps> = ({
  case: caseData,
  onSelect,
  onViewDetails,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'resolved':
        return { bg: '#f0fdf4', color: '#16a34a', text: 'Resolved' };
      case 'pending':
        return { bg: '#fefce8', color: '#f59e0b', text: 'Pending' };
      case 'closed':
        return { bg: '#fef2f2', color: '#dc2626', text: 'Closed' };
      default:
        return { bg: '#f0f9ff', color: '#2563eb', text: 'Unknown' };
    }
  };

  const statusStyle = getStatusColor(caseData.status);

  return (
    <div
      onClick={() => onSelect?.(caseData.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: '1rem',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        background: 'white',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '1rem' }}>
        {caseData.image && (
          <img
            src={caseData.image}
            alt={caseData.title}
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '8px',
              objectFit: 'cover',
              background: '#f3f4f6',
            }}
          />
        )}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <h4 style={{ margin: '0 0 0.25rem 0' }}>{caseData.title}</h4>
              <p style={{ margin: '0.25rem 0 0.75rem 0', fontSize: '0.875rem', color: '#666' }}>
                {caseData.description}
              </p>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                minWidth: 'fit-content',
              }}
            >
              <div
                style={{
                  fontWeight: 'bold',
                  fontSize: '1.25rem',
                  color: caseData.similarity >= 0.8 ? '#16a34a' : '#f59e0b',
                }}
              >
                {(caseData.similarity * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem' }}>
            {caseData.date && (
              <span style={{ color: '#666' }}>
                <strong>Date:</strong> {caseData.date}
              </span>
            )}
            {caseData.status && (
              <span
                style={{
                  padding: '0.25rem 0.75rem',
                  background: statusStyle.bg,
                  color: statusStyle.color,
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                }}
              >
                {statusStyle.text}
              </span>
            )}
          </div>

          {onViewDetails && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(caseData.id);
              }}
              style={{
                marginTop: '0.75rem',
                padding: '0.5rem 1rem',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              View Details
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
