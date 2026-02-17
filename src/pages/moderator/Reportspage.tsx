/**
 * =====================================================
 * RETROUVONSLES - Reports Page (Moderation Reports)
 * Rapports de modération et statistiques
 * =====================================================
 */

import React, { useState } from 'react';
import { useI18n } from '../../hooks';
import { useSignalements } from '../../features/signalements/hooks/useSignalements';
import { ModerationLayout } from './ModerationLayout';
import { BarChart3, Clock, CheckCircle, XCircle, Archive, TrendingUp } from 'lucide-react';
import { AdminDetailSkeleton } from '../admin/skeletons';
import styles from './ReportsPage.module.css';

export const ReportsPage: React.FC = () => {
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
      const key: string = sig.lieu_observation || sig.ville_observation || t('moderator.unspecified');
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
    { icon: BarChart3, value: reportStats.total, labelKey: 'moderator.totalReports' as const },
    { icon: Clock, value: reportStats.nouveau, labelKey: 'moderator.new' as const },
    { icon: CheckCircle, value: reportStats.valide, labelKey: 'moderator.validated' as const },
    { icon: XCircle, value: reportStats.rejete, labelKey: 'moderator.rejectedLabel' as const },
    { icon: TrendingUp, value: `${reportStats.avgScore}%`, labelKey: 'moderator.averageScoreLabel' as const },
    { icon: Archive, value: reportStats.en_cours, labelKey: 'moderator.inProgress' as const },
  ];

  return (
    <ModerationLayout title={t('moderator.reportsPageTitle')} activeNav="reports">
      <div className={styles.reports}>
        {/* Header */}
        <div className={styles['reports__header']}>
          <h1 className={styles['reports__header-title']}>{t('moderator.reportsPageTitle')}</h1>
          <p className={styles['reports__header-subtitle']}>
            {t('moderator.reportsPageSubtitle')}
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
                <label className={styles['reports__filter-label']}>{t('moderator.period')}</label>
                <select
                  value={reportPeriod}
                  onChange={(e) => setReportPeriod(e.target.value as any)}
                  className={styles['reports__filter-select']}
                >
                  <option value="7days">{t('moderator.last7Days')}</option>
                  <option value="30days">{t('moderator.lastMonth')}</option>
                  <option value="all">{t('moderator.allTimeReports')}</option>
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
              <h2 className={styles['reports__section-title']}>{t('moderator.statusDistribution')}</h2>
              <div className={styles['reports__status-table']}>
                <div className={styles['reports__status-row']}>
                  <span className={styles['reports__status-label']}>{t('moderator.new')}</span>
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
                  <span className={styles['reports__status-label']}>{t('moderator.inProgress')}</span>
                  <div className={styles['reports__status-bar']}>
                    <div
                      className={styles['reports__status-fill']}
                      style={{
                        width: `${(reportStats.en_cours / reportStats.total) * 100 || 0}%`,
                        backgroundColor: '#17a2b8',
                      }}
                    />
                  </div>
                  <span className={styles['reports__status-count']}>
                    {reportStats.en_cours} ({Math.round((reportStats.en_cours / reportStats.total) * 100 || 0)}%)
                  </span>
                </div>

                <div className={styles['reports__status-row']}>
                  <span className={styles['reports__status-label']}>{t('moderator.validated')}</span>
                  <div className={styles['reports__status-bar']}>
                    <div
                      className={styles['reports__status-fill']}
                      style={{
                        width: `${(reportStats.valide / reportStats.total) * 100 || 0}%`,
                        backgroundColor: '#28a745',
                      }}
                    />
                  </div>
                  <span className={styles['reports__status-count']}>
                    {reportStats.valide} ({Math.round((reportStats.valide / reportStats.total) * 100 || 0)}%)
                  </span>
                </div>

                <div className={styles['reports__status-row']}>
                  <span className={styles['reports__status-label']}>{t('moderator.rejectedLabel')}</span>
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
                  <span className={styles['reports__status-label']}>{t('moderator.closed')}</span>
                  <div className={styles['reports__status-bar']}>
                    <div
                      className={styles['reports__status-fill']}
                      style={{
                        width: `${(reportStats.ferme / reportStats.total) * 100 || 0}%`,
                        backgroundColor: '#6c757d',
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
              <h2 className={styles['reports__section-title']}>{t('moderator.top10Locations')}</h2>
              <div className={styles['reports__location-list']}>
                {topLocations.map(([location, count], index) => (
                  <div key={location} className={styles['reports__location-item']}>
                    <span className={styles['reports__rank']}>#{index + 1}</span>
                    <span className={styles['reports__location']}>{location}</span>
                    <span className={styles['reports__count']}>{t('moderator.reportsCount').replace('{{count}}', String(count))}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles['reports__section']}>
              <h2 className={styles['reports__section-title']}>{t('moderator.activityByDate')}</h2>
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
                      <span className={styles['reports__activity-count']}>{t('moderator.reportsCount').replace('{{count}}', String(count))}</span>
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}
      </div>
    </ModerationLayout>
  );
};

export default ReportsPage;