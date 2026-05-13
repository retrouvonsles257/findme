import React, { useCallback, useEffect, useState } from 'react';
import { Activity, AlertCircle, Bell, Database, RefreshCw, Server, Smartphone, Wifi } from 'lucide-react';
import { envConfig, supabase } from '../../config';
import { SuperAdminLayout } from './SuperAdminLayout';
import { AdminCardsGridSkeleton } from 'components/skeletons';
import styles from './SystemLogsPage.module.css';

interface ObservabilityMetrics {
  generated_at?: string;
  organisations_total?: number;
  users_total?: number;
  roles_total?: number;
  activity_last_24h?: number;
  config_entries_total?: number;
  fcm_tokens_total?: number;
  fcm_tokens_stale_30d?: number;
  web_push_subscriptions_total?: number;
  web_push_stale_30d?: number;
  notifications_last_24h?: number;
  notification_failures_last_24h?: number;
  push_delivery_success_24h?: number;
  push_delivery_failures_24h?: number;
  invalid_push_targets_30d?: number;
}

const numberValue = (value?: number) => (value ?? 0).toLocaleString('fr-FR');

export const SuperAdminObservabilityPage: React.FC = () => {
  const [metrics, setMetrics] = useState<ObservabilityMetrics | null>(null);
  const [edgeHealth, setEdgeHealth] = useState<'inconnu' | 'ok' | 'erreur'>('inconnu');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data, error: rpcError } = await (supabase as any).rpc('get_platform_observability_metrics');
      if (rpcError) throw rpcError;
      setMetrics(data || {});
      try {
        const baseUrl = envConfig.REACT_APP_SUPABASE_URL?.replace(/\/$/, '');
        const response = await fetch(`${baseUrl}/functions/v1/notification-fcm-send`, { method: 'GET' });
        setEdgeHealth(response.ok ? 'ok' : 'erreur');
      } catch {
        setEdgeHealth('erreur');
      }
    } catch (err: any) {
      setError(err.message || 'Impossible de charger les métriques d’observabilité.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const cards = [
    { label: 'Organisations', value: numberValue(metrics?.organisations_total), icon: Server },
    { label: 'Utilisateurs', value: numberValue(metrics?.users_total), icon: Activity },
    { label: 'Configurations', value: numberValue(metrics?.config_entries_total), icon: Database },
    { label: 'Activités 24h', value: numberValue(metrics?.activity_last_24h), icon: Activity },
    { label: 'Tokens FCM', value: numberValue(metrics?.fcm_tokens_total), icon: Smartphone },
    { label: 'Web Push natif', value: numberValue(metrics?.web_push_subscriptions_total), icon: Wifi },
    { label: 'Tokens expirés 30j', value: numberValue((metrics?.fcm_tokens_stale_30d || 0) + (metrics?.web_push_stale_30d || 0)), icon: AlertCircle },
    { label: 'Notifications 24h', value: numberValue(metrics?.notifications_last_24h), icon: Bell },
    { label: 'Push réussis 24h', value: numberValue(metrics?.push_delivery_success_24h), icon: Wifi },
    { label: 'Push échoués 24h', value: numberValue(metrics?.push_delivery_failures_24h), icon: AlertCircle },
    { label: 'Cibles invalides 30j', value: numberValue(metrics?.invalid_push_targets_30d), icon: AlertCircle },
  ];

  return (
    <SuperAdminLayout title="Observabilité technique" activeNav="observability">
      <div className={styles['sa-system-logs']}>
        <div className={styles['sa-system-logs__stats']}>
          <span>Surveillance agrégée de la plateforme, sans listes métier détaillées.</span>
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
            <AdminCardsGridSkeleton cardCount={8} />
          </div>
        ) : (
          <>
            <div className={styles['sa-system-logs__table-wrapper']}>
              <table className={styles['sa-system-logs__table']}>
                <thead>
                  <tr>
                    <th>Métrique</th>
                    <th>Valeur</th>
                    <th>Lecture système</th>
                  </tr>
                </thead>
                <tbody>
                  {cards.map((card) => {
                    const Icon = card.icon;
                    return (
                      <tr key={card.label}>
                        <td><Icon size={16} /> {card.label}</td>
                        <td><strong>{card.value}</strong></td>
                        <td>Monitoring plateforme</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className={styles['sa-system-logs__table-wrapper']}>
              <h3 style={{ marginTop: 0 }}>Services critiques à surveiller</h3>
              <table className={styles['sa-system-logs__table']}>
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Statut</th>
                    <th>Indicateur attendu</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Supabase Database</td><td><span className={`${styles['sa-system-logs__badge']} ${styles['sa-system-logs__badge--success']}`}>Surveillé</span></td><td>Requêtes de métriques disponibles</td></tr>
                  <tr><td>Realtime</td><td><span className={`${styles['sa-system-logs__badge']} ${styles['sa-system-logs__badge--success']}`}>Actif</span></td><td>La config système se met à jour via Realtime côté client</td></tr>
                  <tr><td>Edge Function notification-fcm-send</td><td><span className={`${styles['sa-system-logs__badge']} ${styles[`sa-system-logs__badge--${edgeHealth === 'ok' ? 'success' : edgeHealth === 'erreur' ? 'danger' : 'default'}`]}`}>{edgeHealth}</span></td><td>Ping HTTP GET sans secret pour healthcheck</td></tr>
                  <tr><td>Storage</td><td><span className={`${styles['sa-system-logs__badge']} ${styles['sa-system-logs__badge--info']}`}>À surveiller infra</span></td><td>Quotas et erreurs bucket à brancher côté Supabase/CI</td></tr>
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminObservabilityPage;
