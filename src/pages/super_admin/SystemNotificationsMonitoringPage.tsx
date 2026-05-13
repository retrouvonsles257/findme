import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, BellRing, Mail, MessageSquareWarning, RefreshCw, Smartphone } from 'lucide-react';
import { supabase } from '../../config';
import { SuperAdminLayout } from './SuperAdminLayout';
import { AdminCardsGridSkeleton } from 'components/skeletons';
import styles from './SystemLogsPage.module.css';

interface NotificationMetrics {
  generated_at?: string;
  total?: number;
  last_24h?: number;
  unread_total?: number;
  failed_total?: number;
  push_success_last_24h?: number;
  push_failures_last_24h?: number;
  invalid_targets_last_30d?: number;
  by_channel?: Record<string, number>;
  by_priority?: Record<string, number>;
  push_by_browser_30d?: Record<string, number>;
  push_failures_by_channel_30d?: Record<string, number>;
}

const fmt = (value?: number) => (value ?? 0).toLocaleString('fr-FR');

export const SuperAdminSystemNotificationsMonitoringPage: React.FC = () => {
  const [metrics, setMetrics] = useState<NotificationMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data, error: rpcError } = await (supabase as any).rpc('get_system_notification_metrics');
      if (rpcError) throw rpcError;
      setMetrics(data || {});
    } catch (err: any) {
      setError(err.message || 'Impossible de charger le monitoring notifications.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const channelRows = useMemo(() => Object.entries(metrics?.by_channel || {}), [metrics?.by_channel]);
  const priorityRows = useMemo(() => Object.entries(metrics?.by_priority || {}), [metrics?.by_priority]);
  const browserRows = useMemo(() => Object.entries(metrics?.push_by_browser_30d || {}), [metrics?.push_by_browser_30d]);
  const pushFailureRows = useMemo(() => Object.entries(metrics?.push_failures_by_channel_30d || {}), [metrics?.push_failures_by_channel_30d]);

  return (
    <SuperAdminLayout title="Notifications système" activeNav="system-notifications">
      <div className={styles['sa-system-logs']}>
        <div className={styles['sa-system-logs__stats']}>
          <span>Monitoring agrégé des notifications, sans lecture du contenu métier envoyé aux utilisateurs.</span>
          <button className={styles['sa-system-logs__filter-btn']} onClick={loadMetrics} disabled={isLoading}>
            <RefreshCw size={16} />
            Actualiser
          </button>
        </div>

        {error && (
          <div className={styles['sa-system-logs__error']}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className={styles['sa-system-logs__skeletonWrap']}>
            <AdminCardsGridSkeleton cardCount={6} />
          </div>
        ) : (
          <>
            <div className={styles['sa-system-logs__table-wrapper']}>
              <table className={styles['sa-system-logs__table']}>
                <thead>
                  <tr>
                    <th>Indicateur</th>
                    <th>Valeur</th>
                    <th>Interprétation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td><BellRing size={16} /> Total notifications</td><td><strong>{fmt(metrics?.total)}</strong></td><td>Volume global historique</td></tr>
                  <tr><td><Smartphone size={16} /> Notifications 24h</td><td><strong>{fmt(metrics?.last_24h)}</strong></td><td>Activité récente</td></tr>
                  <tr><td><Mail size={16} /> Non lues</td><td><strong>{fmt(metrics?.unread_total)}</strong></td><td>Charge utilisateur restante</td></tr>
                  <tr><td><MessageSquareWarning size={16} /> Échecs</td><td><strong>{fmt(metrics?.failed_total)}</strong></td><td>À corréler avec tokens invalides et navigateurs</td></tr>
                  <tr><td><Smartphone size={16} /> Push réussis 24h</td><td><strong>{fmt(metrics?.push_success_last_24h)}</strong></td><td>Envois FCM/Web Push confirmés</td></tr>
                  <tr><td><MessageSquareWarning size={16} /> Push échoués 24h</td><td><strong>{fmt(metrics?.push_failures_last_24h)}</strong></td><td>Échecs enregistrés par l’Edge Function</td></tr>
                  <tr><td><AlertCircle size={16} /> Cibles invalides 30j</td><td><strong>{fmt(metrics?.invalid_targets_last_30d)}</strong></td><td>Tokens/subscriptions supprimés ou à nettoyer</td></tr>
                </tbody>
              </table>
            </div>

            <div className={styles['sa-system-logs__table-wrapper']}>
              <h3 style={{ marginTop: 0 }}>Répartition par canal</h3>
              <table className={styles['sa-system-logs__table']}>
                <thead>
                  <tr>
                    <th>Canal</th>
                    <th>Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {channelRows.length === 0 ? (
                    <tr><td colSpan={2}>Aucune donnée.</td></tr>
                  ) : channelRows.map(([channel, total]) => (
                    <tr key={channel}><td>{channel}</td><td><strong>{fmt(total)}</strong></td></tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles['sa-system-logs__table-wrapper']}>
              <h3 style={{ marginTop: 0 }}>Répartition par priorité</h3>
              <table className={styles['sa-system-logs__table']}>
                <thead>
                  <tr>
                    <th>Priorité</th>
                    <th>Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {priorityRows.length === 0 ? (
                    <tr><td colSpan={2}>Aucune donnée.</td></tr>
                  ) : priorityRows.map(([priority, total]) => (
                    <tr key={priority}><td>{priority}</td><td><strong>{fmt(total)}</strong></td></tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles['sa-system-logs__table-wrapper']}>
              <h3 style={{ marginTop: 0 }}>Navigateurs push sur 30 jours</h3>
              <table className={styles['sa-system-logs__table']}>
                <thead>
                  <tr>
                    <th>Navigateur</th>
                    <th>Événements</th>
                  </tr>
                </thead>
                <tbody>
                  {browserRows.length === 0 ? (
                    <tr><td colSpan={2}>Aucun événement push enregistré.</td></tr>
                  ) : browserRows.map(([browser, total]) => (
                    <tr key={browser}><td>{browser}</td><td><strong>{fmt(total)}</strong></td></tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles['sa-system-logs__table-wrapper']}>
              <h3 style={{ marginTop: 0 }}>Échecs push par canal sur 30 jours</h3>
              <table className={styles['sa-system-logs__table']}>
                <thead>
                  <tr>
                    <th>Canal</th>
                    <th>Échecs</th>
                  </tr>
                </thead>
                <tbody>
                  {pushFailureRows.length === 0 ? (
                    <tr><td colSpan={2}>Aucun échec push enregistré.</td></tr>
                  ) : pushFailureRows.map(([channel, total]) => (
                    <tr key={channel}><td>{channel}</td><td><strong>{fmt(total)}</strong></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminSystemNotificationsMonitoringPage;
