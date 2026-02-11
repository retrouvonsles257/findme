import React from 'react';
import { ArrowRight } from 'lucide-react';

interface DashboardSummaryProps {
  styles: Record<string, string>;
  sectionTitle: string;
  totalUsersLabel: string;
  recentReportsLabel: string;
  successRateLabel: string;
  totalUsers: number;
  recentReports: number;
  successRate: number;
  percentLabel: string;
  viewDetailedStatsLabel: string;
  onViewStats: () => void;
}

export const DashboardSummary: React.FC<DashboardSummaryProps> = ({
  styles,
  sectionTitle,
  totalUsersLabel,
  recentReportsLabel,
  successRateLabel,
  totalUsers,
  recentReports,
  successRate,
  percentLabel,
  viewDetailedStatsLabel,
  onViewStats,
}) => (
  <>
    <h2 className={styles.dashboard__sectionTitle}>{sectionTitle}</h2>
    <div className={styles.dashboard__summaryCard}>
      <div className={styles.dashboard__summaryItem}>
        <span className={styles.dashboard__summaryLabel}>{totalUsersLabel}</span>
        <span className={styles.dashboard__summaryValue}>{totalUsers}</span>
      </div>
      <div className={styles.dashboard__summaryDivider} />
      <div className={styles.dashboard__summaryItem}>
        <span className={styles.dashboard__summaryLabel}>{recentReportsLabel}</span>
        <span className={styles.dashboard__summaryValue}>{recentReports}</span>
      </div>
      <div className={styles.dashboard__summaryDivider} />
      <div className={styles.dashboard__summaryItem}>
        <span className={styles.dashboard__summaryLabel}>{successRateLabel}</span>
        <span className={styles.dashboard__summaryValue}>
          {successRate}{percentLabel}
        </span>
      </div>
      <div className={styles.dashboard__summaryDivider} />
      <button
        type="button"
        className={styles.dashboard__summaryBtn}
        onClick={onViewStats}
        title={viewDetailedStatsLabel}
        aria-label={viewDetailedStatsLabel}
      >
        {viewDetailedStatsLabel} <ArrowRight size={16} />
      </button>
    </div>
  </>
);
