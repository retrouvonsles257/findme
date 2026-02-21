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
import { StatistiquesSkeleton } from '../admin/skeletons';
import { 
  BarChart3, 
  Users, 
  CheckCircle2, 
  TrendingUp, 
  Clock,
  MapPin,
  Bell,
  Building2,
  AlertCircle,
  User,
  FileText,
  Activity
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

interface AgeGroupData {
  group: string;
  total: number;
  found: number;
  percentage: number;
}

interface SexeData {
  sexe: string;
  total: number;
  found: number;
  percentage: number;
}

interface TypeDisparitionData {
  type: string;
  total: number;
  found: number;
  percentage: number;
}

interface DailyTrendData {
  date: string;
  dossiers: number;
  signalements: number;
  found: number;
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
  const [ageGroupData, setAgeGroupData] = useState<AgeGroupData[]>([]);
  const [sexeData, setSexeData] = useState<SexeData[]>([]);
  const [typeDisparitionData, setTypeDisparitionData] = useState<TypeDisparitionData[]>([]);
  const [dailyTrendData, setDailyTrendData] = useState<DailyTrendData[]>([]);
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

      // Données mensuelles (6 derniers mois) + 30 jours + âge/sexe/type en un seul batch parallèle
      const now = new Date();
      const monthStarts: string[] = [];
      const monthEnds: string[] = [];
      const monthNames: string[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthStarts.push(monthDate.toISOString());
        monthEnds.push(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).toISOString());
        monthNames.push(monthDate.toLocaleString('fr-FR', { month: 'short', year: '2-digit' }));
      }

      const dayDateStrs: string[] = [];
      const dayNextDateStrs: string[] = [];
      const dayLabels: string[] = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dayDateStrs.push(date.toISOString().split('T')[0]);
        dayNextDateStrs.push(new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
        dayLabels.push(date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }));
      }

      const monthPromises: Promise<any>[] = [];
      for (let i = 0; i < 6; i++) {
        monthPromises.push(
          (supabase as any).from('dossier_disparition').select('id', { count: 'exact', head: true }).gte('created_at', monthStarts[i]).lte('created_at', monthEnds[i]),
          (supabase as any).from('signalement').select('id', { count: 'exact', head: true }).gte('created_at', monthStarts[i]).lte('created_at', monthEnds[i])
        );
      }

      const dayPromises: Promise<any>[] = [];
      for (let i = 0; i < 30; i++) {
        dayPromises.push(
          (supabase as any).from('dossier_disparition').select('id', { count: 'exact', head: true }).gte('created_at', dayDateStrs[i]).lt('created_at', dayNextDateStrs[i]),
          (supabase as any).from('signalement').select('id', { count: 'exact', head: true }).gte('created_at', dayDateStrs[i]).lt('created_at', dayNextDateStrs[i]),
          (supabase as any).from('dossier_disparition').select('id', { count: 'exact', head: true }).gte('date_resolution', dayDateStrs[i]).lt('date_resolution', dayNextDateStrs[i]).in('statut_dossier', ['retrouve_vivant', 'retrouve_decede'])
        );
      }

      const secondBatch = await Promise.all([
        ...monthPromises,
        ...dayPromises,
        (supabase as any).from('dossier_disparition').select('id, statut_dossier, personne:personne(date_naissance, age_estime_min, age_estime_max)'),
        (supabase as any).from('dossier_disparition').select('id, statut_dossier, personne:personne(sexe)'),
        (supabase as any).from('dossier_disparition').select('id, type_disparition, statut_dossier'),
      ]);

      const months: MonthlyData[] = monthNames.map((monthName, i) => ({
        month: monthName,
        dossiers: (secondBatch[i * 2] as any)?.count ?? 0,
        signalements: (secondBatch[i * 2 + 1] as any)?.count ?? 0,
      }));
      setMonthlyData(months);

      const dailyTrends: DailyTrendData[] = dayLabels.map((_, i) => ({
        date: dayLabels[i],
        dossiers: (secondBatch[12 + i * 3] as any)?.count ?? 0,
        signalements: (secondBatch[12 + i * 3 + 1] as any)?.count ?? 0,
        found: (secondBatch[12 + i * 3 + 2] as any)?.count ?? 0,
      }));
      setDailyTrendData(dailyTrends);

      // Analyse par âge
      const dossiersWithPersonne = (secondBatch[102] as any)?.data ?? [];
      
      const ageGroups: Record<string, { total: number; found: number }> = {
        '0-5': { total: 0, found: 0 },
        '6-12': { total: 0, found: 0 },
        '13-17': { total: 0, found: 0 },
        '18-25': { total: 0, found: 0 },
        '26-40': { total: 0, found: 0 },
        '41-60': { total: 0, found: 0 },
        '60+': { total: 0, found: 0 },
        [t('super_admin.globalStatsInconnu')]: { total: 0, found: 0 },
      };

      (dossiersWithPersonne || []).forEach((d: any) => {
        const personne = d.personne;
        let age: number | null = null;
        
        if (personne?.date_naissance) {
          const birthDate = new Date(personne.date_naissance);
          const today = new Date();
          age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
        } else if (personne?.age_estime_min && personne?.age_estime_max) {
          age = Math.round((personne.age_estime_min + personne.age_estime_max) / 2);
        } else if (personne?.age_estime_min) {
          age = personne.age_estime_min;
        }

        let group = 'Inconnu';
        if (age !== null) {
          if (age <= 5) group = '0-5';
          else if (age <= 12) group = '6-12';
          else if (age <= 17) group = '13-17';
          else if (age <= 25) group = '18-25';
          else if (age <= 40) group = '26-40';
          else if (age <= 60) group = '41-60';
          else group = '60+';
        }

        ageGroups[group].total++;
        if (d.statut_dossier === 'retrouve_vivant' || d.statut_dossier === 'retrouve_decede') {
          ageGroups[group].found++;
        }
      });

      const ageArray: AgeGroupData[] = Object.entries(ageGroups)
        .map(([group, data]) => ({
          group,
          total: data.total,
          found: data.found,
          percentage: data.total > 0 ? Math.round((data.found / data.total) * 100) : 0,
        }))
        .filter(item => item.total > 0)
        .sort((a, b) => {
          const order = ['0-5', '6-12', '13-17', '18-25', '26-40', '41-60', '60+', 'Inconnu'];
          return order.indexOf(a.group) - order.indexOf(b.group);
        });

      setAgeGroupData(ageArray);

      // Analyse par sexe (données déjà chargées dans secondBatch)
      const dossiersWithSexe = (secondBatch[103] as any)?.data ?? [];
      const sexeMap: Record<string, { total: number; found: number }> = {
        'masculin': { total: 0, found: 0 },
        'feminin': { total: 0, found: 0 },
        'inconnu': { total: 0, found: 0 },
        'non_precise': { total: 0, found: 0 },
      };

      (dossiersWithSexe || []).forEach((d: any) => {
        const sexe = d.personne?.sexe || 'non_precise';
        if (!sexeMap[sexe]) sexeMap[sexe] = { total: 0, found: 0 };
        sexeMap[sexe].total++;
        if (d.statut_dossier === 'retrouve_vivant' || d.statut_dossier === 'retrouve_decede') {
          sexeMap[sexe].found++;
        }
      });

      const sexeArray: SexeData[] = Object.entries(sexeMap)
        .map(([sexe, data]) => ({
          sexe: sexe === 'masculin' ? t('super_admin.globalStatsMasculin') : sexe === 'feminin' ? t('super_admin.globalStatsFeminin') : sexe === 'inconnu' ? t('super_admin.globalStatsInconnu') : t('super_admin.globalStatsNonPrecise'),
          total: data.total,
          found: data.found,
          percentage: data.total > 0 ? Math.round((data.found / data.total) * 100) : 0,
        }))
        .filter(item => item.total > 0)
        .sort((a, b) => b.total - a.total);

      setSexeData(sexeArray);

      // Analyse par type de disparition (données déjà chargées dans secondBatch)
      const dossiersByType = (secondBatch[104] as any)?.data ?? [];
      const typeMap: Record<string, { total: number; found: number }> = {};

      (dossiersByType || []).forEach((d: any) => {
        const type = d.type_disparition || 'inconnue';
        if (!typeMap[type]) typeMap[type] = { total: 0, found: 0 };
        typeMap[type].total++;
        if (d.statut_dossier === 'retrouve_vivant' || d.statut_dossier === 'retrouve_decede') {
          typeMap[type].found++;
        }
      });

      const typeLabels: Record<string, string> = {
        'fugue': t('super_admin.globalStatsTypeFugue'),
        'enlevement_presume': t('super_admin.globalStatsTypeEnlevement'),
        'accident': t('super_admin.globalStatsTypeAccident'),
        'conflit_arme': t('super_admin.globalStatsTypeConflit'),
        'migration': t('super_admin.globalStatsTypeMigration'),
        'catastrophe_naturelle': t('super_admin.globalStatsTypeCatastrophe'),
        'disparition_volontaire': t('super_admin.globalStatsTypeDisparitionVolontaire'),
        'inconnue': t('super_admin.globalStatsTypeInconnue'),
        'autre': t('super_admin.globalStatsTypeAutre'),
      };

      const typeArray: TypeDisparitionData[] = Object.entries(typeMap)
        .map(([type, data]) => ({
          type: typeLabels[type] || type,
          total: data.total,
          found: data.found,
          percentage: data.total > 0 ? Math.round((data.found / data.total) * 100) : 0,
        }))
        .filter(item => item.total > 0)
        .sort((a, b) => b.total - a.total);

      setTypeDisparitionData(typeArray);

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
    { label: t('super_admin.globalStatsTotalDossiers'), value: stats.totalDossiers.toString(), icon: Users, color: 'primary' },
    { label: t('super_admin.globalStatsRetrouves'), value: stats.dossiersRetrouves.toString(), icon: CheckCircle2, color: 'success' },
    { label: t('super_admin.globalStatsEnCours'), value: stats.dossiersEnCours.toString(), icon: Clock, color: 'warning' },
    { label: t('super_admin.globalStatsTauxSucces'), value: `${stats.successRate}%`, icon: TrendingUp, color: 'info' },
    { label: t('super_admin.globalStatsSignalements'), value: stats.totalSignalements.toString(), icon: Bell, color: 'secondary' },
    { label: t('super_admin.globalStatsOrganisations'), value: stats.totalOrganisations.toString(), icon: Building2, color: 'tertiary' },
  ];

  const maxMonthlyValue = Math.max(...monthlyData.map(m => Math.max(m.dossiers, m.signalements)), 1);

  return (
    <SuperAdminLayout
      title={t('super_admin.globalStatistics') || t('super_admin.globalStatsFallback')}
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
          <div className={styles['sa-global-stats__skeletonWrap']}>
            <StatistiquesSkeleton />
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
                {t('super_admin.globalStatsEvolutionMensuelle')}
              </h2>
              <div className={styles['sa-global-stats__chart']}>
                <div className={styles['sa-global-stats__chart-legend']}>
                  <span><span className={styles['sa-global-stats__legend-dossiers']}></span> {t('super_admin.globalStatsLegendDossiers')}</span>
                  <span><span className={styles['sa-global-stats__legend-signalements']}></span> {t('super_admin.globalStatsLegendSignalements')}</span>
                </div>
                <div className={styles['sa-global-stats__chart-wrap']}>
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
              </div>
            </section>

            {/* Regional Analysis */}
            <section className={styles['sa-global-stats__section']}>
              <h2 className={styles['sa-global-stats__section-title']}>
                <MapPin size={20} />
                {t('super_admin.globalStatsAnalyseRegion')}
              </h2>
              <div className={styles['sa-global-stats__table-wrapper']}>
                {regionalData.length === 0 ? (
                  <p className={styles['sa-global-stats__empty']}>{t('super_admin.globalStatsNoDataRegion')}</p>
                ) : (
                  <table className={styles['sa-global-stats__table']}>
                    <thead>
                      <tr>
                        <th>{t('super_admin.globalStatsTableRegion')}</th>
                        <th>{t('super_admin.globalStatsTableTotal')}</th>
                        <th>{t('super_admin.globalStatsRetrouves')}</th>
                        <th>{t('super_admin.globalStatsTableTaux')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {regionalData.map((region) => (
                        <tr key={region.region}>
                          <td>{region.region === 'Non spécifié' ? t('super_admin.globalStatsNonSpecifie') : region.region}</td>
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

            {/* Analysis by Age */}
            <section className={styles['sa-global-stats__section']}>
              <h2 className={styles['sa-global-stats__section-title']}>
                <User size={20} />
                {t('super_admin.globalStatsAnalyseAge')}
              </h2>
              <div className={styles['sa-global-stats__table-wrapper']}>
                {ageGroupData.length === 0 ? (
                  <p className={styles['sa-global-stats__empty']}>{t('super_admin.globalStatsNoDataAge')}</p>
                ) : (
                  <table className={styles['sa-global-stats__table']}>
                    <thead>
                      <tr>
                        <th>{t('super_admin.globalStatsTableAge')}</th>
                        <th>{t('super_admin.globalStatsTableTotal')}</th>
                        <th>{t('super_admin.globalStatsRetrouves')}</th>
                        <th>{t('super_admin.globalStatsTableTaux')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ageGroupData.map((age) => (
                        <tr key={age.group}>
                          <td>{age.group === 'Inconnu' ? t('super_admin.globalStatsInconnu') : `${age.group} ans`}</td>
                          <td>{age.total}</td>
                          <td>{age.found}</td>
                          <td>
                            <span className={`${styles['sa-global-stats__percentage']} ${
                              age.percentage >= 50 ? styles['sa-global-stats__percentage--success'] : 
                              age.percentage >= 25 ? styles['sa-global-stats__percentage--warning'] : 
                              styles['sa-global-stats__percentage--danger']
                            }`}>
                              {age.percentage}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            {/* Analysis by Sexe */}
            <section className={styles['sa-global-stats__section']}>
              <h2 className={styles['sa-global-stats__section-title']}>
                <Users size={20} />
                {t('super_admin.globalStatsAnalyseSexe')}
              </h2>
              <div className={styles['sa-global-stats__table-wrapper']}>
                {sexeData.length === 0 ? (
                  <p className={styles['sa-global-stats__empty']}>{t('super_admin.globalStatsNoDataSexe')}</p>
                ) : (
                  <table className={styles['sa-global-stats__table']}>
                    <thead>
                      <tr>
                        <th>{t('super_admin.globalStatsTableSexe')}</th>
                        <th>{t('super_admin.globalStatsTableTotal')}</th>
                        <th>{t('super_admin.globalStatsRetrouves')}</th>
                        <th>{t('super_admin.globalStatsTableTaux')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sexeData.map((sexe) => (
                        <tr key={sexe.sexe}>
                          <td>{sexe.sexe}</td>
                          <td>{sexe.total}</td>
                          <td>{sexe.found}</td>
                          <td>
                            <span className={`${styles['sa-global-stats__percentage']} ${
                              sexe.percentage >= 50 ? styles['sa-global-stats__percentage--success'] : 
                              sexe.percentage >= 25 ? styles['sa-global-stats__percentage--warning'] : 
                              styles['sa-global-stats__percentage--danger']
                            }`}>
                              {sexe.percentage}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            {/* Analysis by Type Disparition */}
            <section className={styles['sa-global-stats__section']}>
              <h2 className={styles['sa-global-stats__section-title']}>
                <FileText size={20} />
                {t('super_admin.globalStatsAnalyseType')}
              </h2>
              <div className={styles['sa-global-stats__table-wrapper']}>
                {typeDisparitionData.length === 0 ? (
                  <p className={styles['sa-global-stats__empty']}>{t('super_admin.globalStatsNoDataType')}</p>
                ) : (
                  <table className={styles['sa-global-stats__table']}>
                    <thead>
                      <tr>
                        <th>{t('super_admin.globalStatsTableType')}</th>
                        <th>{t('super_admin.globalStatsTableTotal')}</th>
                        <th>{t('super_admin.globalStatsRetrouves')}</th>
                        <th>{t('super_admin.globalStatsTableTaux')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {typeDisparitionData.map((type) => (
                        <tr key={type.type}>
                          <td>{type.type}</td>
                          <td>{type.total}</td>
                          <td>{type.found}</td>
                          <td>
                            <span className={`${styles['sa-global-stats__percentage']} ${
                              type.percentage >= 50 ? styles['sa-global-stats__percentage--success'] : 
                              type.percentage >= 25 ? styles['sa-global-stats__percentage--warning'] : 
                              styles['sa-global-stats__percentage--danger']
                            }`}>
                              {type.percentage}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            {/* Daily Trends */}
            <section className={styles['sa-global-stats__section']}>
              <h2 className={styles['sa-global-stats__section-title']}>
                <Activity size={20} />
                {t('super_admin.globalStatsTendancesQuotidiennes')}
              </h2>
              <div className={styles['sa-global-stats__chart']}>
                <div className={styles['sa-global-stats__chart-legend']}>
                  <span><span className={styles['sa-global-stats__legend-dossiers']}></span> {t('super_admin.globalStatsLegendDossiersCreated')}</span>
                  <span><span className={styles['sa-global-stats__legend-signalements']}></span> {t('super_admin.globalStatsLegendSignalements')}</span>
                  <span style={{ color: '#10b981' }}><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#10b981', borderRadius: '2px', marginRight: '4px' }}></span> {t('super_admin.globalStatsLegendRetrouves')}</span>
                </div>
                <div className={styles['sa-global-stats__chart-bars']} style={{ maxHeight: '300px', overflowX: 'auto', display: 'flex', gap: '2px' }}>
                  {dailyTrendData.map((day) => {
                    const maxValue = Math.max(...dailyTrendData.map(d => Math.max(d.dossiers, d.signalements, d.found)), 1);
                    return (
                      <div key={day.date} className={styles['sa-global-stats__chart-month']} style={{ minWidth: '30px' }}>
                        <div className={styles['sa-global-stats__chart-bar-group']} style={{ height: '200px', position: 'relative' }}>
                          <div 
                            className={`${styles['sa-global-stats__chart-bar']} ${styles['sa-global-stats__chart-bar--dossiers']}`}
                            style={{ 
                              height: `${(day.dossiers / maxValue) * 100}%`,
                              position: 'absolute',
                              bottom: 0,
                              left: '0%',
                              width: '30%'
                            }}
                            title={t('super_admin.globalStatsTitleDossiers', { count: day.dossiers })}
                          >
                            {day.dossiers > 0 && <span className={styles['sa-global-stats__chart-value']}>{day.dossiers}</span>}
                          </div>
                          <div 
                            className={`${styles['sa-global-stats__chart-bar']} ${styles['sa-global-stats__chart-bar--signalements']}`}
                            style={{ 
                              height: `${(day.signalements / maxValue) * 100}%`,
                              position: 'absolute',
                              bottom: 0,
                              left: '33%',
                              width: '30%'
                            }}
                            title={t('super_admin.globalStatsTitleSignalements', { count: day.signalements })}
                          >
                            {day.signalements > 0 && <span className={styles['sa-global-stats__chart-value']}>{day.signalements}</span>}
                          </div>
                          <div 
                            style={{ 
                              height: `${(day.found / maxValue) * 100}%`,
                              position: 'absolute',
                              bottom: 0,
                              left: '66%',
                              width: '30%',
                              background: '#10b981',
                              borderRadius: '2px 2px 0 0'
                            }}
                            title={t('super_admin.globalStatsTitleRetrouves', { count: day.found })}
                          >
                            {day.found > 0 && <span className={styles['sa-global-stats__chart-value']} style={{ color: 'white' }}>{day.found}</span>}
                          </div>
                        </div>
                        <span className={styles['sa-global-stats__chart-label']} style={{ fontSize: '0.7rem' }}>{day.date}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminGlobalStatsPage;
