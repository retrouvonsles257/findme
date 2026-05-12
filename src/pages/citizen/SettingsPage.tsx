/**
 * =====================================================
 * RETROUVONSLES - Citizen Settings Page
 * Page pour gérer les préférences utilisateur
 * Intégré avec Supabase et les services de notification
 * =====================================================
 */

import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../../store/types';
import { selectUser } from '../../features/auth/store/authSelectors';
import { supabase } from '../../config';
import { deleteFCMToken } from '../../config/firebase.config';
import { unregisterCurrentFcmDevice } from '../../features/notifications/services/fcmTokenAPI';
import { useI18n } from '../../hooks';
import { CitizenLayout } from './CitizenLayout';
import {
  Bell,
  MapPin,
  Globe,
  Shield,
  Moon,
  Smartphone,
  Mail,
  Eye,
  Volume2,
  Loader2,
  AlertCircle,
  CheckCircle,
  Save,
  RefreshCw,
  Gauge,
  Activity,
} from 'lucide-react';
import { AdminDetailSkeleton } from 'components/skeletons';
import styles from './SettingsPage.module.css';

interface InterestZone {
  id: string;
  label: string;
  ville: string;
  region: string;
  rayon_km: number;
}

interface Settings {
  // Notifications
  notifications_push: boolean;
  notifications_email: boolean;
  notifications_sms: boolean;
  notifications_son: boolean;

  // Géolocalisation
  geolocalisation_active: boolean;
  rayon_notification_km: number;
  partager_position: boolean;

  // Affichage
  langue: string;
  theme: 'light' | 'dark' | 'auto';

  // Confidentialité
  profil_public: boolean;
  afficher_activite: boolean;
  zones_interet: InterestZone[];
}

export const CitizenSettingsPage: React.FC = () => {
  const { t, language, changeLanguage } = useI18n();
  const currentUser = useAppSelector(selectUser);
  const userId = (currentUser as any)?.id;

  const [settings, setSettings] = useState<Settings>({
    notifications_push: true,
    notifications_email: true,
    notifications_sms: false,
    notifications_son: true,
    geolocalisation_active: false,
    rayon_notification_km: 50,
    partager_position: false,
    langue: language || 'fr',
    theme: 'light',
    profil_public: false,
    afficher_activite: true,
    zones_interet: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Charger les paramètres
  useEffect(() => {
    const loadSettings = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data, error } = await (supabase as any)
          .from('utilisateur')
          .select('*')
          .eq('id', userId)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          // preferences_notification is a JSONB column that stores all settings
          const prefs = data.preferences_notification || {};
          setSettings({
            notifications_push: data.accepte_notifications ?? true,
            notifications_email: prefs.email ?? true,
            notifications_sms: prefs.sms ?? false,
            notifications_son: prefs.son ?? true,
            geolocalisation_active: data.accepte_geolocalisation ?? false,
            rayon_notification_km: data.rayon_notification_km ?? 50,
            partager_position: prefs.partager_position ?? false,
            langue: data.langue_preferee ?? language ?? 'fr',
            theme: prefs.theme ?? 'light',
            profil_public: prefs.profil_public ?? false,
            afficher_activite: prefs.afficher_activite ?? true,
            zones_interet: Array.isArray(prefs.zones_interet) ? prefs.zones_interet : [],
          });
        }
      } catch (err: any) {
        console.error('Erreur chargement paramètres:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [userId, language]);

  // Gérer les changements
  const handleChange = (key: keyof Settings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
    setError(null);
    setSuccess(null);

    // Changer la langue immédiatement
    if (key === 'langue' && changeLanguage) {
      changeLanguage(value);
    }
  };

  // Gestion des zones d'intérêt
  const handleAddZone = () => {
    const newZone: InterestZone = {
      id: crypto.randomUUID(),
      label: '',
      ville: '',
      region: '',
      rayon_km: 20,
    };
    setSettings((prev) => ({
      ...prev,
      zones_interet: [...prev.zones_interet, newZone],
    }));
    setHasChanges(true);
  };

  const handleUpdateZone = (id: string, field: keyof InterestZone, value: string | number) => {
    setSettings((prev) => ({
      ...prev,
      zones_interet: prev.zones_interet.map((zone) =>
        zone.id === id ? { ...zone, [field]: value } : zone
      ),
    }));
    setHasChanges(true);
  };

  const handleRemoveZone = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      zones_interet: prev.zones_interet.filter((z) => z.id !== id),
    }));
    setHasChanges(true);
  };

  // Sauvegarder les paramètres
  const handleSave = async () => {
    if (!userId) return;

    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      const { error: dbError } = await (supabase as any)
        .from('utilisateur')
        .update({
          accepte_notifications: settings.notifications_push,
          accepte_geolocalisation: settings.geolocalisation_active,
          rayon_notification_km: settings.rayon_notification_km,
          langue_preferee: settings.langue,
          preferences_notification: {
            email: settings.notifications_email,
            sms: settings.notifications_sms,
            son: settings.notifications_son,
            partager_position: settings.partager_position,
            theme: settings.theme,
            profil_public: settings.profil_public,
            afficher_activite: settings.afficher_activite,
            zones_interet: settings.zones_interet,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (dbError) throw dbError;

      if (!settings.notifications_push) {
        try {
          await unregisterCurrentFcmDevice(userId);
          await deleteFCMToken();
        } catch (e) {

        }
      }

      setSuccess(t('citizen.settingsSaved'));
      setHasChanges(false);

      setTimeout(() => setSuccess(null), 3000);

    } catch (err: any) {
      console.error('Erreur sauvegarde paramètres:', err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Réinitialiser
  const handleReset = () => {
    setSettings({
      notifications_push: true,
      notifications_email: true,
      notifications_sms: false,
      notifications_son: true,
      geolocalisation_active: false,
      rayon_notification_km: 50,
      partager_position: false,
      langue: 'fr',
      theme: 'light',
      profil_public: false,
      afficher_activite: true,
      zones_interet: [],
    });
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <CitizenLayout activeNav="settings">
        <div className={styles.settings}>
          <div className={styles['settings__skeletonWrap']}>
            <AdminDetailSkeleton blockCount={3} linesPerBlock={4} />
          </div>
        </div>
      </CitizenLayout>
    );
  }

  return (
    <CitizenLayout activeNav="settings">
      <div className={styles.settings}>
        {/* Messages */}
        {error && (
          <div className={styles['settings__error']}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className={styles['settings__success']}>
            <CheckCircle size={20} />
            <span>{success}</span>
          </div>
        )}

        {/* Notifications Section */}
        <div className={styles['settings__section']}>
          <div className={styles['settings__section-header']}>
            <Bell size={22} />
            <h2>{t('citizen.notificationSettings')}</h2>
          </div>

          <div className={styles['settings__options']}>
            <div className={styles['settings__option']}>
              <div className={styles['settings__option-info']}>
                <Smartphone size={18} />
                <div>
                  <h4>{t('citizen.pushNotifications')}</h4>
                  <p>{t('citizen.pushNotificationsDesc')}</p>
                </div>
              </div>
              <label className={styles['settings__toggle']}>
                <input
                  type="checkbox"
                  checked={settings.notifications_push}
                  onChange={(e) => handleChange('notifications_push', e.target.checked)}
                />
                <span className={styles['settings__toggle-slider']} />
              </label>
            </div>

            <div className={styles['settings__option']}>
              <div className={styles['settings__option-info']}>
                <Mail size={18} />
                <div>
                  <h4>{t('citizen.emailNotifications')}</h4>
                  <p>{t('citizen.emailNotificationsDesc')}</p>
                </div>
              </div>
              <label className={styles['settings__toggle']}>
                <input
                  type="checkbox"
                  checked={settings.notifications_email}
                  onChange={(e) => handleChange('notifications_email', e.target.checked)}
                />
                <span className={styles['settings__toggle-slider']} />
              </label>
            </div>

            <div className={styles['settings__option']}>
              <div className={styles['settings__option-info']}>
                <Volume2 size={18} />
                <div>
                  <h4>{t('citizen.soundNotifications')}</h4>
                  <p>{t('citizen.soundNotificationsDesc')}</p>
                </div>
              </div>
              <label className={styles['settings__toggle']}>
                <input
                  type="checkbox"
                  checked={settings.notifications_son}
                  onChange={(e) => handleChange('notifications_son', e.target.checked)}
                />
                <span className={styles['settings__toggle-slider']} />
              </label>
            </div>
          </div>
        </div>

        {/* Géolocalisation Section */}
        <div className={styles['settings__section']}>
          <div className={styles['settings__section-header']}>
            <MapPin size={22} />
            <h2>{t('citizen.locationSettings')}</h2>
          </div>

          <div className={styles['settings__options']}>
            <div className={styles['settings__option']}>
              <div className={styles['settings__option-info']}>
                <MapPin size={18} />
                <div>
                  <h4>{t('citizen.enableGeolocation')}</h4>
                  <p>{t('citizen.enableGeolocationDesc')}</p>
                </div>
              </div>
              <label className={styles['settings__toggle']}>
                <input
                  type="checkbox"
                  checked={settings.geolocalisation_active}
                  onChange={(e) => handleChange('geolocalisation_active', e.target.checked)}
                />
                <span className={styles['settings__toggle-slider']} />
              </label>
            </div>

            <div className={styles['settings__option']}>
              <div className={styles['settings__option-info']}>
                <Gauge size={18} />
                <div>
                  <h4>{t('citizen.notificationRadius')}</h4>
                  <p>{t('citizen.notificationRadiusDesc')}</p>
                </div>
              </div>
              <div className={styles['settings__slider-container']}>
                <input
                  type="range"
                  min="5"
                  max="200"
                  step="5"
                  value={settings.rayon_notification_km}
                  onChange={(e) => handleChange('rayon_notification_km', parseInt(e.target.value))}
                  className={styles['settings__slider']}
                />
                <span className={styles['settings__slider-value']}>
                  {settings.rayon_notification_km} km
                </span>
              </div>
            </div>

            <div className={styles['settings__option']}>
              <div className={styles['settings__option-info']}>
                <Eye size={18} />
                <div>
                  <h4>{t('citizen.shareLocation')}</h4>
                  <p>{t('citizen.shareLocationDesc')}</p>
                </div>
              </div>
              <label className={styles['settings__toggle']}>
                <input
                  type="checkbox"
                  checked={settings.partager_position}
                  onChange={(e) => handleChange('partager_position', e.target.checked)}
                />
                <span className={styles['settings__toggle-slider']} />
              </label>
            </div>
          </div>
        </div>

        {/* Affichage Section */}
        <div className={styles['settings__section']}>
          <div className={styles['settings__section-header']}>
            <Globe size={22} />
            <h2>{t('citizen.displaySettings')}</h2>
          </div>

          <div className={styles['settings__options']}>
            <div className={styles['settings__option']}>
              <div className={styles['settings__option-info']}>
                <Globe size={18} />
                <div>
                  <h4>{t('citizen.language')}</h4>
                  <p>{t('citizen.languageDesc')}</p>
                </div>
              </div>
              <select
                value={settings.langue}
                onChange={(e) => handleChange('langue', e.target.value)}
                className={styles['settings__select']}
              >
                <option value="fr">{t('citizen.languageFr')}</option>
                <option value="en">{t('citizen.languageEn')}</option>
              </select>
            </div>

            <div className={styles['settings__option']}>
              <div className={styles['settings__option-info']}>
                <Moon size={18} />
                <div>
                  <h4>{t('citizen.theme')}</h4>
                  <p>{t('citizen.themeDesc')}</p>
                </div>
              </div>
              <select
                value={settings.theme}
                onChange={(e) => handleChange('theme', e.target.value as 'light' | 'dark' | 'auto')}
                className={styles['settings__select']}
              >
                <option value="light">{t('citizen.lightTheme')}</option>
                <option value="dark">{t('citizen.darkTheme')}</option>
                <option value="auto">{t('citizen.autoTheme')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Confidentialité Section */}
        <div className={styles['settings__section']}>
          <div className={styles['settings__section-header']}>
            <Shield size={22} />
            <h2>{t('citizen.privacySettings')}</h2>
          </div>

          <div className={styles['settings__options']}>
            <div className={styles['settings__option']}>
              <div className={styles['settings__option-info']}>
                <Eye size={18} />
                <div>
                  <h4>{t('citizen.publicProfile')}</h4>
                  <p>{t('citizen.publicProfileDesc')}</p>
                </div>
              </div>
              <label className={styles['settings__toggle']}>
                <input
                  type="checkbox"
                  checked={settings.profil_public}
                  onChange={(e) => handleChange('profil_public', e.target.checked)}
                />
                <span className={styles['settings__toggle-slider']} />
              </label>
            </div>

            <div className={styles['settings__option']}>
              <div className={styles['settings__option-info']}>
                <Activity size={18} />
                <div>
                  <h4>{t('citizen.showActivity')}</h4>
                  <p>{t('citizen.showActivityDesc')}</p>
                </div>
              </div>
              <label className={styles['settings__toggle']}>
                <input
                  type="checkbox"
                  checked={settings.afficher_activite}
                  onChange={(e) => handleChange('afficher_activite', e.target.checked)}
                />
                <span className={styles['settings__toggle-slider']} />
              </label>
            </div>
          </div>
        </div>

        {/* Zones d'intérêt géographiques */}
        <div className={styles['settings__section']}>
          <div className={styles['settings__section-header']}>
            <MapPin size={22} />
            <h2>{t('citizen.interestZones')}</h2>
          </div>

          <div className={styles['settings__options']}>
            {settings.zones_interet.map((zone) => (
              <div key={zone.id} className={styles['settings__option']}>
                <div className={styles['settings__option-info']}>
                  <MapPin size={18} />
                  <div className={styles['settings__zone-inner']}>
                    <h4>{zone.label || t('citizen.zoneLabelPlaceholder')}</h4>
                    <div className={styles['settings__zone-fields']}>
                      <input
                        type="text"
                        placeholder={t('citizen.zoneLabel')}
                        value={zone.label}
                        onChange={(e) => handleUpdateZone(zone.id, 'label', e.target.value)}
                        className={styles['settings__select']}
                      />
                      <input
                        type="text"
                        placeholder={t('citizen.city')}
                        value={zone.ville}
                        onChange={(e) => handleUpdateZone(zone.id, 'ville', e.target.value)}
                        className={styles['settings__select']}
                      />
                      <input
                        type="text"
                        placeholder={t('citizen.region')}
                        value={zone.region}
                        onChange={(e) => handleUpdateZone(zone.id, 'region', e.target.value)}
                        className={styles['settings__select']}
                      />
                    </div>
                    <div className={styles['settings__slider-container'] + ' ' + styles['settings__slider-container--zone']}>
                      <input
                        type="range"
                        min="1"
                        max="200"
                        step="1"
                        value={zone.rayon_km}
                        onChange={(e) => handleUpdateZone(zone.id, 'rayon_km', parseInt(e.target.value, 10))}
                        className={styles['settings__slider']}
                      />
                      <span className={styles['settings__slider-value']}>
                        {zone.rayon_km} km
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className={styles['settings__reset-btn']}
                  onClick={() => handleRemoveZone(zone.id)}
                >
                  <RefreshCw size={16} />
                  {t('citizen.removeZone')}
                </button>
              </div>
            ))}
            <div className={styles['settings__option']}>
              <div className={styles['settings__option-info']}>
                <MapPin size={18} />
                <div>
                  <h4>{t('citizen.addInterestZone')}</h4>
                  <p>{t('citizen.addInterestZoneDesc')}</p>
                </div>
              </div>
              <button
                type="button"
                className={styles['settings__save-btn']}
                onClick={handleAddZone}
              >
                <Save size={18} />
                {t('citizen.addZone')}
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className={styles['settings__actions']}>
          <button
            className={styles['settings__reset-btn']}
            onClick={handleReset}
            type="button"
          >
            <RefreshCw size={18} />
            {t('citizen.resetSettings')}
          </button>

          <button
            className={styles['settings__save-btn']}
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 size={18} className={styles['settings__spin']} />
                {t('common.saving')}
              </>
            ) : (
              <>
                <Save size={18} />
                {t('citizen.saveSettings')}
              </>
            )}
          </button>
        </div>
      </div>
    </CitizenLayout>
  );
};
