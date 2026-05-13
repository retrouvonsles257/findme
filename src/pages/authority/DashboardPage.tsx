/**
 * =====================================================
 * RETROUVONSLES - Authority Dashboard Page
 * Page d'accueil pour les autorités (Police/Gendarmerie)
 * Données 100% réelles depuis Supabase
 * =====================================================
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import { NomRole } from '../../@types/enums.types';
import { normalizeAppRole } from '../../utils/normalizeAppRole';
import { authorityEchelonI18nKey } from '../../utils/authorityRoleUi';
import type { DossierStatistics } from '../../features/dossiers/types';
import type { SignalementStats } from '../../features/signalements/types/signalement.types';
import { getDossierStatistics } from '../../features/dossiers/services/dossierAPI';
import { getSignalementStats } from '../../features/signalements/services/signalementAPI';

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
  const location = useLocation();
  const currentUser = useAppSelector(selectCurrentUser);
  const organisationId = currentUser?.organisation_id;
  const userId = currentUser?.id;

  /** Référence stable : sinon fetchDossiers change à chaque rendu → boucle infinie + AbortError Supabase */
  const dossiersInitialCriteria = useMemo(
    () => (organisationId ? { organisation_id: organisationId } : undefined),
    [organisationId],
  );
  const dossiersHookOptions = useMemo(
    () =>
      dossiersInitialCriteria
        ? { initialCriteria: dossiersInitialCriteria, skipInitialLoad: true as const }
        : { skipInitialLoad: true as const },
    [dossiersInitialCriteria],
  );

  const { dossiers, isLoading: dossiersLoading, fetchDossiers } = useDossiers(dossiersHookOptions);
  const { signalements, isLoading: signalementsLoading, fetchSignalements } = useSignalements();
  const { alertes, loading: alertesLoading, fetchAlertes } = useAlertes();
  const { t } = useI18n();

  const [dossierAgg, setDossierAgg] = useState<DossierStatistics | null>(null);
  const [signalementAgg, setSignalementAgg] = useState<SignalementStats | null>(null);
  const [aggLoading, setAggLoading] = useState(true);

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

  // Vérifier que l'utilisateur est bien compte autorité (rôle unique en base)
  useEffect(() => {
    if (currentUser && currentUser.role !== NomRole.AUTORITE) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const isDashboard = location.pathname === '/authority/dashboard' || location.pathname.endsWith('/dashboard');

  const loadAggregates = useCallback(async () => {
    if (!userId) {
      setDossierAgg(null);
      setSignalementAgg(null);
      setAggLoading(false);
      return;
    }
    setAggLoading(true);
    try {
      const oid = organisationId || undefined;
      const [d, s] = await Promise.all([getDossierStatistics(oid), getSignalementStats(oid)]);
      setDossierAgg(d);
      setSignalementAgg(s);
    } catch {
      setDossierAgg(null);
      setSignalementAgg(null);
      setStats({
        dossiers_total: 0,
        dossiers_en_cours: 0,
        dossiers_urgent: 0,
        signalements_nouveau: 0,
        signalements_en_attente: 0,
        alertes_active: 0,
        retrouves_total: 0,
        taux_resolution: 0,
      });
    } finally {
      setAggLoading(false);
    }
  }, [userId, organisationId]);

  const alertesActivesCount = useMemo(
    () => alertes.filter((a: any) => a.statut_alerte === 'en_cours').length,
    [alertes],
  );

  // Recharger listes + agrégats (totaux réels, pas seulement la page courante)
  useEffect(() => {
    if (!isDashboard || !userId) return;
    const oid = organisationId;
    const dossierFilters = {
      ...(oid ? { organisation_id: oid } : {}),
      limit: 5,
      offset: 0,
      sortBy: 'date' as const,
      sortOrder: 'desc' as const,
    };
    fetchDossiers(dossierFilters);
    fetchSignalements(oid ? { organisation_id: oid } : undefined, 1);
    fetchAlertes(oid ? { id_organisation_responsable: oid } : undefined);
    loadAggregates();
  }, [isDashboard, userId, organisationId, fetchDossiers, fetchSignalements, fetchAlertes, loadAggregates]);

  useEffect(() => {
    if (!dossierAgg || !signalementAgg || alertesLoading) return;
    const ud = (dossierAgg.urgence_distribution as Record<string, number>) || {};
    const dossiersUrgent = (ud.critique ?? 0) + (ud.urgent ?? 0);
    const next: DashboardStats = {
      dossiers_total: dossierAgg.total_dossiers,
      dossiers_en_cours: dossierAgg.dossiers_en_cours,
      dossiers_urgent: dossiersUrgent,
      signalements_nouveau: signalementAgg.parEtat.nouveau,
      signalements_en_attente: signalementAgg.parEtat.en_cours,
      alertes_active: alertesActivesCount,
      retrouves_total: dossierAgg.dossiers_resolus,
      taux_resolution: Math.round(Number(dossierAgg.taux_resolution) || 0),
    };
    setStats((prev) =>
      prev.dossiers_total === next.dossiers_total &&
      prev.dossiers_en_cours === next.dossiers_en_cours &&
      prev.dossiers_urgent === next.dossiers_urgent &&
      prev.signalements_nouveau === next.signalements_nouveau &&
      prev.signalements_en_attente === next.signalements_en_attente &&
      prev.alertes_active === next.alertes_active &&
      prev.retrouves_total === next.retrouves_total &&
      prev.taux_resolution === next.taux_resolution
        ? prev
        : next,
    );
  }, [dossierAgg, signalementAgg, alertesLoading, alertesActivesCount]);

  const handleRefresh = () => {
    if (!currentUser) return;
    const oid = currentUser.organisation_id;
    loadAggregates();
    fetchDossiers({
      ...(oid ? { organisation_id: oid } : {}),
      limit: 5,
      offset: 0,
      sortBy: 'date',
      sortOrder: 'desc',
    });
    fetchSignalements(oid ? { organisation_id: oid } : undefined, 1);
    fetchAlertes(oid ? { id_organisation_responsable: oid } : undefined);
  };

  const isLoading = dossiersLoading || signalementsLoading || alertesLoading || aggLoading;

  const getRoleSubtitle = (role?: string) => {
    const r = normalizeAppRole(role);
    if (r === NomRole.ADMIN_SYSTEME) return t('authority.roles.admin_systeme');
    if (r === NomRole.CITOYEN) return t('authority.roles.citoyen');
    if (r === NomRole.AUTORITE) {
      const e = (currentUser as { autorite_echelon?: number | null })?.autorite_echelon;
      return t(authorityEchelonI18nKey(e));
    }
    return t('authority.roles.default');
  };

  return (
    <AuthorityLayout>
      <div className={styles.authorityDashboard}>
        {/* Page Header */}
        <header className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <div className={styles.welcomeSection}>
              <h1 className={styles.pageTitle}>
                {t('authority.welcome')}, {currentUser?.nom_complet?.trim()?.split(/\s+/)[0] || t('authority.roles.default')}
              </h1>
              <p className={styles.pageSubtitle}>
                {getRoleSubtitle(currentUser?.role)} • {t('authority.menu.dashboard')}
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

        {isLoading ? (
          /* Skeleton : grille stats + actions + blocs récents */
          <div className={styles.dashboardSkeleton}>
            <div className={styles.dashboardSkeleton__statsGrid}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={styles.dashboardSkeleton__statCard}>
                  <div className={styles.dashboardSkeleton__statIcon} />
                  <div className={styles.dashboardSkeleton__statValue} />
                  <div className={styles.dashboardSkeleton__statLabel} />
                </div>
              ))}
            </div>
            <div className={styles.dashboardSkeleton__sectionTitle} />
            <div className={styles.dashboardSkeleton__actionsGrid}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className={styles.dashboardSkeleton__actionCard}>
                  <div className={styles.dashboardSkeleton__actionIcon} />
                  <div className={styles.dashboardSkeleton__actionLabel} />
                </div>
              ))}
            </div>
            <div className={styles.dashboardSkeleton__recentGrid}>
              <div className={styles.dashboardSkeleton__recentSection}>
                <div className={styles.dashboardSkeleton__sectionTitle} />
                {[1, 2, 3].map((i) => (
                  <div key={i} className={styles.dashboardSkeleton__listItem}>
                    <div className={styles.dashboardSkeleton__line} />
                    <div className={styles.dashboardSkeleton__lineShort} />
                  </div>
                ))}
              </div>
              <div className={styles.dashboardSkeleton__recentSection}>
                <div className={styles.dashboardSkeleton__sectionTitle} />
                {[1, 2, 3].map((i) => (
                  <div key={i} className={styles.dashboardSkeleton__listItem}>
                    <div className={styles.dashboardSkeleton__line} />
                    <div className={styles.dashboardSkeleton__lineShort} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
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
                {t('authority.commonActions.view')} <ArrowRight size={16} />
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
                {t('authority.commonActions.view')} <ArrowRight size={16} />
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
                  const rawDesc = (signalement.description || '').trim();
                  const preview = rawDesc.length > 50 ? `${rawDesc.slice(0, 50)}…` : rawDesc;
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
                          {preview || '—'}
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
                {t('authority.commonActions.view')} <ArrowRight size={16} />
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
                      {(() => {
                        const m = (alerte.message_court || alerte.message || '').trim();
                        return m.length > 100 ? `${m.slice(0, 100)}…` : m || '—';
                      })()}
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
          </>
        )}
      </div>
    </AuthorityLayout>
  );
};

export default DashboardPage;
