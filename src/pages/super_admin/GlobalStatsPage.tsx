/**
 * =====================================================
 * RETROUVONSLES - Super Admin Global Statistics Page
 * Statistiques globales du système
 * Connecté à Supabase
 * =====================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../../hooks';
import { supabase } from '../../config';
import { SuperAdminLayout } from './SuperAdminLayout';
import { 
  BarChart3, 
  Users, 
  CheckCircle2, 
  TrendingUp, 
  Clock,
  MapPin,
  Bell,
  Building2,
  Loader2,
  AlertCircle
} from 'lucide-react';
import styles from './GlobalStatsPage.module.css';

interface GlobalStats {
  totalDossiers: number;
  dossiersRetrouves: number;
  dossiersEnCours: number;
  totalSignalements: number;
  totalOrganisations: number;
  totalUtilisateurs: number;
  successRate: number;
}

interface RegionalData {
  region: string;
  total: number;
  found: number;
  percentage: number;
}

interface MonthlyData {
  month: string;
  dossiers: number;
  signalements: number;
}

export const SuperAdminGlobalStatsPage: React.FC = () => {
  const { t } = useI18n();

  const [stats, setStats] = useState<GlobalStats>({
    totalDossiers: 0,
    dossiersRetrouves: 0,
    dossiersEnCours: 0,
    totalSignalements: 0,
    totalOrganisations: 0,
    totalUtilisateurs: 0,
    successRate: 0,
  });
  const [regionalData, setRegionalData] = useState<RegionalData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Charger les comptages en parallèle
      const [
        dossiersResult,
        dossiersRetouvesResult,
        dossiersEnCoursResult,
        signalementsResult,
        organisationsResult,
        utilisateursResult,
        dossiersWithRegionResult,
      ] = await Promise.all([
        (supabase as any).from('dossier_disparition').select('id', { count: 'exact', head: true }),
        (supabase as any).from('dossier_disparition').select('id', { count: 'exact', head: true }).eq('statut', 'retrouve'),
        (supabase as any).from('dossier_disparition').select('id', { count: 'exact', head: true }).eq('statut', 'en_cours'),
        (supabase as any).from('signalement').select('id', { count: 'exact', head: true }),
        (supabase as any).from('organisation').select('id', { count: 'exact', head: true }),
        (supabase as any).from('utilisateur').select('id', { count: 'exact', head: true }),
        (supabase as any).from('dossier_disparition').select('region, statut'),
      ]);

      const totalDossiers = dossiersResult.count || 0;
      const dossiersRetrouves = dossiersRetouvesResult.count || 0;
      const dossiersEnCours = dossiersEnCoursResult.count || 0;
      const successRate = totalDossiers > 0 ? Math.round((dossiersRetrouves / totalDossiers) * 100) : 0;

      setStats({
        totalDossiers,
        dossiersRetrouves,
        dossiersEnCours,
        totalSignalements: signalementsResult.count || 0,
        totalOrganisations: organisationsResult.count || 0,
        totalUtilisateurs: utilisateursResult.count || 0,
        successRate,
      });

      // Analyser les données régionales
      const dossiers = dossiersWithRegionResult.data || [];
      const regionMap = new Map<string, { total: number; found: number }>();
      
      dossiers.forEach((d: any) => {
        const region = d.region || 'Non spécifié';
        if (!regionMap.has(region)) {
          regionMap.set(region, { total: 0, found: 0 });
        }
        const data = regionMap.get(region)!;
        data.total++;
        if (d.statut === 'retrouve') {
          data.found++;
        }
      });

      const regionalArray: RegionalData[] = Array.from(regionMap.entries())
        .map(([region, data]) => ({
          region,
          total: data.total,
          found: data.found,
          percentage: data.total > 0 ? Math.round((data.found / data.total) * 100) : 0,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

      setRegionalData(regionalArray);

      // Données mensuelles (6 derniers mois)
      const now = new Date();
      const months: MonthlyData[] = [];
      
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const monthName = monthDate.toLocaleString('fr-FR', { month: 'short', year: '2-digit' });
        
        const startStr = monthDate.toISOString();
        const endStr = monthEnd.toISOString();
        
        const [dossiersMonth, signalementsMonth] = await Promise.all([
          (supabase as any).from('dossier_disparition')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', startStr)
            .lte('created_at', endStr),
          (supabase as any).from('signalement')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', startStr)
            .lte('created_at', endStr),
        ]);
        
        months.push({
          month: monthName,
          dossiers: dossiersMonth.count || 0,
          signalements: signalementsMonth.count || 0,
        });
      }
      
      setMonthlyData(months);

    } catch (err: any) {
      console.error('Erreur chargement stats:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const statCards = [
    {
      label: 'Total dossiers',
      value: stats.totalDossiers.toString(),
      icon: Users,
      color: 'primary',
    },
    {
      label: 'Retrouvés',
      value: stats.dossiersRetrouves.toString(),
      icon: CheckCircle2,
      color: 'success',
    },
    {
      label: 'En cours',
      value: stats.dossiersEnCours.toString(),
      icon: Clock,
      color: 'warning',
    },
    {
      label: 'Taux de succès',
      value: `${stats.successRate}%`,
      icon: TrendingUp,
      color: 'info',
    },
    {
      label: 'Signalements',
      value: stats.totalSignalements.toString(),
      icon: Bell,
      color: 'secondary',
    },
    {
      label: 'Organisations',
      value: stats.totalOrganisations.toString(),
      icon: Building2,
      color: 'tertiary',
    },
  ];

  const maxMonthlyValue = Math.max(...monthlyData.map(m => Math.max(m.dossiers, m.signalements)), 1);

  return (
    <SuperAdminLayout
      title={t('super_admin.globalStatistics') || 'Statistiques globales'}
      activeNav="global-stats"
    >
      <div className={styles['sa-global-stats']}>
        {/* Error */}
        {error && (
          <div className={styles['sa-global-stats__error']}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className={styles['sa-global-stats__loading']}>
            <Loader2 size={32} className={styles['sa-global-stats__spinner']} />
          </div>
        ) : (
          <>
            {/* Main Stats */}
            <div className={styles['sa-global-stats__stats-grid']}>
              {statCards.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className={`${styles['sa-global-stats__stat-card']} ${styles[`sa-global-stats__stat-card--${stat.color}`]}`}>
                    <div className={styles['sa-global-stats__stat-icon']}>
                      <Icon size={24} />
                    </div>
                    <div className={styles['sa-global-stats__stat-content']}>
                      <h3 className={styles['sa-global-stats__stat-value']}>
                        {stat.value}
                      </h3>
                      <p className={styles['sa-global-stats__stat-label']}>
                        {stat.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Monthly Chart */}
            <section className={styles['sa-global-stats__section']}>
              <h2 className={styles['sa-global-stats__section-title']}>
                <BarChart3 size={20} />
                Évolution mensuelle
              </h2>
              <div className={styles['sa-global-stats__chart']}>
                <div className={styles['sa-global-stats__chart-legend']}>
                  <span><span className={styles['sa-global-stats__legend-dossiers']}></span> Dossiers</span>
                  <span><span className={styles['sa-global-stats__legend-signalements']}></span> Signalements</span>
                </div>
                <div className={styles['sa-global-stats__chart-bars']}>
                  {monthlyData.map((month) => (
                    <div key={month.month} className={styles['sa-global-stats__chart-month']}>
                      <div className={styles['sa-global-stats__chart-bar-group']}>
                        <div 
                          className={`${styles['sa-global-stats__chart-bar']} ${styles['sa-global-stats__chart-bar--dossiers']}`}
                          style={{ height: `${(month.dossiers / maxMonthlyValue) * 100}%` }}
                        >
                          <span className={styles['sa-global-stats__chart-value']}>{month.dossiers}</span>
                        </div>
                        <div 
                          className={`${styles['sa-global-stats__chart-bar']} ${styles['sa-global-stats__chart-bar--signalements']}`}
                          style={{ height: `${(month.signalements / maxMonthlyValue) * 100}%` }}
                        >
                          <span className={styles['sa-global-stats__chart-value']}>{month.signalements}</span>
                        </div>
                      </div>
                      <span className={styles['sa-global-stats__chart-label']}>{month.month}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Regional Analysis */}
            <section className={styles['sa-global-stats__section']}>
              <h2 className={styles['sa-global-stats__section-title']}>
                <MapPin size={20} />
                Analyse par région
              </h2>
              <div className={styles['sa-global-stats__table-wrapper']}>
                {regionalData.length === 0 ? (
                  <p className={styles['sa-global-stats__empty']}>Aucune donnée régionale disponible</p>
                ) : (
                  <table className={styles['sa-global-stats__table']}>
                    <thead>
                      <tr>
                        <th>Région</th>
                        <th>Total</th>
                        <th>Retrouvés</th>
                        <th>Taux</th>
                      </tr>
                    </thead>
                    <tbody>
                      {regionalData.map((region) => (
                        <tr key={region.region}>
                          <td>{region.region}</td>
                          <td>{region.total}</td>
                          <td>{region.found}</td>
                          <td>
                            <span className={`${styles['sa-global-stats__percentage']} ${
                              region.percentage >= 50 ? styles['sa-global-stats__percentage--success'] : 
                              region.percentage >= 25 ? styles['sa-global-stats__percentage--warning'] : 
                              styles['sa-global-stats__percentage--danger']
                            }`}>
                              {region.percentage}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminGlobalStatsPage;
