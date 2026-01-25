/**
 * =====================================================
 * RETROUVONSLES - Authority Dashboard Page
 * Page d'accueil pour les autorités (Police/Gendarmerie)
 * =====================================================
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { useDossiers } from '../../features/dossiers/hooks/useDossiers';
import { useSignalements } from '../../features/signalements/hooks/useSignalements';
import { DashboardLayout, HeaderAuthority, SidebarAuthority } from '../../components/layout';
import styles from './DashboardPage.module.css';
import type { NomRole } from '../../@types/enums.types';

interface DashboardStats {
  dossiers_total: number;
  dossiers_en_cours: number;
  dossiers_urgent: number;
  signalements_nouveau: number;
  signalements_en_attente: number;
  alertes_active: number;
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useAppSelector(selectCurrentUser);
  const { dossiers, isLoading: dossiersLoading } = useDossiers();
  const { signalements, isLoading: signalementsLoading } = useSignalements();
  
  const [stats, setStats] = useState<DashboardStats>({
    dossiers_total: 0,
    dossiers_en_cours: 0,
    dossiers_urgent: 0,
    signalements_nouveau: 0,
    signalements_en_attente: 0,
    alertes_active: 0,
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

  // Calculate statistics
  useEffect(() => {
    if (!dossiersLoading && !signalementsLoading) {
      setStats({
        dossiers_total: dossiers.length,
        dossiers_en_cours: dossiers.filter(d => d.statut_dossier === 'en_cours').length,
        dossiers_urgent: dossiers.filter(d => d.niveau_urgence === 'critique' || d.niveau_urgence === 'urgent').length,
        signalements_nouveau: signalements.filter(s => s.etat === 'nouveau').length,
        signalements_en_attente: signalements.filter(s => s.etat === 'en_cours').length,
        alertes_active: 0, // À implémenter avec le hook alertes
      });
    }
  }, [dossiers, signalements, dossiersLoading, signalementsLoading]);

  return (
    <DashboardLayout
      header={<HeaderAuthority logo={<span>RetrouvonsLes</span>} />}
      sidebar={<SidebarAuthority />}
    >
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h1>Bienvenue, {currentUser?.nom_complet}</h1>
          <p className={styles.subtitle}>
            {currentUser?.role === 'officier_police' && 'Tableau de bord Police'}
            {currentUser?.role === 'agent_gendarmerie' && 'Tableau de bord Gendarmerie'}
            {currentUser?.role === 'operateur_saisie' && 'Tableau de bord Opérateur'}
            {currentUser?.role === 'admin_organisation' && 'Tableau de bord Administration'}
          </p>
        </div>

        {/* Statistics Cards */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📋</div>
            <div className={styles.statContent}>
              <h3>Dossiers Actifs</h3>
              <div className={styles.statNumber}>{stats.dossiers_en_cours}</div>
              <p className={styles.statSubtext}>sur {stats.dossiers_total} total</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ color: '#ff6b6b' }}>⚠️</div>
            <div className={styles.statContent}>
              <h3>Cas Urgents</h3>
              <div className={styles.statNumber} style={{ color: '#ff6b6b' }}>
                {stats.dossiers_urgent}
              </div>
              <p className={styles.statSubtext}>critiques & urgents</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>🔍</div>
            <div className={styles.statContent}>
              <h3>Signalements</h3>
              <div className={styles.statNumber}>{stats.signalements_nouveau}</div>
              <p className={styles.statSubtext}>{stats.signalements_en_attente} en attente</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>📢</div>
            <div className={styles.statContent}>
              <h3>Alertes Actives</h3>
              <div className={styles.statNumber}>{stats.alertes_active}</div>
              <p className={styles.statSubtext}>diffusées</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={styles.quickActions}>
          <h2>Actions Rapides</h2>
          <div className={styles.actionsGrid}>
            <button
              className={styles.actionButton}
              onClick={() => navigate('/authority/dossiers/new')}
            >
              <span className={styles.buttonIcon}>➕</span>
              <span>Créer Dossier</span>
            </button>

            <button
              className={styles.actionButton}
              onClick={() => navigate('/authority/signalements')}
            >
              <span className={styles.buttonIcon}>✓</span>
              <span>Valider Signalements</span>
            </button>

            <button
              className={styles.actionButton}
              onClick={() => navigate('/authority/alertes')}
            >
              <span className={styles.buttonIcon}>📢</span>
              <span>Gérer Alertes</span>
            </button>

            <button
              className={styles.actionButton}
              onClick={() => navigate('/authority/investigation')}
            >
              <span className={styles.buttonIcon}>🔎</span>
              <span>Investigation</span>
            </button>
          </div>
        </div>

        {/* Recent Items */}
        <div className={styles.recentSection}>
          <div className={styles.recentDossiers}>
            <h2>Dossiers Récents</h2>
            <div className={styles.itemsList}>
              {dossiersLoading ? (
                <p>Chargement...</p>
              ) : dossiers.length > 0 ? (
                dossiers.slice(0, 5).map((dossier) => (
                  <div
                    key={dossier.id}
                    className={styles.listItem}
                    onClick={() => navigate(`/authority/dossiers/${dossier.id}`)}
                  >
                    <div className={styles.itemHeader}>
                      <h4>{dossier.numero_dossier}</h4>
                      <span
                        className={styles.urgenceBadge}
                        style={{
                          backgroundColor:
                            dossier.niveau_urgence === 'critique'
                              ? '#ff6b6b'
                              : dossier.niveau_urgence === 'urgent'
                                ? '#ffa500'
                                : '#4caf50',
                        }}
                      >
                        {dossier.niveau_urgence}
                      </span>
                    </div>
                    <p>{dossier.id_personne ? `Personne recherchée` : 'En cours'}</p>
                    <p className={styles.itemMeta}>
                      Créé: {new Date(dossier.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <p>Aucun dossier</p>
              )}
            </div>
          </div>

          <div className={styles.recentSignalements}>
            <h2>Signalements Récents</h2>
            <div className={styles.itemsList}>
              {signalementsLoading ? (
                <p>Chargement...</p>
              ) : signalements.length > 0 ? (
                signalements.slice(0, 5).map((signalement) => (
                  <div
                    key={signalement.id}
                    className={styles.listItem}
                    onClick={() => navigate(`/authority/signalements/${signalement.id}`)}
                  >
                    <div className={styles.itemHeader}>
                      <h4>{signalement.id || 'Sans numéro'}</h4>
                      <span
                        className={styles.statusBadge}
                        style={{
                          backgroundColor:
                            signalement.etat === 'valide'
                              ? '#4caf50'
                              : signalement.etat === 'rejete'
                                ? '#ff6b6b'
                                : '#ffc107',
                        }}
                      >
                        {signalement.etat}
                      </span>
                    </div>
                    <p>{signalement.description?.substring(0, 50)}...</p>
                    <p className={styles.itemMeta}>
                      Signalé: {new Date(signalement.date_observation).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <p>Aucun signalement</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
