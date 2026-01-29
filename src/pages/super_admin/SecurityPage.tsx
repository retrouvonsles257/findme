/**
 * ============================================== 
 * RETROUVONSLES - Super Admin Security Page
 * Paramètres de sécurité avec persistance Supabase
 * Table: configuration_systeme
 * ==============================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../../hooks';
import { supabase } from '../../config';
import { SuperAdminLayout } from './SuperAdminLayout';
import { Shield, Lock, Key, Save, Loader2, AlertCircle, CheckCircle, Eye, Clock, Users, Minus, Plus, RefreshCw } from 'lucide-react';
import styles from './SecurityPage.module.css';

interface SecurityConfig {
  mfa_enabled: boolean;
  mfa_required_for_admins: boolean;
  api_rate_limiting: boolean;
  max_requests_per_hour: number;
  session_timeout_minutes: number;
  password_min_length: number;
  password_require_special: boolean;
  password_require_numbers: boolean;
  max_login_attempts: number;
  lockout_duration_minutes: number;
  ip_whitelist_enabled: boolean;
  audit_log_retention_days: number;
}

const DEFAULT_CONFIG: SecurityConfig = {
  mfa_enabled: true,
  mfa_required_for_admins: true,
  api_rate_limiting: true,
  max_requests_per_hour: 1000,
  session_timeout_minutes: 60,
  password_min_length: 8,
  password_require_special: true,
  password_require_numbers: true,
  max_login_attempts: 5,
  lockout_duration_minutes: 15,
  ip_whitelist_enabled: false,
  audit_log_retention_days: 90,
};

export const SuperAdminSecurityPage: React.FC = () => {
  const { t } = useI18n();

  const [config, setConfig] = useState<SecurityConfig>(DEFAULT_CONFIG);
  const [originalConfig, setOriginalConfig] = useState<SecurityConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const loadConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Charger la configuration
      const { data: configData, error: configError } = await (supabase as any)
        .from('configuration_systeme')
        .select('*')
        .eq('categorie', 'security')
        .single();

      if (configError && configError.code !== 'PGRST116') {
        throw configError;
      }

      if (configData && configData.valeur) {
        const loadedConfig = { ...DEFAULT_CONFIG, ...configData.valeur };
        setConfig(loadedConfig);
        setOriginalConfig(loadedConfig);
      }

      // Charger les activités récentes de sécurité
      const { data: activityData } = await (supabase as any)
        .from('journal_activite')
        .select('*')
        .in('type_action', ['connexion', 'deconnexion', 'tentative_connexion_echouee', 'changement_mot_passe'])
        .order('created_at', { ascending: false })
        .limit(10);

      setRecentActivity(activityData || []);

    } catch (err: any) {
      console.error('Erreur chargement config sécurité:', err);
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
          categorie: 'security',
          cle: 'security_config',
          valeur: config,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'categorie' });

      if (upsertError) throw upsertError;

      setOriginalConfig(config);
      setSuccess('Configuration de sécurité sauvegardée avec succès');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Erreur sauvegarde config sécurité:', err);
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
    <div className={styles['sa-security__stepper']}>
      <button type="button" className={styles['sa-security__stepper-btn']} onClick={() => onChange(roundStep(Math.max(min, value - step), step))} disabled={disabled || value <= min} aria-label="Diminuer">
        <Minus size={14} />
      </button>
      <input type="number" value={value} onChange={(e) => onChange(roundStep(Math.min(max, Math.max(min, parseFloat(e.target.value) || min)), step))} min={min} max={max} step={step} disabled={disabled} className={styles['sa-security__stepper-input']} />
      <button type="button" className={styles['sa-security__stepper-btn']} onClick={() => onChange(roundStep(Math.min(max, value + step), step))} disabled={disabled || value >= max} aria-label="Augmenter">
        <Plus size={14} />
      </button>
    </div>
  );

  return (
    <SuperAdminLayout
      title={t('super_admin.securityTitle') || 'Sécurité'}
      activeNav="security"
    >
      <div className={styles['sa-security']}>
        {/* Messages */}
        {error && (
          <div className={styles['sa-security__error']}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className={styles['sa-security__success']}>
            <CheckCircle size={20} />
            <span>{success}</span>
          </div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className={styles['sa-security__loading']}>
            <Loader2 size={32} className={styles['sa-security__spinner']} />
          </div>
        ) : (
          <>
            {/* Authentication Settings */}
            <div className={styles['sa-security__card']}>
              <div className={styles['sa-security__header']}>
                <Shield size={24} />
                <h3>Authentification</h3>
              </div>
              <div className={styles['sa-security__settings']}>
                <div className={styles['sa-security__setting']}>
                  <div className={styles['sa-security__setting-info']}>
                    <Lock size={20} />
                    <div>
                      <span>MFA activé</span>
                      <small>Authentification multi-facteurs</small>
                    </div>
                  </div>
                  <label className={styles['sa-security__toggle']}>
                    <input 
                      type="checkbox" 
                      checked={config.mfa_enabled}
                      onChange={(e) => setConfig({ ...config, mfa_enabled: e.target.checked })}
                    />
                    <span className={styles['sa-security__slider']}></span>
                  </label>
                </div>
                <div className={styles['sa-security__setting']}>
                  <div className={styles['sa-security__setting-info']}>
                    <Users size={20} />
                    <div>
                      <span>MFA obligatoire pour admins</span>
                      <small>Force le MFA pour les administrateurs</small>
                    </div>
                  </div>
                  <label className={styles['sa-security__toggle']}>
                    <input 
                      type="checkbox" 
                      checked={config.mfa_required_for_admins}
                      onChange={(e) => setConfig({ ...config, mfa_required_for_admins: e.target.checked })}
                      disabled={!config.mfa_enabled}
                    />
                    <span className={styles['sa-security__slider']}></span>
                  </label>
                </div>
                <div className={styles['sa-security__setting']}>
                  <div className={styles['sa-security__setting-info']}>
                    <Clock size={20} />
                    <div>
                      <span>Timeout de session (minutes)</span>
                      <small>Déconnexion automatique après inactivité</small>
                    </div>
                  </div>
                  <Stepper value={config.session_timeout_minutes} onChange={(v) => setConfig({ ...config, session_timeout_minutes: v })} min={5} max={480} />
                </div>
                <div className={styles['sa-security__setting']}>
                  <div className={styles['sa-security__setting-info']}>
                    <Lock size={20} />
                    <div>
                      <span>Tentatives de connexion max</span>
                      <small>Avant verrouillage du compte</small>
                    </div>
                  </div>
                  <Stepper value={config.max_login_attempts} onChange={(v) => setConfig({ ...config, max_login_attempts: v })} min={3} max={10} />
                </div>
              </div>
            </div>

            {/* API & Rate Limiting */}
            <div className={styles['sa-security__card']}>
              <div className={styles['sa-security__header']}>
                <Key size={24} />
                <h3>API & Rate Limiting</h3>
              </div>
              <div className={styles['sa-security__settings']}>
                <div className={styles['sa-security__setting']}>
                  <div className={styles['sa-security__setting-info']}>
                    <Key size={20} />
                    <div>
                      <span>Rate Limiting API</span>
                      <small>Limiter le nombre de requêtes</small>
                    </div>
                  </div>
                  <label className={styles['sa-security__toggle']}>
                    <input 
                      type="checkbox" 
                      checked={config.api_rate_limiting}
                      onChange={(e) => setConfig({ ...config, api_rate_limiting: e.target.checked })}
                    />
                    <span className={styles['sa-security__slider']}></span>
                  </label>
                </div>
                <div className={styles['sa-security__setting']}>
                  <div className={styles['sa-security__setting-info']}>
                    <Clock size={20} />
                    <div>
                      <span>Requêtes max par heure</span>
                      <small>Par utilisateur</small>
                    </div>
                  </div>
                  <Stepper value={config.max_requests_per_hour} onChange={(v) => setConfig({ ...config, max_requests_per_hour: v })} min={100} max={10000} disabled={!config.api_rate_limiting} />
                </div>
              </div>
            </div>

            {/* Password Policy */}
            <div className={styles['sa-security__card']}>
              <div className={styles['sa-security__header']}>
                <Eye size={24} />
                <h3>Politique de mot de passe</h3>
              </div>
              <div className={styles['sa-security__settings']}>
                <div className={styles['sa-security__setting']}>
                  <div className={styles['sa-security__setting-info']}>
                    <Lock size={20} />
                    <div>
                      <span>Longueur minimum</span>
                      <small>Nombre de caractères requis</small>
                    </div>
                  </div>
                  <Stepper value={config.password_min_length} onChange={(v) => setConfig({ ...config, password_min_length: v })} min={6} max={20} />
                </div>
                <div className={styles['sa-security__setting']}>
                  <div className={styles['sa-security__setting-info']}>
                    <Key size={20} />
                    <div>
                      <span>Caractères spéciaux requis</span>
                      <small>Ex: @, #, $, !</small>
                    </div>
                  </div>
                  <label className={styles['sa-security__toggle']}>
                    <input 
                      type="checkbox" 
                      checked={config.password_require_special}
                      onChange={(e) => setConfig({ ...config, password_require_special: e.target.checked })}
                    />
                    <span className={styles['sa-security__slider']}></span>
                  </label>
                </div>
                <div className={styles['sa-security__setting']}>
                  <div className={styles['sa-security__setting-info']}>
                    <Key size={20} />
                    <div>
                      <span>Chiffres requis</span>
                      <small>Au moins un chiffre</small>
                    </div>
                  </div>
                  <label className={styles['sa-security__toggle']}>
                    <input 
                      type="checkbox" 
                      checked={config.password_require_numbers}
                      onChange={(e) => setConfig({ ...config, password_require_numbers: e.target.checked })}
                    />
                    <span className={styles['sa-security__slider']}></span>
                  </label>
                </div>
              </div>
            </div>

            {/* Recent Security Activity */}
            {recentActivity.length > 0 && (
              <div className={styles['sa-security__card']}>
                <div className={styles['sa-security__header']}>
                  <Clock size={24} />
                  <h3>Activité récente</h3>
                </div>
                <div className={styles['sa-security__activity']}>
                  {recentActivity.map((activity, index) => (
                    <div key={index} className={styles['sa-security__activity-item']}>
                      <span className={styles['sa-security__activity-type']}>{activity.type_action}</span>
                      <span className={styles['sa-security__activity-date']}>
                        {new Date(activity.created_at).toLocaleString('fr-FR')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className={styles['sa-security__actions']}>
              <button type="button" className={styles['sa-security__reset-btn']} onClick={handleReset}>
                <RefreshCw size={18} />
                Réinitialiser
              </button>
              <button type="button" className={styles['sa-security__save-btn']} onClick={handleSave} disabled={isSaving || !hasChanges}>
                {isSaving ? <Loader2 size={18} className={styles['sa-security__spinner']} /> : <Save size={18} />}
                Sauvegarder
              </button>
            </div>
          </>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminSecurityPage;
