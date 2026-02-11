import React from 'react';
import { Activity, AlertCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  time: string;
  icon: LucideIcon;
}

interface DashboardRecentActivityProps {
  styles: Record<string, string>;
  sectionTitle: string;
  loading: boolean;
  error: boolean;
  errorMessage: string;
  emptyMessage: string;
  activities: ActivityItem[];
}

export const DashboardRecentActivity: React.FC<DashboardRecentActivityProps> = ({
  styles,
  sectionTitle,
  loading,
  error,
  errorMessage,
  emptyMessage,
  activities,
}) => (
  <>
    <h2 className={styles.dashboard__sectionTitle}>{sectionTitle}</h2>
    <div className={styles.dashboard__activityCard}>
      {loading ? (
        <div className={styles.dashboard__skeletonActivityCard}>
          {[1, 2, 3].map((i) => (
            <div
              key={`activity-skeleton-${i}`}
              className={styles.dashboard__skeletonActivityItem}
            >
              <div
                className={`${styles.dashboard__skeleton} ${styles.dashboard__skeletonActivityIcon}`}
              />
              <div className={styles.dashboard__skeletonActivityLines}>
                <div
                  className={`${styles.dashboard__skeleton} ${styles.dashboard__skeletonLine}`}
                />
                <div
                  className={`${styles.dashboard__skeleton} ${styles.dashboard__skeletonLine} ${styles.dashboard__skeletonLineShort}`}
                />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className={styles.dashboard__error} role="alert">
          <AlertCircle size={18} aria-hidden />
          <span>{errorMessage}</span>
        </div>
      ) : activities.length === 0 ? (
        <div className={styles.dashboard__empty}>
          <Activity className={styles.dashboard__emptyIcon} />
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <div className={styles.dashboard__activityList}>
          {activities.map((activity) => {
            const IconComponent = activity.icon;
            return (
              <div
                key={activity.id}
                className={styles.dashboard__activityItem}
              >
                <div className={styles.dashboard__activityIconWrapper}>
                  <IconComponent
                    className={styles.dashboard__activityIcon}
                    size={18}
                  />
                </div>
                <div className={styles.dashboard__activityContent}>
                  <h4 className={styles.dashboard__activityTitle}>
                    {activity.title}
                  </h4>
                  <p className={styles.dashboard__activityDescription}>
                    {activity.description}
                  </p>
                  <span className={styles.dashboard__activityTime}>
                    {activity.time}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  </>
);
