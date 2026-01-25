/**
 * =====================================================
 * RETROUVONSLES - AlerteDiffusion Component
 * Interface de diffusion des alertes
 * =====================================================
 */

import React, { useState } from 'react';
import styles from './AlerteCreate.module.css';
import { useAlerteDiffusion } from '../hooks/useAlerteDiffusion';
import { AlerteZoneSelector, type Zone } from './AlerteZoneSelector';
import { useNotification } from '../../../contexts';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface AlerteDiffusionProps {
  alerteId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// ============================================
// COMPONENT
// ============================================

export const AlerteDiffusion: React.FC<AlerteDiffusionProps> = ({
  alerteId,
  onSuccess,
  onCancel,
}) => {
  const { diffuserAlerte, programmerDiffusion } = useAlerteDiffusion();
  const { addNotification } = useNotification();

  const [canaux, setCanaux] = useState<string[]>(['push', 'in_app']);
  const [zones, setZones] = useState<Zone[]>([]);
  const [rayon, setRayon] = useState(50);
  const [planifiee, setPlanifiee] = useState(false);
  const [dateProgrammee, setDateProgrammee] = useState('');
  const [isDiffusing, setIsDiffusing] = useState(false);

  // ========== HANDLERS ==========

  const handleCanauToggle = (canal: string) => {
    setCanaux((prev) =>
      prev.includes(canal)
        ? prev.filter((c) => c !== canal)
        : [...prev, canal],
    );
  };

  const handleBroadcast = async () => {
    try {
      setIsDiffusing(true);

      if (planifiee && !dateProgrammee) {
        addNotification({
          title: 'Erreur',
          message: 'Veuillez sélectionner une date de diffusion',
          type: 'error',
        });
        return;
      }

      if (planifiee && dateProgrammee) {
        await programmerDiffusion(alerteId, {
          canaux,
          rayon_km: rayon,
          zones_specifiques: zones.map((z) => z.id),
          planifiee: true,
          date_programmee: dateProgrammee,
          priorite_diffusion: 'haute',
        });
        addNotification({
          title: 'Succès',
          message: 'Alerte programmée pour diffusion',
          type: 'success',
        });
      } else {
        const result = await diffuserAlerte(alerteId, {
          canaux,
          rayon_km: rayon,
          zones_specifiques: zones.map((z) => z.id),
          planifiee: false,
          priorite_diffusion: 'haute',
        });

        addNotification({
          title: 'Succès',
          message: `Alerte diffusée à ${result.nombre_destinataires} destinataires`,
          type: 'success',
        });

        onSuccess?.();
      }
    } catch (err) {
      addNotification({
        title: 'Erreur',
        message: err instanceof Error ? err.message : 'Erreur lors de la diffusion',
        type: 'error',
      });
    } finally {
      setIsDiffusing(false);
    }
  };

  // ========== RENDER ==========

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Diffuser l'alerte</h2>

      <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
        {/* Canaux */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Canaux de diffusion *</label>
          <div className={styles.checkboxGroup}>
            {['push', 'in_app', 'email', 'sms'].map((canal) => (
              <label key={canal} className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={canaux.includes(canal)}
                  onChange={() => handleCanauToggle(canal)}
                  disabled={isDiffusing}
                />
                {canal.toUpperCase()}
              </label>
            ))}
          </div>
          <small className={styles.hint}>
            Sélectionnez au moins un canal
          </small>
        </div>

        {/* Rayon */}
        <div className={styles.formGroup}>
          <label htmlFor="rayon" className={styles.label}>
            Rayon de diffusion (km)
          </label>
          <input
            id="rayon"
            type="number"
            min="1"
            max="500"
            value={rayon}
            onChange={(e) => setRayon(parseInt(e.target.value))}
            disabled={isDiffusing}
            className={styles.input}
          />
          <small className={styles.hint}>
            Distance maximale autour du lieu de disparition
          </small>
        </div>

        {/* Zones */}
        <div className={styles.formGroup}>
          <AlerteZoneSelector
            onZonesSelected={setZones}
            multiSelect={true}
          />
        </div>

        {/* Programmation */}
        <div className={styles.formGroup}>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={planifiee}
              onChange={(e) => setPlanifiee(e.target.checked)}
              disabled={isDiffusing}
            />
            Programmer la diffusion
          </label>
        </div>

        {/* Date de programmation */}
        {planifiee && (
          <div className={styles.formGroup}>
            <label htmlFor="dateProgrammee" className={styles.label}>
              Date et heure de diffusion *
            </label>
            <input
              id="dateProgrammee"
              type="datetime-local"
              value={dateProgrammee}
              onChange={(e) => setDateProgrammee(e.target.value)}
              disabled={isDiffusing}
              className={styles.input}
            />
            <small className={styles.hint}>
              La diffusion aura lieu à cette date et heure
            </small>
          </div>
        )}

        {/* Buttons */}
        <div className={styles.formActions}>
          <button
            type="button"
            onClick={onCancel}
            className={styles.buttonSecondary}
            disabled={isDiffusing}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleBroadcast}
            className={styles.buttonPrimary}
            disabled={isDiffusing || canaux.length === 0}
          >
            {isDiffusing
              ? 'Traitement en cours...'
              : planifiee
                ? 'Programmer'
                : 'Diffuser maintenant'}
          </button>
        </div>
      </form>
    </div>
  );
};

AlerteDiffusion.displayName = 'AlerteDiffusion';
