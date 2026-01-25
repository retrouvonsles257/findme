import React from 'react';
import styles from './NotificationSettings.module.css';

/**
 * NotificationSettings component - global notification settings
 */
export const NotificationSettings: React.FC = () => {
  return (
    <div className={styles.settings}>
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Sound & Vibration</h4>
        <div className={styles.settingItem}>
          <label className={styles.settingLabel}>
            <input type="checkbox" defaultChecked />
            <span>Enable notification sounds</span>
          </label>
        </div>
        <div className={styles.settingItem}>
          <label className={styles.settingLabel}>
            <input type="checkbox" defaultChecked />
            <span>Enable vibration</span>
          </label>
        </div>
      </div>

      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Quiet Hours</h4>
        <div className={styles.timeRange}>
          <div className={styles.timeInput}>
            <label>From:</label>
            <input type="time" defaultValue="22:00" />
          </div>
          <div className={styles.timeInput}>
            <label>To:</label>
            <input type="time" defaultValue="08:00" />
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Privacy</h4>
        <div className={styles.settingItem}>
          <label className={styles.settingLabel}>
            <input type="checkbox" defaultChecked />
            <span>Show notification preview</span>
          </label>
        </div>
        <div className={styles.settingItem}>
          <label className={styles.settingLabel}>
            <input type="checkbox" />
            <span>Share analytics</span>
          </label>
        </div>
      </div>
    </div>
  );
};
