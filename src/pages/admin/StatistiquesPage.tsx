/**
 * =====================================================
 * RETROUVONSLES - Admin Statistics Page
 * Analyse statistique des données de l'organisation
 * =====================================================
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/types';
import { DashboardLayout, HeaderAdminOrganisation, SidebarAdminOrganisation } from '../../components/layout';
import { Card, CardBody, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatCard } from '../../components/cards/StatCard';
import { useI18n } from '../../hooks';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { NomRole } from '../../@types/enums.types';
import {
  BarChart3,
  TrendingUp,
  Users,
  FolderOpen,
  CheckCircle2,
  Clock,
  Loader2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import styles from './StatistiquesPage.module.css';

export const AdminOrganisationStatistiquesPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  
  const currentUser = useAppSelector(selectCurrentUser);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    if (!currentUser || currentUser.role !== NomRole.ADMIN_ORGANISATION) {
      navigate('/auth/login');
      return;
    }
    loadStatistics();
  }, [currentUser, navigate, period]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigationItems = [
    { label: t('common.dashboard'), href: '/admin/dashboard', icon: 'LayoutDashboard' },
    { label: t('admin.dossiers'), href: '/admin/dossiers', icon: 'FolderOpen' },
    { label: t('admin.rapports'), href: '/admin/rapports', icon: 'FileText' },
    { label: t('admin.utilisateurs'), href: '/admin/utilisateurs', icon: 'Users' },
    {
      label: t('admin.statistiques'),
      href: '/admin/statistiques',
      icon: 'BarChart3',
      isActive: true,
    },
    { label: t('admin.parametres'), href: '/admin/parametres', icon: 'Settings' },
  ];

  const stats = [
    {
      icon: <FolderOpen />,
      title: t('admin.totalDossiers'),
      value: '142',
      trend: { value: 8, isPositive: true },
      period: 'month',
    },
    {
      icon: <CheckCircle2 />,
      title: t('admin.resolvedDossiers'),
      value: '35',
      trend: { value: 5, isPositive: true },
      period: 'month',
    },
    {
      icon: <Users />,
      title: t('admin.foundPersons'),
      value: '32',
      trend: { value: 4, isPositive: true },
      period: 'month',
    },
    {
      icon: <Clock />,
      title: t('admin.avgResolutionTime'),
      value: '18 jours',
      trend: { value: 3, isPositive: false },
      period: 'month',
    },
  ];

  return (
    <DashboardLayout
      sidebar={
        <SidebarAdminOrganisation
          navigationItems={navigationItems}
          currentUser={currentUser}
        />
      }
      header={
        <HeaderAdminOrganisation
          currentUser={currentUser}
          onLogout={() => navigate('/auth/login')}
        />
      }
    >
      <div className={styles.statistiques__container}>
        {/* Header */}
        <div className={styles.statistiques__header}>
          <div className={styles.statistiques__headerContent}>
            <div className={styles.statistiques__headerIcon}>
              <BarChart3 />
            </div>
            <div>
              <h1 className={styles.statistiques__title}>{t('admin.statistiques')}</h1>
              <p className={styles.statistiques__subtitle}>{t('admin.analyzeOrganisationData')}</p>
            </div>
          </div>
          <div className={styles.statistiques__periodSelector}>
            <Button
              variant={period === 'month' ? 'primary' : 'secondary'}
              onClick={() => setPeriod('month')}
              size="sm"
            >
              {t('admin.thisMonth')}
            </Button>
            <Button
              variant={period === 'quarter' ? 'primary' : 'secondary'}
              onClick={() => setPeriod('quarter')}
              size="sm"
            >
              {t('admin.thisQuarter')}
            </Button>
            <Button
              variant={period === 'year' ? 'primary' : 'secondary'}
              onClick={() => setPeriod('year')}
              size="sm"
            >
              {t('admin.thisYear')}
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className={styles.statistiques__statsGrid}>
          {stats.map((stat, idx) => (
            <StatCard
              key={idx}
              icon={stat.icon}
              title={stat.title}
              value={stat.value}
              trend={stat.trend}
              color={
                idx % 4 === 0
                  ? '#1d4ed8'
                  : idx % 4 === 1
                    ? 'rgba(30, 144, 255, 0.92)'
                    : idx % 4 === 2
                      ? '#10b981'
                      : '#64748b'
              }
            />
          ))}
        </div>

        {/* Analytics Grid */}
        <div className={styles.statistiques__analyticsGrid}>
          {/* Distribution by type */}
          <Card>
            <CardHeader>
              <div className={styles.statistiques__cardHeader}>
                <BarChart3 className={styles.statistiques__cardIcon} />
                <h3 className={styles.statistiques__cardTitle}>{t('admin.disburtionByType')}</h3>
              </div>
            </CardHeader>
            <CardBody>
              <div className={styles.statistiques__chartPlaceholder}>
                <BarChart3 size={48} />
                <p>{t('admin.chartWillBeDisplayedHere')}</p>
              </div>
            </CardBody>
          </Card>

          {/* Resolution Rate */}
          <Card>
            <CardHeader>
              <div className={styles.statistiques__cardHeader}>
                <TrendingUp className={styles.statistiques__cardIcon} />
                <h3 className={styles.statistiques__cardTitle}>{t('admin.resolutionRate')}</h3>
              </div>
            </CardHeader>
            <CardBody>
              <div className={styles.statistiques__progressContainer}>
                <div className={styles.statistiques__progressBar}>
                  <div className={styles.statistiques__progress} style={{ width: '65%' }}>
                    65%
                  </div>
                </div>
                <p className={styles.statistiques__progressText}>
                  {t('admin.casesResolved')}: 65 / 100
                </p>
              </div>
            </CardBody>
          </Card>

          {/* Monthly Activity */}
          <Card>
            <CardHeader>
              <div className={styles.statistiques__cardHeader}>
                <Calendar className={styles.statistiques__cardIcon} />
                <h3 className={styles.statistiques__cardTitle}>{t('admin.monthlyActivity')}</h3>
              </div>
            </CardHeader>
            <CardBody>
              <div className={styles.statistiques__chartPlaceholder}>
                <Calendar size={48} />
                <p>{t('admin.chartWillBeDisplayedHere')}</p>
              </div>
            </CardBody>
          </Card>

          {/* Urgency Breakdown */}
          <Card>
            <CardHeader>
              <div className={styles.statistiques__cardHeader}>
                <AlertCircle className={styles.statistiques__cardIcon} />
                <h3 className={styles.statistiques__cardTitle}>{t('admin.urgencyBreakdown')}</h3>
              </div>
            </CardHeader>
            <CardBody>
              <div className={styles.statistiques__urgencyList}>
                <div className={styles.statistiques__urgencyItem}>
                  <span className={styles.statistiques__urgencyLabel} style={{ color: '#dc2626' }}>
                    <AlertCircle size={16} />
                    {t('admin.critical')}
                  </span>
                  <span className={styles.statistiques__urgencyValue}>8</span>
                </div>
                <div className={styles.statistiques__urgencyItem}>
                  <span className={styles.statistiques__urgencyLabel} style={{ color: '#ea580c' }}>
                    <AlertCircle size={16} />
                    {t('admin.urgent')}
                  </span>
                  <span className={styles.statistiques__urgencyValue}>24</span>
                </div>
                <div className={styles.statistiques__urgencyItem}>
                  <span className={styles.statistiques__urgencyLabel} style={{ color: '#1d4ed8' }}>
                    <AlertCircle size={16} />
                    {t('admin.normal')}
                  </span>
                  <span className={styles.statistiques__urgencyValue}>89</span>
                </div>
                <div className={styles.statistiques__urgencyItem}>
                  <span className={styles.statistiques__urgencyLabel} style={{ color: '#10b981' }}>
                    <AlertCircle size={16} />
                    {t('admin.low')}
                  </span>
                  <span className={styles.statistiques__urgencyValue}>21</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Performance Summary */}
        <Card>
          <CardHeader>
            <div className={styles.statistiques__cardHeader}>
              <TrendingUp className={styles.statistiques__cardIcon} />
              <h3 className={styles.statistiques__cardTitle}>{t('admin.performanceSummary')}</h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className={styles.statistiques__performanceGrid}>
              <div className={styles.statistiques__performanceMetric}>
                <span className={styles.statistiques__metricLabel}>{t('admin.avgResponseTime')}</span>
                <span className={styles.statistiques__metricValue}>2.5 heures</span>
              </div>
              <div className={styles.statistiques__performanceMetric}>
                <span className={styles.statistiques__metricLabel}>{t('admin.teamProductivity')}</span>
                <span className={styles.statistiques__metricValue}>92%</span>
              </div>
              <div className={styles.statistiques__performanceMetric}>
                <span className={styles.statistiques__metricLabel}>{t('admin.caseUptakeRate')}</span>
                <span className={styles.statistiques__metricValue}>87%</span>
              </div>
              <div className={styles.statistiques__performanceMetric}>
                <span className={styles.statistiques__metricLabel}>{t('admin.publicReports')}</span>
                <span className={styles.statistiques__metricValue}>156</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminOrganisationStatistiquesPage;