import React from 'react';
import { Plus } from 'lucide-react';

interface DashboardWelcomeProps {
  styles: Record<string, string>;
  welcomeTitle: string;
  welcomeDescription: string;
  newDossierLabel: string;
  onNewDossier: () => void;
}

export const DashboardWelcome: React.FC<DashboardWelcomeProps> = ({
  styles,
  welcomeTitle,
  welcomeDescription,
  newDossierLabel,
  onNewDossier,
}) => (
  <div className={styles.dashboard__welcome}>
    <div className={styles.dashboard__welcomeContent}>
      <h2 className={styles.dashboard__welcomeTitle}>{welcomeTitle}</h2>
      <p className={styles.dashboard__welcomeDescription}>{welcomeDescription}</p>
    </div>
    <button
      type="button"
      className={styles.dashboard__btnCreate}
      onClick={onNewDossier}
      title={newDossierLabel}
      aria-label={newDossierLabel}
    >
      <Plus size={18} />
      {newDossierLabel}
    </button>
  </div>
);
