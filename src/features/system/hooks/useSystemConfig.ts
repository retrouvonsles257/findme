import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../config';

export interface SystemConfig {
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
  anonymization_enabled: boolean;
  auto_backup_enabled: boolean;
  backup_frequency_hours: number;
  last_backup_at?: string | null;
  feature_flags: Record<string, boolean>;
}

export const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
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
  anonymization_enabled: false,
  auto_backup_enabled: true,
  backup_frequency_hours: 24,
  last_backup_at: null,
  feature_flags: {
    citizen_authority_messaging: false,
    sos_button: true,
    identity_verification_v2: true,
    push_native_fallback: true,
  },
};

const mergeSystemConfig = (value: Partial<SystemConfig> | null | undefined): SystemConfig => ({
  ...DEFAULT_SYSTEM_CONFIG,
  ...(value || {}),
  feature_flags: {
    ...DEFAULT_SYSTEM_CONFIG.feature_flags,
    ...(value?.feature_flags || {}),
  },
});

export const useSystemConfig = () => {
  const [config, setConfig] = useState<SystemConfig>(DEFAULT_SYSTEM_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    try {
      setError(null);
      const { data, error: fetchError } = await (supabase as any).rpc('get_public_system_config');

      if (fetchError) throw fetchError;
      setConfig(mergeSystemConfig(data));
    } catch (err: any) {
      setError(err.message || 'Configuration système indisponible.');
      setConfig(DEFAULT_SYSTEM_CONFIG);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();

    const channel = supabase
      .channel('system-config-live')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'configuration_systeme',
        filter: 'categorie=eq.system',
      }, () => {
        loadConfig();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadConfig]);

  const flags = useMemo(() => config.feature_flags || {}, [config.feature_flags]);

  return {
    config,
    flags,
    isLoading,
    error,
    reload: loadConfig,
    isFeatureEnabled: (flag: string) => Boolean(flags[flag]),
  };
};

export const useFeatureFlag = (flag: string, fallback = false) => {
  const { flags, isLoading } = useSystemConfig();
  return {
    enabled: flags[flag] ?? fallback,
    isLoading,
  };
};
