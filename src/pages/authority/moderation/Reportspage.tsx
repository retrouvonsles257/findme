/**
 * =====================================================
 * RETROUVONSLES - Reports Page (Moderation Reports)
 * Rapports de modération et statistiques
 * =====================================================
 */

import React, { useState } from 'react';
import { useI18n } from '../../../hooks';
import { useSignalements } from '../../../features/signalements/hooks/useSignalements';
import { ModerationLayout } from './ModerationLayout';
import { BarChart3, Clock, CheckCircle, XCircle, Archive, TrendingUp } from 'lucide-react';
import { AdminDetailSkeleton } from 'components/skeletons';
import styles from './ReportsPage.module.css';

export interface ReportsPageProps {
  /** Contenu seul (embarqué sous `AuthorityLayout`). */
  noLayout?: boolean;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ noLayout = false }) => {
  const { t } = useI18n();
  const { signalements, isLoading } = useSignalements();
  const [reportPeriod, setReportPeriod] = useState<'7days' | '30days' | 'all'>('7days');

  // Filtrer par période
  const getFilteredSignalements = () => {
    const now = new Date();
    const cutoffDate = new Date();

    if (reportPeriod === '7days') {
      cutoffDate.setDate(now.getDate() - 7);
    } else if (reportPeriod === '30days') {
      cutoffDate.setDate(now.getDate() - 30);
    }

    return signalements.filter((sig) => {
      if (reportPeriod === 'all') return true;
      return new Date(sig.created_at) >= cutoffDate;
    });
  };

  const filteredSignalements = getFilteredSignalements();

  // Calculer les statistiques
  const calculateStats = () => {
    // Source de vérité: statut_validation (schéma SQL). Fallback: etat (legacy UI)
    const getStatut = (s: any) => s.statut_validation || s.etat;

    const nouveau = filteredSignalements.filter((s: any) => {
      const st = getStatut(s);
      return st === 'en_attente' || st === 'nouveau';
    }).length;

    const en_cours = filteredSignalements.filter((s: any) => {
      const st = getStatut(s);
      return st === 'en_verification' || st === 'en_cours';
    }).length;

    const valide = filteredSignalements.filter((s: any) => getStatut(s) === 'valide').length;

    const rejete = filteredSignalements.filter((s: any) => {
      const st = getStatut(s);
      return st === 'invalide' || st === 'rejete';
    }).length;

    const ferme = filteredSignalements.filter((s: any) => {
      const st = getStatut(s);
      return st === 'spam' || st === 'doublonne' || st === 'ferme';
    }).length;

    const totalScore =
      filteredSignalements.reduce((sum, s: any) => {
        // score_pertinence (SQL) est typiquement 0..100. score_correspondance (legacy) est 0..1
        if (typeof s.score_pertinence === 'number') return sum + s.score_pertinence;
        if (typeof s.score_correspondance === 'number') return sum + s.score_correspondance * 100;
        return sum;
      }, 0) /
      (filteredSignalements.length || 1);

    return {
      nouveau,
      en_cours,
      valide,
      rejete,
      ferme,
      total: filteredSignalements.length,
      avgScore: Math.round(totalScore),
    };
  };

  const reportStats = calculateStats();

  // Grouper par lieu
  const locationStats = filteredSignalements.reduce(
    (acc, sig) => {
      const key: string = sig.lieu_observation || sig.ville_observation || t('moderation.unspecified');
      if (!acc[key]) {
        acc[key] = 0;
      }
      acc[key]++;
      return acc;
    },
    {} as Record<string, number>
  );

  const topLocations = Object.entries(locationStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Grouper par date
  const dateStats = filteredSignalements.reduce(
    (acc, sig) => {
      const date = new Date(sig.date_observation).toLocaleDateString('fr-FR');
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date]++;
      return acc;
    },
    {} as Record<string, number>
  );

  const summaryCards = [
    { icon: BarChart3, value: reportStats.total, labelKey: 'moderation.totalReports' as const },
    { icon: Clock, value: reportStats.nouveau, labelKey: 'moderation.new' as const },
    { icon: CheckCircle, value: reportStats.valide, labelKey: 'moderation.validated' as const },
    { icon: XCircle, value: reportStats.rejete, labelKey: 'moderation.rejectedLabel' as const },
    { icon: TrendingUp, value: `${reportStats.avgScore}%`, labelKey: 'moderation.averageScoreLabel' as const },
    { icon: Archive, value: reportStats.en_cours, labelKey: 'moderation.inProgress' as const },
  ];

  const content = (
      <div className={styles.reports}>
        {/* Header */}
        <div className={styles['reports__header']}>
          <h1 className={styles['reports__header-title']}>{t('moderation.reportsPageTitle')}</h1>
          <p className={styles['reports__header-subtitle']}>
            {t('moderation.reportsPageSubtitle')}
          </p>
        </div>

        {isLoading ? (
          <div className={styles['reports__skeletonWrap']}>
            <AdminDetailSkeleton blockCount={3} linesPerBlock={4} />
          </div>
        ) : (
          <>
            {/* Period Filter */}
            <div className={styles['reports__filter-section']}>
              <div className={styles['reports__filter-group']}>
                <label className={styles['reports__filter-label']}>{t('moderation.period')}</label>
                <select
                  value={reportPeriod}
                  onChange={(e) => setReportPeriod(e.target.value as any)}
                  className={styles['reports__filter-select']}
                >
                  <option value="7days">{t('moderation.last7Days')}</option>
                  <option value="30days">{t('moderation.lastMonth')}</option>
                  <option value="all">{t('moderation.allTimeReports')}</option>
                </select>
              </div>
            </div>

            {/* Summary Stats */}
            <div className={styles['reports__summary-grid']}>
              {summaryCards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <div key={index} className={styles['reports__summary-card']}>
                    <div className={styles['reports__card-icon']}>
                      <Icon size={40} color="#8b5cf6" />
                    </div>
                    <div className={styles['reports__card-content']}>
                      <div className={styles['reports__card-value']}>{card.value}</div>
                      <div className={styles['reports__card-label']}>{t(card.labelKey)}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Status Distribution */}
            <div className={styles['reports__section']}>
              <h2 className={styles['reports__section-title']}>{t('moderation.statusDistribution')}</h2>
              <div className={styles['reports__status-table']}>
                <div className={styles['reports__status-row']}>
                  <span className={styles['reports__status-label']}>{t('moderation.new')}</span>
                  <div className={styles['reports__status-bar']}>
                    <div
                      className={styles['reports__status-fill']}
                      style={{
                        width: `${(reportStats.nouveau / reportStats.total) * 100 || 0}%`,
                        backgroundColor: '#ffc107',
                      }}
                    />
                  </div>
                  <span className={styles['reports__status-count']}>
                    {reportStats.nouveau} ({Math.round((reportStats.nouveau / reportStats.total) * 100 || 0)}%)
                  </span>
                </div>

                <div className={styles['reports__status-row']}>
                  <span className={styles['reports__status-label']}>{t('moderation.inProgress')}</span>
                  <div className={styles['reports__status-bar']}>
                    <div
                      className={styles['reports__status-fill']}
                      style={{
                        width: `${(reportStats.en_cours / reportStats.total) * 100 || 0}%`,
                        backgroundColor: '#38bdf8',
                      }}
                    />
                  </div>
                  <span className={styles['reports__status-count']}>
                    {reportStats.en_cours} ({Math.round((reportStats.en_cours / reportStats.total) * 100 || 0)}%)
                  </span>
                </div>

                <div className={styles['reports__status-row']}>
                  <span className={styles['reports__status-label']}>{t('moderation.validated')}</span>
                  <div className={styles['reports__status-bar']}>
                    <div
                      className={styles['reports__status-fill']}
                      style={{
                        width: `${(reportStats.valide / reportStats.total) * 100 || 0}%`,
                        backgroundColor: '#0ea5e9',
                      }}
                    />
                  </div>
                  <span className={styles['reports__status-count']}>
                    {reportStats.valide} ({Math.round((reportStats.valide / reportStats.total) * 100 || 0)}%)
                  </span>
                </div>

                <div className={styles['reports__status-row']}>
                  <span className={styles['reports__status-label']}>{t('moderation.rejectedLabel')}</span>
                  <div className={styles['reports__status-bar']}>
                    <div
                      className={styles['reports__status-fill']}
                      style={{
                        width: `${(reportStats.rejete / reportStats.total) * 100 || 0}%`,
                        backgroundColor: '#dc3545',
                      }}
                    />
                  </div>
                  <span className={styles['reports__status-count']}>
                    {reportStats.rejete} ({Math.round((reportStats.rejete / reportStats.total) * 100 || 0)}%)
                  </span>
                </div>

                <div className={styles['reports__status-row']}>
                  <span className={styles['reports__status-label']}>{t('moderation.closed')}</span>
                  <div className={styles['reports__status-bar']}>
                    <div
                      className={styles['reports__status-fill']}
                      style={{
                        width: `${(reportStats.ferme / reportStats.total) * 100 || 0}%`,
                        backgroundColor: '#64748b',
                      }}
                    />
                  </div>
                  <span className={styles['reports__status-count']}>
                    {reportStats.ferme} ({Math.round((reportStats.ferme / reportStats.total) * 100 || 0)}%)
                  </span>
                </div>
              </div>
            </div>

            <div className={styles['reports__section']}>
              <h2 className={styles['reports__section-title']}>{t('moderation.top10Locations')}</h2>
              <div className={styles['reports__location-list']}>
                {topLocations.map(([location, count], index) => (
                  <div key={location} className={styles['reports__location-item']}>
                    <span className={styles['reports__rank']}>#{index + 1}</span>
                    <span className={styles['reports__location']}>{location}</span>
                    <span className={styles['reports__count']}>{t('moderation.reportsCount').replace('{{count}}', String(count))}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles['reports__section']}>
              <h2 className={styles['reports__section-title']}>{t('moderation.activityByDate')}</h2>
              <div className={styles['reports__activity-list']}>
                {Object.entries(dateStats)
                  .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
                  .slice(0, 10)
                  .map(([date, count]) => (
                    <div key={date} className={styles['reports__activity-item']}>
                      <span className={styles['reports__date']}>{date}</span>
                      <div className={styles['reports__activity-bar']}>
                        <div
                          className={styles['reports__activity-fill']}
                          style={{ width: `${Math.min(count * 10, 100)}%` }}
                        />
                      </div>
                      <span className={styles['reports__activity-count']}>{t('moderation.reportsCount').replace('{{count}}', String(count))}</span>
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}
      </div>
  );

  if (noLayout) return content;

  return (
    <ModerationLayout title={t('moderation.reportsPageTitle')} activeNav="reports">
      {content}
    </ModerationLayout>
  );
};

export default ReportsPage;