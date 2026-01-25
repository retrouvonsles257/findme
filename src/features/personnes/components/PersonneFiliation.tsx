/**
 * =====================================================
 * RETROUVONSLES - PersonneFiliation Component
 * Display filiation (kinship) links
 * =====================================================
 */

import React, { useEffect, useState } from 'react';
import { usePersonneDetail } from '../hooks/usePersonneDetail';
import { getFiliationTypeLabel, getVerificationStatusLabel } from '../services/personneService';
import styles from './PersonneFiliation.module.css';

export interface PersonneFiliationProps {
  personneId: string;
}

/**
 * PersonneFiliation component
 */
export const PersonneFiliation: React.FC<PersonneFiliationProps> = ({ personneId }) => {
  const { filiations, fetchFiliations } = usePersonneDetail();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchFiliations(personneId);
  }, [personneId, fetchFiliations]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Filiation Links</h2>
        <button
          className={styles.addButton}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : 'Add Link'}
        </button>
      </div>

      {showForm && (
        <div className={styles.formContainer}>
          <p>Add Filiation Form would go here</p>
        </div>
      )}

      <div className={styles.listContainer}>
        {filiations.length === 0 ? (
          <div className={styles.empty}>No filiation links</div>
        ) : (
          <div className={styles.list}>
            {filiations.map((filiation) => (
              <div key={filiation.id} className={styles.filiationItem}>
                <div className={styles.itemHeader}>
                  <strong className={styles.type}>
                    {getFiliationTypeLabel(filiation.type_lien)}
                  </strong>
                  <span className={styles.status}>
                    {getVerificationStatusLabel(filiation.statut_verification)}
                  </span>
                </div>

                {filiation.score_compatibilite_physique && (
                  <div className={styles.itemBody}>
                    <span className={styles.label}>Physical Compatibility:</span>
                    <span className={styles.score}>
                      {(filiation.score_compatibilite_physique * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
