/**
 * =====================================================
 * RETROUVONSLES - PersonnePhysical Component
 * Display physical description details
 * =====================================================
 */

import React from 'react';
import type { Personne } from '../types';
import styles from './PersonnePhysical.module.css';

export interface PersonnePhysicalProps {
  personne: Personne;
}

/**
 * PersonnePhysical component
 */
export const PersonnePhysical: React.FC<PersonnePhysicalProps> = ({ personne }) => {
  const renderPhysicalAttribute = (label: string, value: string | number | undefined) => {
    if (!value) return null;

    return (
      <div className={styles.attributeItem}>
        <span className={styles.label}>{label}:</span>
        <span className={styles.value}>{value}</span>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <h2>Physical Description</h2>

      {personne.description_physique && (
        <div className={styles.description}>
          <p>{personne.description_physique}</p>
        </div>
      )}

      <div className={styles.grid}>
        <div className={styles.section}>
          <h3>Morphology</h3>
          <div className={styles.attributes}>
            {renderPhysicalAttribute('Height (cm)', personne.taille_cm)}
            {renderPhysicalAttribute('Weight (kg)', personne.poids_kg)}
            {renderPhysicalAttribute('Build', personne.corpulence)}
            {renderPhysicalAttribute('Skin Color', personne.couleur_peau)}
          </div>
        </div>

        <div className={styles.section}>
          <h3>Hair & Eyes</h3>
          <div className={styles.attributes}>
            {renderPhysicalAttribute('Hair Type', personne.type_cheveux)}
            {renderPhysicalAttribute('Hair Color', personne.couleur_cheveux)}
            {renderPhysicalAttribute('Eye Color', personne.couleur_yeux)}
          </div>
        </div>

        <div className={styles.section}>
          <h3>Distinctive Features</h3>
          <div className={styles.attributes}>
            {renderPhysicalAttribute('Distinguishing Marks', personne.signes_distinctifs)}
            {renderPhysicalAttribute('Disabilities/Illnesses', personne.handicaps_maladies)}
            {renderPhysicalAttribute('Blood Group', personne.groupe_sanguin)}
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h3>Social & Medical Information</h3>
        <div className={styles.attributes}>
          {renderPhysicalAttribute('Family Status', personne.situation_familiale)}
          {renderPhysicalAttribute('Number of Children', personne.nombre_enfants)}
          {renderPhysicalAttribute('Reliability', personne.fiabilite_informations)}
        </div>
      </div>
    </div>
  );
};
