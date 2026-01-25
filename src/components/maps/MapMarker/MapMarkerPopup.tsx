import React from 'react';
import styles from './MapMarker.module.css';

export interface MapMarkerPopupProps {
  label: string;
  description?: string;
  image?: string;
  type?: 'missing' | 'sighting' | 'organization' | 'alert' | 'default';
  data?: Record<string, any>;
  onClose?: () => void;
}

/**
 * MapMarkerPopup component - shows details when marker is clicked
 */
export const MapMarkerPopup: React.FC<MapMarkerPopupProps> = ({
  label,
  description,
  image,
  type = 'default',
  data,
  onClose,
}) => {
  return (
    <div className={styles.popup}>
      <button className={styles.closeBtn} onClick={onClose}>
        ×
      </button>

      {image && (
        <div className={styles.popupImage}>
          <img src={image} alt={label} />
        </div>
      )}

      <div className={styles.popupContent}>
        <h4 className={styles.popupTitle}>{label}</h4>

        {description && (
          <p className={styles.popupDescription}>{description}</p>
        )}

        {data && Object.keys(data).length > 0 && (
          <div className={styles.popupData}>
            {Object.entries(data).map(([key, value]) => (
              <div key={key} className={styles.dataRow}>
                <span className={styles.dataLabel}>{key}:</span>
                <span className={styles.dataValue}>
                  {String(value)}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className={styles.popupBadge}>{type}</div>
      </div>
    </div>
  );
};
