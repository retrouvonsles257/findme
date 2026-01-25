/**
 * =====================================================
 * RETROUVONSLES - Alertes Management Page
 * Gestion des alertes par les autorités
 * =====================================================
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout, HeaderAuthority, SidebarAuthority } from '../../components/layout';
import { useAlertes } from '../../features/alertes';
import styles from './AlertesPage.module.css';

export const AlertesPage: React.FC = () => {
  const navigate = useNavigate();
  const { alertes, loading: isLoading, fetchAlertes, error } = useAlertes();
  const [filter, setFilter] = useState<'all' | 'en_cours' | 'brouillon' | 'terminee'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Charger les alertes depuis Supabase avec filtres
    fetchAlertes({
      ...(filter !== 'all' && { statut: [filter as any] }),
    });
  }, [filter, fetchAlertes]);

  const filteredAlertes = alertes.filter((alerte) => {
    const matchSearch =
      alerte.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alerte.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSearch;
  });

  return (
    <DashboardLayout
      header={<HeaderAuthority logo={<span>RetrouvonsLes</span>} />}
      sidebar={<SidebarAuthority />}
    >
      <div className={styles.container}>
        {/* Header with Create Button */}
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <h1>Gestion des Alertes</h1>
            <p className={styles.subtitle}>Créer et gérer les alertes pour les personnes disparues</p>
          </div>
          <button
            className={styles.createButton}
            onClick={() => navigate('/authority/alertes/new')}
          >
            ➕ Créer Alerte
          </button>
        </div>

        {/* Filters and Search */}
        <div className={styles.filterSection}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Rechercher une alerte..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterTabs}>
            {(['all', 'en_cours', 'brouillon', 'terminee'] as const).map((tab) => (
              <button
                key={tab}
                className={`${styles.filterTab} ${filter === tab ? styles.active : ''}`}
                onClick={() => setFilter(tab)}
              >
                {tab === 'all' && 'Toutes'}
                {tab === 'en_cours' && 'En Cours'}
                {tab === 'brouillon' && 'Brouillon'}
                {tab === 'terminee' && 'Terminées'}
              </button>
            ))}
          </div>
        </div>

        {/* Alerts List */}
        <div className={styles.alertsList}>
          {error && (
            <div className={styles.error} style={{
              backgroundColor: '#ffebee',
              color: '#c62828',
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '16px',
              border: '1px solid #ef5350'
            }}>
              <strong>Erreur:</strong> {error}
            </div>
          )}

          {isLoading ? (
            <div className={styles.loading}>Chargement des alertes...</div>
          ) : filteredAlertes.length > 0 ? (
            filteredAlertes.map((alerte) => (
              <div key={alerte.id} className={styles.alertCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>
                    <h3>{alerte.titre}</h3>
                    <span
                      className={styles.statusBadge}
                      style={{
                        backgroundColor:
                          alerte.statut_alerte === 'en_cours'
                            ? '#4caf50'
                            : alerte.statut_alerte === 'brouillon'
                              ? '#ffc107'
                              : '#999',
                      }}
                    >
                      {alerte.statut_alerte}
                    </span>
                  </div>
                  <span className={styles.alertNumber}>{alerte.numero_alerte}</span>
                </div>

                <div className={styles.cardBody}>
                  <p className={styles.message}>{alerte.message_court || alerte.message}</p>

                  <div className={styles.alertMeta}>
                    <span className={styles.metaItem}>
                      📍 Rayon: {alerte.rayon_km}km
                    </span>
                    <span className={styles.metaItem}>
                      🔔 Type: {alerte.type_alerte}
                    </span>
                    <span className={styles.metaItem}>
                      📅 {new Date(alerte.date_diffusion).toLocaleDateString()}
                    </span>
                  </div>

                  <div className={styles.stats}>
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>Envois</span>
                      <span className={styles.statValue}>{alerte.nombre_envois_reussis}</span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>Vues</span>
                      <span className={styles.statValue}>{alerte.nombre_vues}</span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>Signalements</span>
                      <span className={styles.statValue}>
                        {alerte.nombre_signalements_generes}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <button
                    className={styles.actionButton}
                    onClick={() => navigate(`/authority/alertes/${alerte.id}`)}
                  >
                    Voir Détails
                  </button>
                  {alerte.statut_alerte === 'brouillon' && (
                    <button
                      className={`${styles.actionButton} ${styles.publishButton}`}
                      onClick={() => {
                        // Publier alerte
                        console.log('Publish alert:', alerte.id);
                      }}
                    >
                      Publier
                    </button>
                  )}
                  <button
                    className={`${styles.actionButton} ${styles.deleteButton}`}
                    onClick={() => {
                      const confirmed = window.confirm('Êtes-vous sûr de vouloir supprimer cette alerte?');
                      if (confirmed) {
                        console.log('Delete alert:', alerte.id);
                      }
                    }}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.empty}>Aucune alerte trouvée</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AlertesPage;
