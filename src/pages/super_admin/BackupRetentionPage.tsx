import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Archive, Clock, DatabaseBackup, Download, RefreshCw, ShieldAlert } from 'lucide-react';
import { supabase } from '../../config';
import { SuperAdminLayout } from './SuperAdminLayout';
import { AdminCardsGridSkeleton } from 'components/skeletons';
import styles from './SystemLogsPage.module.css';

interface BackupRetentionMetrics {
  generated_at?: string;
  data_retention_days?: number;
  anonymization_enabled?: boolean;
  auto_backup_enabled?: boolean;
  backup_frequency_hours?: number;
  last_backup_at?: string | null;
  configuration_updated_at?: string | null;
  audit_log_entries?: number;
  old_audit_log_entries?: number;
}

const fmt = (value?: number) => (value ?? 0).toLocaleString('fr-FR');
const boolLabel = (value?: boolean) => (value ? 'Activé' : 'Désactivé');
const dateLabel = (value?: string | null) => value ? new Date(value).toLocaleString('fr-FR') : 'Non renseigné';

export const SuperAdminBackupRetentionPage: React.FC = () => {
  const [metrics, setMetrics] = useState<BackupRetentionMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [operationResult, setOperationResult] = useState<string | null>(null);

  const loadMetrics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data, error: rpcError } = await (supabase as any).rpc('get_backup_retention_metrics');
      if (rpcError) throw rpcError;
      setMetrics(data || {});
    } catch (err: any) {
      setError(err.message || 'Impossible de charger la politique de sauvegarde.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const exportComplianceSnapshot = () => {
    const payload = {
      type: 'superadmin_compliance_snapshot',
      generated_at: new Date().toISOString(),
      scope: 'system_only_no_business_content',
      metrics,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-conformite-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const runRetention = async (dryRun: boolean) => {
    try {
      setIsRunning(true);
      setError(null);
      setOperationResult(null);
      const { data, error: rpcError } = await (supabase as any).rpc('run_system_retention_policy', {
        p_dry_run: dryRun,
      });
      if (rpcError) throw rpcError;
      setOperationResult(`${dryRun ? 'Simulation' : 'Exécution'} rétention : ${JSON.stringify(data)}`);
      await loadMetrics();
    } catch (err: any) {
      setError(err.message || 'Impossible d’exécuter la politique de rétention.');
    } finally {
      setIsRunning(false);
    }
  };

  const cleanupPushTargets = async () => {
    try {
      setIsRunning(true);
      setError(null);
      setOperationResult(null);
      const { data, error: rpcError } = await (supabase as any).rpc('cleanup_invalid_push_targets', {
        p_stale_days: 90,
      });
      if (rpcError) throw rpcError;
      setOperationResult(`Nettoyage push : ${JSON.stringify(data)}`);
      await loadMetrics();
    } catch (err: any) {
      setError(err.message || 'Impossible de nettoyer les cibles push.');
    } finally {
      setIsRunning(false);
    }
  };

  const rows = [
    ['Rétention des données', `${fmt(metrics?.data_retention_days)} jours`, 'Durée maximale de conservation paramétrée', Archive],
    ['Anonymisation', boolLabel(metrics?.anonymization_enabled), 'Réduction du risque sur données anciennes', ShieldAlert],
    ['Sauvegarde automatique', boolLabel(metrics?.auto_backup_enabled), 'Protection contre perte technique', DatabaseBackup],
    ['Fréquence sauvegarde', `${fmt(metrics?.backup_frequency_hours)} heures`, 'Cadence opérationnelle de backup', Clock],
    ['Dernière sauvegarde connue', dateLabel(metrics?.last_backup_at), 'À alimenter par le job de backup', DatabaseBackup],
    ['Configuration mise à jour', dateLabel(metrics?.configuration_updated_at), 'Dernière modification politique', Clock],
    ['Entrées audit', fmt(metrics?.audit_log_entries), 'Volume journalisation globale', Archive],
    ['Logs au-delà rétention', fmt(metrics?.old_audit_log_entries), 'Candidats purge/anonymisation', ShieldAlert],
  ] as const;

  return (
    <SuperAdminLayout title="Sauvegardes & rétention" activeNav="backup-retention">
      <div className={styles['sa-system-logs']}>
        <div className={styles['sa-system-logs__stats']}>
          <span>Politique de conservation, sauvegarde et export conformité sans contenu métier sensible.</span>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className={styles['sa-system-logs__filter-btn']} onClick={loadMetrics} disabled={isLoading}>
              <RefreshCw size={16} />
              Actualiser
            </button>
            <button className={styles['sa-system-logs__export-btn']} onClick={exportComplianceSnapshot} disabled={!metrics}>
              <Download size={16} />
              Export conformité
            </button>
            <button className={styles['sa-system-logs__filter-btn']} onClick={() => runRetention(true)} disabled={isRunning}>
              Simulation rétention
            </button>
            <button className={styles['sa-system-logs__filter-btn']} onClick={() => runRetention(false)} disabled={isRunning}>
              Exécuter rétention
            </button>
            <button className={styles['sa-system-logs__filter-btn']} onClick={cleanupPushTargets} disabled={isRunning}>
              Nettoyer push obsolète
            </button>
          </div>
        </div>

        {error && (
          <div className={styles['sa-system-logs__error']}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}
        {operationResult && (
          <div className={styles['sa-system-logs__error']} style={{ background: '#ecfdf5', color: '#166534', borderColor: '#bbf7d0' }}>
            <Archive size={20} />
            <span>{operationResult}</span>
          </div>
        )}

        {isLoading ? (
          <div className={styles['sa-system-logs__skeletonWrap']}>
            <AdminCardsGridSkeleton cardCount={8} />
          </div>
        ) : (
          <div className={styles['sa-system-logs__table-wrapper']}>
            <table className={styles['sa-system-logs__table']}>
              <thead>
                <tr>
                  <th>Contrôle</th>
                  <th>État</th>
                  <th>Rôle</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, value, description, Icon]) => (
                  <tr key={label}>
                    <td><Icon size={16} /> {label}</td>
                    <td><strong>{value}</strong></td>
                    <td>{description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminBackupRetentionPage;
