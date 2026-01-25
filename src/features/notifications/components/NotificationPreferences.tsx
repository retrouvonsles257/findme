import React, { useState } from 'react';
import styles from './NotificationSettings.module.css';

export interface NotificationPreference {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

/**
 * NotificationPreferences component - notification preference settings
 */
export const NotificationPreferences: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([
    {
      id: 'missing-person',
      name: 'Missing Person Alerts',
      description: 'Get notified about new missing person cases',
      enabled: true,
    },
    {
      id: 'sighting-report',
      name: 'Sighting Reports',
      description: 'Get notified when sightings are reported',
      enabled: true,
    },
    {
      id: 'case-update',
      name: 'Case Updates',
      description: 'Get notified about updates on followed cases',
      enabled: true,
    },
    {
      id: 'match-found',
      name: 'AI Matches',
      description: 'Get notified when AI detects potential matches',
      enabled: false,
    },
    {
      id: 'message',
      name: 'Messages',
      description: 'Get notified about new messages',
      enabled: true,
    },
  ]);

  const handleToggle = (id: string) => {
    setPreferences((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, enabled: !p.enabled } : p
      )
    );
  };

  return (
    <div className={styles.preferences}>
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Notification Types</h4>
        <div className={styles.preferencesList}>
          {preferences.map((pref) => (
            <div key={pref.id} className={styles.preferenceItem}>
              <div className={styles.preferenceInfo}>
                <label className={styles.preferenceName}>
                  {pref.name}
                </label>
                <p className={styles.preferenceDescription}>
                  {pref.description}
                </p>
              </div>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={pref.enabled}
                  onChange={() => handleToggle(pref.id)}
                />
                <span className={styles.toggleSlider} />
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Frequency</h4>
        <div className={styles.frequencyOptions}>
          <label className={styles.radioItem}>
            <input type="radio" name="frequency" value="instant" defaultChecked />
            <span>Instant</span>
          </label>
          <label className={styles.radioItem}>
            <input type="radio" name="frequency" value="daily" />
            <span>Daily Digest</span>
          </label>
          <label className={styles.radioItem}>
            <input type="radio" name="frequency" value="weekly" />
            <span>Weekly Digest</span>
          </label>
        </div>
      </div>
    </div>
  );
};
