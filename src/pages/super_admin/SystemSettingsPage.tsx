/**
 * ==============================================
 * RETROUVONSLES - Super Admin System Settings Page
 * Paramètres système avec persistance Supabase
 * Table: configuration_systeme
 * ==============================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../../hooks';
import { supabase } from '../../config';
import { SuperAdminLayout } from './SuperAdminLayout';
import { AdminDetailSkeleton } from '../admin/skeletons';
import { Settings, Save, Loader2, AlertCircle, CheckCircle, Globe, Database, Mail, Bell, Minus, Plus, RefreshCw } from 'lucide-react';
import styles from './SystemSettingsPage.module.css';

interface SystemConfig {
  system_name: string;
  system_version: string;
  default_language: string;
  maintenance_mode: boolean;
  maintenance_message: string;
  email_notifications_enabled: boolean;
  smtp_host: string;
  smtp_port: number;
  support_email: string;
  max_file_upload_mb: number;
  allowed_file_types: string;
  data_retention_days: number;
  auto_backup_enabled: boolean;
  backup_frequency_hours: number;
}

const DEFAULT_CONFIG: SystemConfig = {
  system_name: 'RETROUVONS-LES',
  system_version: '1.0.0',
  default_language: 'fr',
  maintenance_mode: false,
  maintenance_message: 'Le système est en maintenance. Veuillez réessayer plus tard.',
  email_notifications_enabled: true,
  smtp_host: '',
  smtp_port: 587,
  support_email: 'support@retrouvonsles.fr',
  max_file_upload_mb: 10,
  allowed_file_types: 'jpg,jpeg,png,pdf',
  data_retention_days: 365,
  auto_backup_enabled: true,
  backup_frequency_hours: 24,
};

export const SuperAdminSystemSettingsPage: React.FC = () => {
  const { t } = useI18n();

  const [config, setConfig] = useState<SystemConfig>(DEFAULT_CONFIG);
  const [originalConfig, setOriginalConfig] = useState<SystemConfig>(DEFAULT_CONFIG);
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
        .eq('categorie', 'system')
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
      console.error('Erreur chargement config système:', err);
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

      const { error: upsertError } = await (supabase as any)
        .from('configuration_systeme')
        .upsert({
          categorie: 'system',
          cle: 'system_config',
          valeur: config,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'categorie' });

      if (upsertError) throw upsertError;

      setOriginalConfig(config);
      setSuccess(t('super_admin.systemSettingsSaveSuccess'));
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Erreur sauvegarde config système:', err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = JSON.stringify(config) !== JSON.stringify(originalConfig);

  const handleReset = () => setConfig(DEFAULT_CONFIG);
  const roundStep = (v: number, s: number) => {
    if (s >= 1) return Math.round(v);
    const d = s <= 0.01 ? 100 : 10;
    return Math.round(v * d) / d;
  };
  const Stepper = (
    { value, onChange, min, max, step = 1, disabled }: 
    { value: number; onChange: (v: number) => void; min: number; max: number; step?: number; disabled?: boolean }
  ) => (
    <div className={styles['sa-system-settings__stepper']}>
      <button type="button" className={styles['sa-system-settings__stepper-btn']} onClick={() => onChange(roundStep(Math.max(min, value - step), step))} disabled={disabled || value <= min} aria-label={t('super_admin.systemSettingsAriaDecrease')}>
        <Minus size={14} />
      </button>
      <input type="number" value={value} onChange={(e) => onChange(roundStep(Math.min(max, Math.max(min, parseFloat(e.target.value) || min)), step))} min={min} max={max} step={step} disabled={disabled} className={styles['sa-system-settings__stepper-input']} />
      <button type="button" className={styles['sa-system-settings__stepper-btn']} onClick={() => onChange(roundStep(Math.min(max, value + step), step))} disabled={disabled || value >= max} aria-label={t('super_admin.systemSettingsAriaIncrease')}>
        <Plus size={14} />
      </button>
    </div>
  );

  return (
    <SuperAdminLayout
      title={t('super_admin.systemSettingsTitle') || 'Paramètres système'}
      activeNav="system-settings"
    >
      <div className={styles['sa-system-settings']}>
        {/* Messages */}
        {error && (
          <div className={styles['sa-system-settings__error']}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className={styles['sa-system-settings__success']}>
            <CheckCircle size={20} />
            <span>{success}</span>
          </div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className={styles['sa-system-settings__skeletonWrap']}>
            <AdminDetailSkeleton blockCount={4} linesPerBlock={4} />
          </div>
        ) : (
          <>
            {/* General Settings */}
            <div className={styles['sa-system-settings__card']}>
              <div className={styles['sa-system-settings__header']}>
                <Settings size={24} />
                <h3>Informations système</h3>
              </div>
              <div className={styles['sa-system-settings__form']}>
                <div className={styles['sa-system-settings__field']}>
                  <label>{t('super_admin.systemSettingsSystemName')}</label>
                  <input 
                    type="text" 
                    value={config.system_name}
                    onChange={(e) => setConfig({ ...config, system_name: e.target.value })}
                  />
                </div>
                <div className={styles['sa-system-settings__field']}>
                  <label>{t('super_admin.systemSettingsVersion')}</label>
                  <input 
                    type="text" 
                    value={config.system_version}
                    readOnly 
                    className={styles['sa-system-settings__readonly']}
                  />
                </div>
                <div className={styles['sa-system-settings__field']}>
                  <label><Globe size={16} /> Langue par défaut</label>
                  <select 
                    value={config.default_language}
                    onChange={(e) => setConfig({ ...config, default_language: e.target.value })}
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                    <option value="ar">العربية</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Maintenance Mode */}
            <div className={styles['sa-system-settings__card']}>
              <div className={styles['sa-system-settings__header']}>
                <Bell size={24} />
                <h3>{t('super_admin.systemSettingsMaintenanceMode')}</h3>
              </div>
              <div className={styles['sa-system-settings__form']}>
                <div className={styles['sa-system-settings__field-toggle']}>
                  <label>{t('super_admin.systemSettingsMaintenanceEnabled')}</label>
                  <label className={styles['sa-system-settings__toggle']}>
                    <input 
                      type="checkbox" 
                      checked={config.maintenance_mode}
                      onChange={(e) => setConfig({ ...config, maintenance_mode: e.target.checked })}
                    />
                    <span className={styles['sa-system-settings__slider']}></span>
                  </label>
                </div>
                <div className={styles['sa-system-settings__field']}>
                  <label>{t('super_admin.systemSettingsMaintenanceMessage')}</label>
                  <textarea 
                    value={config.maintenance_message}
                    onChange={(e) => setConfig({ ...config, maintenance_message: e.target.value })}
                    rows={3}
                    disabled={!config.maintenance_mode}
                  />
                </div>
              </div>
            </div>

            {/* Email Settings */}
            <div className={styles['sa-system-settings__card']}>
              <div className={styles['sa-system-settings__header']}>
                <Mail size={24} />
                <h3>Configuration email</h3>
              </div>
              <div className={styles['sa-system-settings__form']}>
                <div className={styles['sa-system-settings__field-toggle']}>
                  <label>Notifications email activées</label>
                  <label className={styles['sa-system-settings__toggle']}>
                    <input 
                      type="checkbox" 
                      checked={config.email_notifications_enabled}
                      onChange={(e) => setConfig({ ...config, email_notifications_enabled: e.target.checked })}
                    />
                    <span className={styles['sa-system-settings__slider']}></span>
                  </label>
                </div>
                <div className={styles['sa-system-settings__field']}>
                  <label>Hôte SMTP</label>
                  <input 
                    type="text" 
                    value={config.smtp_host}
                    onChange={(e) => setConfig({ ...config, smtp_host: e.target.value })}
                    placeholder="smtp.example.com"
                    disabled={!config.email_notifications_enabled}
                  />
                </div>
                <div className={styles['sa-system-settings__field']}>
                  <label>Port SMTP</label>
                  <Stepper value={config.smtp_port} onChange={(v) => setConfig({ ...config, smtp_port: v })} min={1} max={65535} disabled={!config.email_notifications_enabled} />
                </div>
                <div className={styles['sa-system-settings__field']}>
                  <label>Email support</label>
                  <input 
                    type="email" 
                    value={config.support_email}
                    onChange={(e) => setConfig({ ...config, support_email: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Data & Storage */}
            <div className={styles['sa-system-settings__card']}>
              <div className={styles['sa-system-settings__header']}>
                <Database size={24} />
                <h3>Données & Stockage</h3>
              </div>
              <div className={styles['sa-system-settings__form']}>
                <div className={styles['sa-system-settings__field']}>
                  <label>Taille max upload (Mo)</label>
                  <Stepper value={config.max_file_upload_mb} onChange={(v) => setConfig({ ...config, max_file_upload_mb: v })} min={1} max={100} />
                </div>
                <div className={styles['sa-system-settings__field']}>
                  <label>Types de fichiers autorisés</label>
                  <input 
                    type="text" 
                    value={config.allowed_file_types}
                    onChange={(e) => setConfig({ ...config, allowed_file_types: e.target.value })}
                    placeholder="jpg,jpeg,png,pdf"
                  />
                </div>
                <div className={styles['sa-system-settings__field']}>
                  <label>Rétention des données (jours)</label>
                  <Stepper value={config.data_retention_days} onChange={(v) => setConfig({ ...config, data_retention_days: v })} min={30} max={3650} />
                </div>
                <div className={styles['sa-system-settings__field-toggle']}>
                  <label>Sauvegarde automatique</label>
                  <label className={styles['sa-system-settings__toggle']}>
                    <input 
                      type="checkbox" 
                      checked={config.auto_backup_enabled}
                      onChange={(e) => setConfig({ ...config, auto_backup_enabled: e.target.checked })}
                    />
                    <span className={styles['sa-system-settings__slider']}></span>
                  </label>
                </div>
                <div className={styles['sa-system-settings__field']}>
                  <label>Fréquence sauvegarde (heures)</label>
                  <Stepper value={config.backup_frequency_hours} onChange={(v) => setConfig({ ...config, backup_frequency_hours: v })} min={1} max={168} disabled={!config.auto_backup_enabled} />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className={styles['sa-system-settings__actions']}>
              <button type="button" className={styles['sa-system-settings__reset-btn']} onClick={handleReset}>
                <RefreshCw size={18} />
                Réinitialiser
              </button>
              <button type="button" className={styles['sa-system-settings__save-btn']} onClick={handleSave} disabled={isSaving || !hasChanges}>
                {isSaving ? <Loader2 size={18} className={styles['sa-system-settings__spinner']} /> : <Save size={18} />}
                Sauvegarder
              </button>
            </div>
          </>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminSystemSettingsPage;
