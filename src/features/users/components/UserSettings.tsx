/**
 * =====================================================
 * UserSettings Component
 * =====================================================
 */

import React, { useState } from 'react';
import type { UserSettingsProps, UserPreferencesUpdatePayload } from '../types';
import { useUserUpdate } from '../hooks';
import styles from './userSettings.module.css';

export const UserSettings: React.FC<UserSettingsProps> = ({ userId, onSave }) => {
  const { updatePreferences, isLoading } = useUserUpdate();

  const [settings, setSettings] = useState<UserPreferencesUpdatePayload>({
    notifications_email: true,
    notifications_push: true,
    notifications_sms: false,
    langue: 'fr',
    theme: 'light',
    deux_facteurs_actif: false,
    visibilite_profil: 'public',
    recevoir_alertes: true,
    alertes_distance_km: 50,
  });

  const handleChange = (field: keyof UserPreferencesUpdatePayload, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (userId) {
      try {
        await updatePreferences(userId, settings);
        onSave?.();
      } catch (error) {
        console.error('Error saving settings:', error);
      }
    }
  };

  return (
    <div className={styles.container}>
      <h2>Paramètres du compte</h2>

      <div className={styles.section}>
        <h3>Notifications</h3>

        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={settings.notifications_email}
            onChange={(e) => handleChange('notifications_email', e.target.checked)}
          />
          <span>Notifications par email</span>
        </label>

        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={settings.notifications_push}
            onChange={(e) => handleChange('notifications_push', e.target.checked)}
          />
          <span>Notifications push</span>
        </label>

        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={settings.notifications_sms}
            onChange={(e) => handleChange('notifications_sms', e.target.checked)}
          />
          <span>Notifications SMS</span>
        </label>

        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={settings.recevoir_alertes}
            onChange={(e) => handleChange('recevoir_alertes', e.target.checked)}
          />
          <span>Recevoir les alertes de signalements</span>
        </label>

        {settings.recevoir_alertes && (
          <div className={styles.subField}>
            <label>Distance d'alerte (km)</label>
            <input
              type="number"
              value={settings.alertes_distance_km}
              onChange={(e) => handleChange('alertes_distance_km', parseInt(e.target.value))}
              min="1"
              max="500"
            />
          </div>
        )}
      </div>

      <div className={styles.section}>
        <h3>Préférences</h3>

        <div className={styles.field}>
          <label>Langue</label>
          <select
            value={settings.langue}
            onChange={(e) => handleChange('langue', e.target.value)}
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </div>

        <div className={styles.field}>
          <label>Thème</label>
          <select
            value={settings.theme}
            onChange={(e) => handleChange('theme', e.target.value)}
          >
            <option value="light">Clair</option>
            <option value="dark">Sombre</option>
            <option value="auto">Automatique</option>
          </select>
        </div>

        <div className={styles.field}>
          <label>Visibilité du profil</label>
          <select
            value={settings.visibilite_profil}
            onChange={(e) => handleChange('visibilite_profil', e.target.value)}
          >
            <option value="public">Public</option>
            <option value="amis">Amis seulement</option>
            <option value="prive">Privé</option>
          </select>
        </div>
      </div>

      <div className={styles.section}>
        <h3>Sécurité</h3>

        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={settings.deux_facteurs_actif}
            onChange={(e) => handleChange('deux_facteurs_actif', e.target.checked)}
          />
          <span>Authentification à deux facteurs</span>
        </label>
      </div>

      <div className={styles.actions}>
        <button className={styles.saveButton} onClick={handleSave} disabled={isLoading}>
          {isLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      </div>
    </div>
  );
};
