import React, { useState } from 'react';
import { SimilarCaseCard, SimilarCase } from './SimilarCaseCard';
import styles from './SimilarCases.module.css';

export interface SimilarCasesProps {
  cases: SimilarCase[];
  isLoading?: boolean;
  onCaseSelect?: (caseId: string) => void;
  minSimilarity?: number;
}

export const SimilarCases: React.FC<SimilarCasesProps> = ({
  cases,
  isLoading = false,
  onCaseSelect,
  minSimilarity = 0.6,
}) => {
  const [selectedCase, setSelectedCase] = useState<string | null>(null);

  const filteredCases = cases.filter((c) => c.similarity >= minSimilarity);

  const handleCaseSelect = (caseId: string) => {
    setSelectedCase(caseId);
    if (onCaseSelect) {
      onCaseSelect(caseId);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <h2>Similar Cases</h2>
        <p style={{ textAlign: 'center', color: '#666' }}>Loading cases...</p>
      </div>
    );
  }

  if (filteredCases.length === 0) {
    return (
      <div className={styles.container}>
        <h2>Similar Cases</h2>
        <p style={{ textAlign: 'center', color: '#666' }}>
          No similar cases found matching your criteria.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2>Similar Cases ({filteredCases.length})</h2>

      <div className={styles.filterBar}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.875rem' }}>Minimum Similarity:</span>
          <select
            defaultValue={minSimilarity}
            style={{
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontSize: '0.875rem',
            }}
          >
            <option value={0.6}>60%</option>
            <option value={0.7}>70%</option>
            <option value={0.8}>80%</option>
            <option value={0.9}>90%</option>
          </select>
        </label>
      </div>

      <div className={styles.casesList}>
        {filteredCases.map((caseData) => (
          <div
            key={caseData.id}
            style={{
              opacity: selectedCase === caseData.id ? 1 : 0.8,
            }}
          >
            <SimilarCaseCard
              case={caseData}
              onSelect={handleCaseSelect}
              onViewDetails={() => handleCaseSelect(caseData.id)}
            />
          </div>
        ))}
      </div>

      {selectedCase && (
        <div className={styles.selectedCaseDetails}>
          {filteredCases.find((c) => c.id === selectedCase) && (
            <div
              style={{
                padding: '1.5rem',
                background: '#f0f9ff',
                borderRadius: '8px',
                border: '1px solid #bfdbfe',
              }}
            >
              <h3>Selected Case Details</h3>
              <p style={{ color: '#666' }}>
                Case ID: <strong>{selectedCase}</strong>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
