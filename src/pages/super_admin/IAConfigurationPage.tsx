/**
 * =====================================================
 * RETROUVONSLES - Super Admin IA Configuration Page
 * Configuration de l'IA avec persistance Supabase
 * Table: configuration_systeme
 * =====================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../../hooks';
import { supabase } from '../../config';
import { SuperAdminLayout } from './SuperAdminLayout';
import { Cpu, Settings, Save, Loader2, AlertCircle, CheckCircle, RefreshCw, Minus, Plus } from 'lucide-react';
import styles from './IAConfigurationPage.module.css';

interface IAConfig {
  max_requests_per_minute: number;
  timeout_seconds: number;
  temperature: number;
  model_version: string;
  facial_recognition_enabled: boolean;
  facial_recognition_threshold: number;
  auto_analysis_enabled: boolean;
  max_concurrent_analyses: number;
}

const DEFAULT_CONFIG: IAConfig = {
  max_requests_per_minute: 100,
  timeout_seconds: 30,
  temperature: 0.7,
  model_version: 'gpt-4',
  facial_recognition_enabled: true,
  facial_recognition_threshold: 0.85,
  auto_analysis_enabled: true,
  max_concurrent_analyses: 5,
};

export const SuperAdminIAConfigurationPage: React.FC = () => {
  const { t } = useI18n();

  const [config, setConfig] = useState<IAConfig>(DEFAULT_CONFIG);
  const [originalConfig, setOriginalConfig] = useState<IAConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await (supabase as any)
        .from('configuration_systeme')
        .select('*')
        .eq('categorie', 'ia')
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (data && data.valeur) {
        const loadedConfig = { ...DEFAULT_CONFIG, ...data.valeur };
        setConfig(loadedConfig);
        setOriginalConfig(loadedConfig);
      }
    } catch (err: any) {
      console.error('Erreur chargement config IA:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      // Upsert la configuration
      const { error: upsertError } = await (supabase as any)
        .from('configuration_systeme')
        .upsert({
          categorie: 'ia',
          cle: 'ia_config',
          valeur: config,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'categorie' });

      if (upsertError) throw upsertError;

      setOriginalConfig(config);
      setSuccess('Configuration IA sauvegardée avec succès');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Erreur sauvegarde config IA:', err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
  };

  const hasChanges = JSON.stringify(config) !== JSON.stringify(originalConfig);

  const roundStep = (v: number, s: number) => {
    if (s >= 1) return Math.round(v);
    const d = s <= 0.01 ? 100 : 10;
    return Math.round(v * d) / d;
  };
  const Stepper = (
    { value, onChange, min, max, step = 1, disabled }: 
    { value: number; onChange: (v: number) => void; min: number; max: number; step?: number; disabled?: boolean }
  ) => (
    <div className={styles['sa-ia-config__stepper']}>
      <button type="button" className={styles['sa-ia-config__stepper-btn']} onClick={() => onChange(roundStep(Math.max(min, value - step), step))} disabled={disabled || value <= min} aria-label="Diminuer">
        <Minus size={16} />
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(roundStep(Math.min(max, Math.max(min, parseFloat(e.target.value) || min)), step))}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={styles['sa-ia-config__stepper-input']}
      />
      <button type="button" className={styles['sa-ia-config__stepper-btn']} onClick={() => onChange(roundStep(Math.min(max, value + step), step))} disabled={disabled || value >= max} aria-label="Augmenter">
        <Plus size={16} />
      </button>
    </div>
  );

  return (
    <SuperAdminLayout
      title={t('super_admin.iaConfigurationTitle') || 'Configuration IA'}
      activeNav="ia-config"
    >
      <div className={styles['sa-ia-config']}>
        {/* Messages */}
        {error && (
          <div className={styles['sa-ia-config__error']}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className={styles['sa-ia-config__success']}>
            <CheckCircle size={20} />
            <span>{success}</span>
          </div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className={styles['sa-ia-config__loading']}>
            <Loader2 size={32} className={styles['sa-ia-config__spinner']} />
          </div>
        ) : (
          <>
            {/* General Settings */}
            <div className={styles['sa-ia-config__card']}>
              <div className={styles['sa-ia-config__card-header']}>
                <Cpu size={24} />
                <h3>Paramètres généraux</h3>
              </div>
              <div className={styles['sa-ia-config__form']}>
                <div className={styles['sa-ia-config__field']}>
                  <label>Requêtes max par minute</label>
                  <Stepper value={config.max_requests_per_minute} onChange={(v) => setConfig({ ...config, max_requests_per_minute: v })} min={1} max={1000} />
                </div>
                <div className={styles['sa-ia-config__field']}>
                  <label>Timeout (secondes)</label>
                  <Stepper value={config.timeout_seconds} onChange={(v) => setConfig({ ...config, timeout_seconds: v })} min={5} max={300} />
                </div>
                <div className={styles['sa-ia-config__field']}>
                  <label>Température</label>
                  <Stepper value={config.temperature} onChange={(v) => setConfig({ ...config, temperature: v })} min={0} max={2} step={0.1} />
                  <span className={styles['sa-ia-config__hint']}>0 = déterministe, 2 = créatif</span>
                </div>
                <div className={styles['sa-ia-config__field']}>
                  <label>Version du modèle</label>
                  <select 
                    value={config.model_version}
                    onChange={(e) => setConfig({ ...config, model_version: e.target.value })}
                  >
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    <option value="claude-3">Claude 3</option>
                  </select>
                </div>
                <div className={styles['sa-ia-config__field']}>
                  <label>Analyses simultanées max</label>
                  <Stepper value={config.max_concurrent_analyses} onChange={(v) => setConfig({ ...config, max_concurrent_analyses: v })} min={1} max={20} />
                </div>
              </div>
            </div>

            {/* Facial Recognition */}
            <div className={styles['sa-ia-config__card']}>
              <div className={styles['sa-ia-config__card-header']}>
                <Settings size={24} />
                <h3>Reconnaissance faciale</h3>
              </div>
              <div className={styles['sa-ia-config__form']}>
                <div className={styles['sa-ia-config__field-toggle']}>
                  <label>Reconnaissance faciale activée</label>
                  <label className={styles['sa-ia-config__toggle']}>
                    <input 
                      type="checkbox" 
                      checked={config.facial_recognition_enabled}
                      onChange={(e) => setConfig({ ...config, facial_recognition_enabled: e.target.checked })}
                    />
                    <span className={styles['sa-ia-config__slider']}></span>
                  </label>
                </div>
                <div className={styles['sa-ia-config__field']}>
                  <label>Seuil de confiance</label>
                  <Stepper value={config.facial_recognition_threshold} onChange={(v) => setConfig({ ...config, facial_recognition_threshold: v })} min={0.5} max={1} step={0.01} disabled={!config.facial_recognition_enabled} />
                  <span className={styles['sa-ia-config__hint']}>0.5 = permissif, 1 = strict</span>
                </div>
                <div className={styles['sa-ia-config__field-toggle']}>
                  <label>Analyse automatique des signalements</label>
                  <label className={styles['sa-ia-config__toggle']}>
                    <input 
                      type="checkbox" 
                      checked={config.auto_analysis_enabled}
                      onChange={(e) => setConfig({ ...config, auto_analysis_enabled: e.target.checked })}
                    />
                    <span className={styles['sa-ia-config__slider']}></span>
                  </label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className={styles['sa-ia-config__actions']}>
              <button type="button" className={styles['sa-ia-config__reset-btn']} onClick={handleReset}>
                <RefreshCw size={18} />
                Réinitialiser
              </button>
              <button type="button" className={styles['sa-ia-config__save-btn']} onClick={handleSave} disabled={isSaving || !hasChanges}>
                {isSaving ? <Loader2 size={18} className={styles['sa-ia-config__spinner']} /> : <Save size={18} />}
                Sauvegarder
              </button>
            </div>
          </>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminIAConfigurationPage;
