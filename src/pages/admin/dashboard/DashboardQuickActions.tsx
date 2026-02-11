import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface QuickActionItem {
  path: string;
  title: string;
  description: string;
  icon: LucideIcon;
  action: () => void;
}

interface DashboardQuickActionsProps {
  styles: Record<string, string>;
  sectionTitle: string;
  actions: QuickActionItem[];
  accessLabel: string;
}

export const DashboardQuickActions: React.FC<DashboardQuickActionsProps> = ({
  styles,
  sectionTitle,
  actions,
  accessLabel,
}) => (
  <>
    <h2 className={styles.dashboard__sectionTitle}>{sectionTitle}</h2>
    <div className={styles.dashboard__actionsGrid}>
      {actions.map((action) => {
        const IconComponent = action.icon;
        return (
          <div
            key={action.path}
            className={styles.dashboard__actionCard}
            onClick={action.action}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && action.action()}
          >
            <IconComponent className={styles.dashboard__actionIcon} size={28} />
            <h3 className={styles.dashboard__actionTitle}>{action.title}</h3>
            <p className={styles.dashboard__actionDescription}>{action.description}</p>
            <span className={styles.dashboard__actionBtn}>
              {accessLabel} <ArrowRight size={16} />
            </span>
          </div>
        );
      })}
    </div>
  </>
);
