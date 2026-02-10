/**
 * =====================================================
 * RETROUVONSLES - CampagneCreate Component
 * Formulaire de création d'une nouvelle campagne
 * =====================================================
 */

import React, { useState } from 'react';
import { useCampagneCreate } from '../hooks';
import type { TypeCampagne } from '../../../@types/enums.types';
import type { CampagneCreateProps, CampagneCreatePayload } from '../types';
import styles from './CampagneCreate.module.css';

/**
 * Composant de création d'une campagne
 */
const CampagneCreate: React.FC<CampagneCreateProps> = ({
  onSuccess,
  onCancel,
  initialOrganisationId,
  className = '',
}) => {
  const { isCreating, error, errors, createCampagne, validateForm, clearErrors } =
    useCampagneCreate();

  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    objectif: '',
    type_campagne: '' as TypeCampagne | '',
    public_cible: '',
    date_debut: '',
    date_fin: '',
    budget_alloue: '',
    zones_geographiques: [] as string[],
    canaux_diffusion: [] as string[],
  });

  const campaignTypes = [
    'prevention_fugue',
    'securite_enfants',
    'vigilance_communautaire',
    'formation_premiers_secours',
    'sensibilisation_generale',
    'collecte_fonds',
    'autre',
  ] as const;

  const channels = [
    'reseaux_sociaux',
    'medias_traditionnels',
    'affichage',
    'email',
    'sms',
    'radio',
    'television',
  ];

  const zones = ['nord', 'sud', 'est', 'ouest', 'centre', 'national'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    clearErrors();
  };

  const handleToggleChannel = (channel: string) => {
    setFormData((prev) => ({
      ...prev,
      canaux_diffusion: prev.canaux_diffusion.includes(channel)
        ? prev.canaux_diffusion.filter((c) => c !== channel)
        : [...prev.canaux_diffusion, channel],
    }));
  };

  const handleToggleZone = (zone: string) => {
    setFormData((prev) => ({
      ...prev,
      zones_geographiques: prev.zones_geographiques.includes(zone)
        ? prev.zones_geographiques.filter((z) => z !== zone)
        : [...prev.zones_geographiques, zone],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    // Validate form
    const formErrors = validateForm({
      titre: formData.titre,
      description: formData.description,
      objectif: formData.objectif,
      type_campagne: formData.type_campagne as TypeCampagne,
      public_cible: formData.public_cible,
      date_debut: formData.date_debut,
      date_fin: formData.date_fin,
      budget_alloue: formData.budget_alloue ? parseFloat(formData.budget_alloue) : undefined,
      zones_geographiques: formData.zones_geographiques,
      canaux_diffusion: formData.canaux_diffusion,
    });

    if (Object.keys(formErrors).length > 0) {
      return;
    }

    // Create payload
    const payload: CampagneCreatePayload = {
      titre: formData.titre,
      description: formData.description || undefined,
      objectif: formData.objectif || undefined,
      type_campagne: formData.type_campagne as TypeCampagne,
      public_cible: formData.public_cible || undefined,
      date_debut: formData.date_debut,
      date_fin: formData.date_fin || undefined,
      budget_alloue: formData.budget_alloue ? parseFloat(formData.budget_alloue) : undefined,
      zones_geographiques: formData.zones_geographiques.length > 0
        ? formData.zones_geographiques
        : undefined,
      canaux_diffusion: formData.canaux_diffusion.length > 0
        ? formData.canaux_diffusion
        : undefined,
      id_organisation: initialOrganisationId,
    };

    const result = await createCampagne(payload);
    if (result && onSuccess) {
      onSuccess(result);
    }
  };

  return (
    <div className={`${styles.container} ${className}`}>
      <h2>Créer une nouvelle campagne</h2>

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Informations générales</h3>
        {/* Titre */}
        <div className={styles.formGroup}>
          <label>Titre *</label>
          <input
            type="text"
            name="titre"
            value={formData.titre}
            onChange={handleChange}
            placeholder="Titre de la campagne"
            maxLength={255}
          />
          {errors.titre && <span className={styles.error}>{errors.titre}</span>}
        </div>

        {/* Type Campagne */}
        <div className={styles.formGroup}>
          <label>Type de Campagne *</label>
          <select name="type_campagne" value={formData.type_campagne} onChange={handleChange}>
            <option value="">Sélectionner un type</option>
            {campaignTypes.map((type) => (
              <option key={type} value={type}>
                {type.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          {errors.type_campagne && (
            <span className={styles.error}>{errors.type_campagne}</span>
          )}
        </div>

        {/* Description */}
        <div className={styles.formGroup}>
          <label>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Description détaillée de la campagne"
            rows={4}
          />
        </div>

        {/* Objectif */}
        <div className={styles.formGroup}>
          <label>Objectif</label>
          <textarea
            name="objectif"
            value={formData.objectif}
            onChange={handleChange}
            placeholder="Objectif de la campagne"
            rows={4}
          />
        </div>

        {/* Public Cible */}
        <div className={styles.formGroup}>
          <label>Public Cible</label>
          <input
            type="text"
            name="public_cible"
            value={formData.public_cible}
            onChange={handleChange}
            placeholder="Ex: Enfants 5-10 ans, Parents, etc."
          />
        </div>

        {/* Dates */}
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Date de Début *</label>
            <input
              type="date"
              name="date_debut"
              value={formData.date_debut}
              onChange={handleChange}
            />
            {errors.date_debut && (
              <span className={styles.error}>{errors.date_debut}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label>Date de Fin</label>
            <input
              type="date"
              name="date_fin"
              value={formData.date_fin}
              onChange={handleChange}
            />
            {errors.date_fin && <span className={styles.error}>{errors.date_fin}</span>}
          </div>
        </div>

        {/* Budget */}
        <div className={styles.formGroup}>
          <label>Budget Alloué (XAF)</label>
          <input
            type="number"
            name="budget_alloue"
            value={formData.budget_alloue}
            onChange={handleChange}
            placeholder="0"
            min="0"
          />
          {errors.budget_alloue && (
            <span className={styles.error}>{errors.budget_alloue}</span>
          )}
        </div>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Diffusion</h3>
        {/* Canaux de Diffusion */}
        <div className={styles.formGroup}>
          <label>Canaux de Diffusion</label>
          <div className={styles.checkboxGroup}>
            {channels.map((channel) => (
              <label key={channel} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.canaux_diffusion.includes(channel)}
                  onChange={() => handleToggleChannel(channel)}
                />
                {channel.replace(/_/g, ' ')}
              </label>
            ))}
          </div>
        </div>

        {/* Zones Géographiques */}
        <div className={styles.formGroup}>
          <label>Zones Géographiques</label>
          <div className={styles.checkboxGroup}>
            {zones.map((zone) => (
              <label key={zone} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.zones_geographiques.includes(zone)}
                  onChange={() => handleToggleZone(zone)}
                />
                {zone.charAt(0).toUpperCase() + zone.slice(1)}
              </label>
            ))}
          </div>
        </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            type="submit"
            disabled={isCreating}
            className={styles.submitBtn}
          >
            {isCreating ? 'Création en cours...' : 'Créer la campagne'}
          </button>
          {onCancel && (
            <button type="button" onClick={onCancel} className={styles.cancelBtn}>
              Annuler
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default CampagneCreate;
