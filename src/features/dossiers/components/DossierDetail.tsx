import React, { useEffect } from 'react';
import { useDossierDetail } from '../hooks';
import styles from './DossierDetail.module.css';

export interface DossierDetailProps {
  dossierId: string;
}

export const DossierDetail: React.FC<DossierDetailProps> = ({ dossierId }) => {
  const { dossier, isLoading, error, fetchDossier } = useDossierDetail();

  useEffect(() => {
    fetchDossier(dossierId);
  }, [dossierId, fetchDossier]);

  if (isLoading) return <div className={styles.loading}>Chargement...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!dossier) return <div className={styles.notFound}>Dossier non trouvé</div>;

  return (
    <div className={styles.detail}>
      <div className={styles.header}>
        <h1>{dossier.numero_dossier}</h1>
        <span className={styles.status}>{dossier.statut_label}</span>
      </div>
      <div className={styles.content}>
        <section className={styles.section}>
          <h2>Informations générales</h2>
          <div className={styles.grid}>
            <div>
              <label>Type:</label>
              <p>{dossier.type_label}</p>
            </div>
            <div>
              <label>Urgence:</label>
              <p>{dossier.urgence_label}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
