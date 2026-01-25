import { useState, useCallback } from 'react';

export interface NotificationSettings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  previewEnabled: boolean;
  analyticsEnabled: boolean;
}

export interface UseNotificationSettingsResult {
  settings: NotificationSettings;
  updateSetting: <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => void;
  saveSettings: () => Promise<void>;
  resetSettings: () => void;
}

/**
 * useNotificationSettings hook - manages notification settings
 */
export const useNotificationSettings = (): UseNotificationSettingsResult => {
  const [settings, setSettings] = useState<NotificationSettings>({
    soundEnabled: true,
    vibrationEnabled: true,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    previewEnabled: true,
    analyticsEnabled: false,
  });

  const updateSetting = useCallback(
    <K extends keyof NotificationSettings>(
      key: K,
      value: NotificationSettings[K]
    ) => {
      setSettings((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    []
  );

  const saveSettings = useCallback(async () => {
    try {
      // TODO: Implement API call to save settings
      localStorage.setItem('notificationSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }
  }, [settings]);

  const resetSettings = useCallback(() => {
    setSettings({
      soundEnabled: true,
      vibrationEnabled: true,
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      previewEnabled: true,
      analyticsEnabled: false,
    });
  }, []);

  return {
    settings,
    updateSetting,
    saveSettings,
    resetSettings,
  };
};
