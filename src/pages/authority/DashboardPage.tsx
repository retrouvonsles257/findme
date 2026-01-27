/**
 * =====================================================
 * RETROUVONSLES - Authority Dashboard Page
 * Page d'accueil pour les autorités (Police/Gendarmerie)
 * Données 100% réelles depuis Supabase
 * =====================================================
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderOpen,
  AlertTriangle,
  FileSearch,
  Bell,
  CheckCircle,
  Plus,
  ArrowRight,
  RefreshCw,
  Clock,
  Users,
  BarChart3,
  Search,
  Megaphone,
  TrendingUp,
} from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { useDossiers } from '../../features/dossiers/hooks/useDossiers';
import { useSignalements } from '../../features/signalements/hooks/useSignalements';
import { useAlertes } from '../../features/alertes/hooks/useAlertes';
import { AuthorityLayout } from '../../components/layout';
import { useI18n } from '../../hooks';
import styles from './DashboardPage.module.css';
import type { NomRole } from '../../@types/enums.types';

interface DashboardStats {
  dossiers_total: number;
  dossiers_en_cours: number;
  dossiers_urgent: number;
  signalements_nouveau: number;
  signalements_en_attente: number;
  alertes_active: number;
  retrouves_total: number;
  taux_resolution: number;
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useAppSelector(selectCurrentUser);
  const { dossiers, isLoading: dossiersLoading, fetchDossiers } = useDossiers();
  const { signalements, isLoading: signalementsLoading, fetchSignalements } = useSignalements();
  const { alertes, loading: alertesLoading, fetchAlertes } = useAlertes();
  const { t } = useI18n();
  
  const [stats, setStats] = useState<DashboardStats>({
    dossiers_total: 0,
    dossiers_en_cours: 0,
    dossiers_urgent: 0,
    signalements_nouveau: 0,
    signalements_en_attente: 0,
    alertes_active: 0,
    retrouves_total: 0,
    taux_resolution: 0,
  });

  // Verify user is an authority
  useEffect(() => {
    if (currentUser && ![
      'officier_police' as NomRole,
      'agent_gendarmerie' as NomRole,
      'operateur_saisie' as NomRole,
      'admin_organisation' as NomRole,
    ].includes(currentUser.role as NomRole)) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  // Calculate statistics from real data
  useEffect(() => {
    if (!dossiersLoading && !signalementsLoading && !alertesLoading) {
      const retrouves = dossiers.filter((d: any) => 
        d.statut_dossier === 'retrouve_vivant' || d.statut_dossier === 'retrouve_decede'
      ).length;
      
      const alertesActives = alertes.filter((a: any) => a.statut_alerte === 'en_cours').length;
      
      const signalementsNouveaux = signalements.filter((s: any) => 
        s.statut_validation === 'en_attente' || s.etat === 'nouveau'
      ).length;
      const signalementsEnAttente = signalements.filter((s: any) => 
        s.statut_validation === 'en_verification' || s.etat === 'en_cours'
      ).length;

      setStats({
        dossiers_total: dossiers.length,
        dossiers_en_cours: dossiers.filter((d: any) => d.statut_dossier === 'en_cours').length,
        dossiers_urgent: dossiers.filter((d: any) => 
          d.niveau_urgence === 'critique' || d.niveau_urgence === 'urgent'
        ).length,
        signalements_nouveau: signalementsNouveaux,
        signalements_en_attente: signalementsEnAttente,
        alertes_active: alertesActives,
        retrouves_total: retrouves,
        taux_resolution: dossiers.length > 0 
          ? Math.round((retrouves / dossiers.length) * 100) 
          : 0,
      });
    }
  }, [dossiers, signalements, alertes, dossiersLoading, signalementsLoading, alertesLoading]);

  const handleRefresh = () => {
    fetchDossiers();
    fetchSignalements();
    fetchAlertes();
  };

  const isLoading = dossiersLoading || signalementsLoading || alertesLoading;

  const getRoleName = (role?: string) => {
    switch (role) {
      case 'officier_police': return t('authority.roles.officier_police');
      case 'agent_gendarmerie': return t('authority.roles.agent_gendarmerie');
      case 'operateur_saisie': return t('authority.roles.operateur_saisie');
      case 'admin_organisation': return t('authority.roles.admin_organisation');
      default: return t('authority.roles.default');
    }
  };

  return (
    <AuthorityLayout>
      <div className={styles.authorityDashboard}>
        {/* Page Header */}
        <header className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <div className={styles.welcomeSection}>
              <h1 className={styles.pageTitle}>
                {t('authority.welcome')}, {currentUser?.nom_complet?.split('authority. ')[0] || t('authority.roles.default')}
              </h1>
              <p className={styles.pageSubtitle}>
                {getRoleName(currentUser?.role)} • {t('authority.menu.dashboard')}
              </p>
            </div>
            <button 
              className={styles.refreshButton}
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw size={18} className={isLoading ? styles.spinning : ''} />
              <span>{t('authority.header.refresh')}</span>
            </button>
          </div>
        </header>

        {/* Statistics Grid */}
        <section className={styles.statsSection}>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <FolderOpen size={24} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{stats.dossiers_en_cours}</span>
                <span className={styles.statLabel}>{t('authority.statistics.activeDossiers')}</span>
              </div>
              <span className={styles.statExtra}>{t('authority.statistics.totalDossiers')} {stats.dossiers_total}</span>
            </div>

            <div className={`${styles.statCard} ${styles.urgent}`}>
              <div className={styles.statIcon}>
                <AlertTriangle size={24} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{stats.dossiers_urgent}</span>
                <span className={styles.statLabel}>{t('authority.statistics.urgentCases')}</span>
              </div>
              <span className={styles.statExtra}>{t('authority.dossiers.urgency.critical')}</span>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <FileSearch size={24} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{stats.signalements_nouveau}</span>
                <span className={styles.statLabel}>{t('authority.statistics.signals')}</span>
              </div>
              <span className={styles.statExtra}>{stats.signalements_en_attente} {t('authority.signallementsSubtitle')}</span>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <Bell size={24} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{stats.alertes_active}</span>
                <span className={styles.statLabel}>{t('authority.activeAlerts')}</span>
              </div>
              <span className={styles.statExtra}>{t('authority.activeAlerts')}</span>
            </div>

            <div className={`${styles.statCard} ${styles.success}`}>
              <div className={styles.statIcon}>
                <CheckCircle size={24} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{stats.retrouves_total}</span>
                <span className={styles.statLabel}>{t('authority.statistics.foundCases')}</span>
              </div>
              <span className={styles.statExtra}>{stats.taux_resolution}% {t('authority.statistics.resolutionRate')}</span>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className={styles.quickActionsSection}>
          <h2 className={styles.sectionTitle}>{t('authority.dashboardTitle')}</h2>
          <div className={styles.actionsGrid}>
            <button
              className={styles.actionCard}
              onClick={() => navigate('/authority/dossiers/new')}
            >
              <div className={styles.actionIcon}>
                <Plus size={22} />
              </div>
              <span className={styles.actionLabel}>{t('authority.dossiers.newDossier')}</span>
            </button>

            <button
              className={styles.actionCard}
              onClick={() => navigate('/authority/signalements')}
            >
              <div className={styles.actionIcon}>
                <CheckCircle size={22} />
              </div>
              <span className={styles.actionLabel}>{t('authority.signallementsTitle')}</span>
              {stats.signalements_nouveau > 0 && (
                <span className={styles.actionBadge}>{stats.signalements_nouveau}</span>
              )}
            </button>

            <button
              className={styles.actionCard}
              onClick={() => navigate('/authority/alertes')}
            >
              <div className={styles.actionIcon}>
                <Megaphone size={22} />
              </div>
              <span className={styles.actionLabel}>{t('authority.alertesTitle')}</span>
              {stats.alertes_active > 0 && (
                <span className={styles.actionBadge}>{stats.alertes_active}</span>
              )}
            </button>

            <button
              className={styles.actionCard}
              onClick={() => navigate('/authority/investigation')}
            >
              <div className={styles.actionIcon}>
                <Search size={22} />
              </div>
              <span className={styles.actionLabel}>{t('authority.menu.investigation')}</span>
            </button>

            <button
              className={styles.actionCard}
              onClick={() => navigate('/authority/statistiques')}
            >
              <div className={styles.actionIcon}>
                <BarChart3 size={22} />
              </div>
              <span className={styles.actionLabel}>{t('authority.menu.statistiques')}</span>
            </button>

            <button
              className={styles.actionCard}
              onClick={() => navigate('/authority/coordination')}
            >
              <div className={styles.actionIcon}>
                <Users size={22} />
              </div>
              <span className={styles.actionLabel}>{t('authority.menu.coordination')}</span>
            </button>
          </div>
        </section>

        {/* Recent Items Grid */}
        <div className={styles.recentGrid}>
          {/* Recent Dossiers */}
          <section className={styles.recentSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <FolderOpen size={20} />
                {t('authority.dossiers.title')}
              </h2>
              <button 
                className={styles.viewAllLink}
                onClick={() => navigate('/authority/dossiers')}
              >
                {t('authority.commonActions.view')} {t('authority.commonActions.view')} <ArrowRight size={16} />
              </button>
            </div>
            <div className={styles.itemsList}>
              {dossiersLoading ? (
                <div className={styles.loadingState}>
                  <RefreshCw size={20} className={styles.spinning} />
                  <span>{t('authority.header.loading')}</span>
                </div>
              ) : dossiers.length > 0 ? (
                dossiers.slice(0, 5).map((dossier: any) => (
                  <div
                    key={dossier.id}
                    className={styles.listItem}
                    onClick={() => navigate(`/authority/dossiers/${dossier.id}`)}
                  >
                    <div className={styles.itemMain}>
                      <h4 className={styles.itemTitle}>
                        {dossier.numero_dossier || `DOS-${dossier.id.substring(0, 6)}`}
                      </h4>
                      <p className={styles.itemDesc}>
                        {dossier.statut_dossier?.replace('_', ' ') || 'En cours'}
                      </p>
                    </div>
                    <div className={styles.itemMeta}>
                      <span 
                        className={styles.urgencyBadge}
                        data-urgency={dossier.niveau_urgence || 'normal'}
                      >
                        {dossier.niveau_urgence || 'normal'}
                      </span>
                      <span className={styles.itemDate}>
                        <Clock size={14} />
                        {new Date(dossier.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>
                  <FolderOpen size={32} />
                  <p>{t('authority.dossiers.noDossiers')}</p>
                </div>
              )}
            </div>
          </section>

          {/* Recent Signalements */}
          <section className={styles.recentSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <FileSearch size={20} />
                {t('authority.signallementsTitle')}
              </h2>
              <button 
                className={styles.viewAllLink}
                onClick={() => navigate('/authority/signalements')}
              >
                {t('authority.commonActions.view')} {t('authority.commonActions.view')} <ArrowRight size={16} />
              </button>
            </div>
            <div className={styles.itemsList}>
              {signalementsLoading ? (
                <div className={styles.loadingState}>
                  <RefreshCw size={20} className={styles.spinning} />
                  <span>{t('authority.header.loading')}</span>
                </div>
              ) : signalements.length > 0 ? (
                signalements.slice(0, 5).map((signalement: any) => {
                  const status = signalement.statut_validation || signalement.etat || 'en_attente';
                  return (
                    <div
                      key={signalement.id}
                      className={styles.listItem}
                      onClick={() => navigate(`/authority/signalements/${signalement.id}`)}
                    >
                      <div className={styles.itemMain}>
                        <h4 className={styles.itemTitle}>
                          {signalement.lieu_observation || 'Signalement'}
                        </h4>
                        <p className={styles.itemDesc}>
                          {(signalement.description || '').substring(0, 50)}...
                        </p>
                      </div>
                      <div className={styles.itemMeta}>
                        <span 
                          className={styles.statusBadge}
                          data-status={status}
                        >
                          {status.replace('_', ' ')}
                        </span>
                        <span className={styles.itemDate}>
                          <Clock size={14} />
                          {signalement.date_observation 
                            ? new Date(signalement.date_observation).toLocaleDateString('fr-FR')
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className={styles.emptyState}>
                  <FileSearch size={32} />
                  <p>{t('authority.noReports')}</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Active Alerts Section */}
        {stats.alertes_active > 0 && (
          <section className={styles.alertsSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <Megaphone size={20} />
                {t('authority.activeAlerts')}
              </h2>
              <button 
                className={styles.viewAllLink}
                onClick={() => navigate('/authority/alertes')}
              >
                {t('authority.commonActions.view')} {t('authority.commonActions.view')} <ArrowRight size={16} />
              </button>
            </div>
            <div className={styles.alertsList}>
              {alertes
                .filter((a: any) => a.statut_alerte === 'en_cours')
                .slice(0, 3)
                .map((alerte: any) => (
                  <div
                    key={alerte.id}
                    className={styles.alertCard}
                    onClick={() => navigate(`/authority/alertes/${alerte.id}`)}
                  >
                    <div className={styles.alertHeader}>
                      <Bell size={18} className={styles.alertIcon} />
                      <h4>{alerte.titre}</h4>
                      <span className={styles.alertBadge}>{t('authority.activeAlerts')}</span>
                    </div>
                    <p className={styles.alertMessage}>
                      {(alerte.message_court || alerte.message || '').substring(0, 100)}...
                    </p>
                    <div className={styles.alertFooter}>
                      <span>
                        <Clock size={14} />
                        {new Date(alerte.date_diffusion || alerte.created_at).toLocaleDateString('fr-FR')}
                      </span>
                      {alerte.nombre_vues > 0 && (
                        <span>
                          <TrendingUp size={14} />
                          {alerte.nombre_vues} vues
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}
      </div>
    </AuthorityLayout>
  );
};

export default DashboardPage;
