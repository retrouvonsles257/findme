/**
 * =====================================================
 * RETROUVONSLES - AlerteDiffusion Component
 * Interface de diffusion des alertes
 * =====================================================
 */

import React, { useState, useEffect } from 'react';
import styles from './AlerteCreate.module.css';
import { useAlerteDiffusion } from '../hooks/useAlerteDiffusion';
import { AlerteZoneSelector, type Zone } from './AlerteZoneSelector';
import { useNotification } from '../../../contexts';
import { useI18n } from '../../../hooks';
import { previewDiffusionAlerte, type DiffusionDestinatairesResult } from '../services/alerteAPI';

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
  const { t } = useI18n();

  const [preview, setPreview] = useState<
    | (DiffusionDestinatairesResult & {
        rayon_km: number;
        configStrictGeo: boolean;
        configAllowSansCentre: boolean;
      })
    | null
  >(null);
  const [previewLoading, setPreviewLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setPreviewLoading(true);
    void previewDiffusionAlerte(alerteId)
      .then((p) => {
        if (!cancelled) setPreview(p);
      })
      .catch(() => {
        if (!cancelled) setPreview(null);
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [alerteId]);

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

        if (result.nombre_destinataires === 0) {
          addNotification({
            title: t('authority.alertes.diffusion.toastZeroTitle'),
            message: t('authority.alertes.diffusion.toastZeroBody'),
            type: 'warning',
            duration: 8000,
          });
        } else {
          addNotification({
            title: t('authority.alertes.diffusion.toastSuccessTitle'),
            message: t('authority.alertes.diffusion.toastSuccessBody').replace(
              '{{count}}',
              String(result.nombre_destinataires),
            ),
            type: 'success',
          });
        }

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

  const previewBody = () => {
    if (!preview) return null;
    if (preview.sansCentreSurAlerte && preview.destinataires.length > 0 && preview.configAllowSansCentre) {
      return t('authority.alertes.diffusion.previewNoCentreBroadcast').replace(
        '{{count}}',
        String(preview.destinataires.length),
      );
    }
    if (preview.sansCentreSurAlerte && preview.destinataires.length === 0 && !preview.configAllowSansCentre) {
      return t('authority.alertes.diffusion.previewNoCentre');
    }
    return t('authority.alertes.diffusion.previewCount')
      .replace('{{count}}', String(preview.destinataires.length))
      .replace('{{total}}', String(preview.totalNotifiables))
      .replace('{{rayon}}', String(preview.rayon_km));
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Diffuser l'alerte</h2>

      <div className={styles.diffusionPreview} role="status">
        <strong>{t('authority.alertes.diffusion.previewTitle')}</strong>
        {previewLoading ? (
          <p>{t('authority.alertes.diffusion.previewLoading')}</p>
        ) : preview ? (
          <>
            <p>{previewBody()}</p>
            {!preview.configStrictGeo && preview.useGeo ? (
              <p className={styles.diffusionPreviewWarn}>{t('authority.alertes.diffusion.previewStrictOff')}</p>
            ) : null}
          </>
        ) : (
          <p>—</p>
        )}
      </div>

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
