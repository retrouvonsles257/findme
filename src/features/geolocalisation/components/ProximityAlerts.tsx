/**
 * =====================================================
 * RETROUVONSLES - ProximityAlerts Component
 * Component for managing proximity alerts and zones
 * =====================================================
 */

import React, { useState } from 'react';
import { useProximityAlerts } from '../hooks/useProximityAlerts';
import styles from './ProximityAlerts.module.css';

export interface ProximityAlertsProps {
  className?: string;
}

export const ProximityAlerts: React.FC<ProximityAlertsProps> = ({
  className = '',
}) => {
  const {
    proximityAlerts,
    activeAlerts,
    isLoading,
    error,
    addProximityZone,
    dismissAlert,
  } = useProximityAlerts();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    latitude_centre: 3.848,
    longitude_centre: 11.5021,
    rayon_km: 50,
  });

  const handleAddZone = async () => {
    if (!formData.nom) {
      alert('Please enter a zone name');
      return;
    }

    await addProximityZone({
      id: `${Date.now()}`,
      latitude_centre: formData.latitude_centre,
      longitude_centre: formData.longitude_centre,
      rayon_km: formData.rayon_km,
      nom: formData.nom,
      created_at: new Date().toISOString(),
    });

    setFormData({
      nom: '',
      latitude_centre: 3.848,
      longitude_centre: 11.5021,
      rayon_km: 50,
    });
    setShowForm(false);
  };

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.header}>
        <h3>Proximity Alerts</h3>
        <button className={styles.btnAdd} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add Zone'}
        </button>
      </div>

      {error && (
        <div className={styles.error}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {showForm && (
        <div className={styles.formContainer}>
          <div className={styles.formGroup}>
            <label>Zone Name</label>
            <input
              type="text"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              placeholder="Enter zone name"
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Latitude</label>
              <input
                type="number"
                value={formData.latitude_centre}
                onChange={(e) =>
                  setFormData({ ...formData, latitude_centre: parseFloat(e.target.value) })
                }
                step="0.0001"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Longitude</label>
              <input
                type="number"
                value={formData.longitude_centre}
                onChange={(e) =>
                  setFormData({ ...formData, longitude_centre: parseFloat(e.target.value) })
                }
                step="0.0001"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Radius (km)</label>
            <input
              type="number"
              value={formData.rayon_km}
              onChange={(e) => setFormData({ ...formData, rayon_km: parseFloat(e.target.value) })}
              min="1"
              step="10"
            />
          </div>

          <button className={styles.btnSubmit} onClick={handleAddZone} disabled={isLoading}>
            {isLoading ? 'Adding...' : 'Create Zone'}
          </button>
        </div>
      )}

      <div className={styles.alertsList}>
        <h4>Active Zones ({proximityAlerts.length})</h4>

        {proximityAlerts.length === 0 ? (
          <p className={styles.noData}>No proximity zones created yet</p>
        ) : (
          proximityAlerts.map((alert) => (
            <div key={alert.id} className={`${styles.alertCard} ${activeAlerts.includes(alert.id) ? styles.active : ''}`}>
              <div className={styles.alertHeader}>
                <h5>{alert.nom}</h5>
                {activeAlerts.includes(alert.id) && (
                  <span className={styles.triggeredBadge}>TRIGGERED</span>
                )}
              </div>

              <div className={styles.alertDetails}>
                <p>Type: {alert.type_alerte}</p>
                <p>Radius: {alert.radius_km}km</p>
                <p>Created: {new Date(alert.created_at).toLocaleDateString()}</p>
              </div>

              {activeAlerts.includes(alert.id) && (
                <button
                  className={styles.btnDismiss}
                  onClick={() => dismissAlert(alert.id)}
                >
                  Dismiss Alert
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
