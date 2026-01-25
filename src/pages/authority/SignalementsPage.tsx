/**
 * =====================================================
 * RETROUVONSLES - Signalements Validation Page
 * Validation et traitement des signalements
 * =====================================================
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignalements } from '../../features/signalements/hooks/useSignalements';
import { DashboardLayout, HeaderAuthority, SidebarAuthority } from '../../components/layout';
import styles from './SignalementsPage.module.css';

export const SignalementsPage: React.FC = () => {
  const navigate = useNavigate();
  const { signalements, isLoading } = useSignalements();
  
  const [filter, setFilter] = useState<'all' | 'en_attente' | 'en_verification' | 'valide' | 'invalide'>('en_attente');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSignalements = signalements.filter((s) => {
    const matchFilter = filter === 'all' || (s.etat || s.statut_validation) === filter;
    const matchSearch =
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.lieu_observation || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  const handleValidate = (signalementId: string, approved: boolean) => {
    console.log(`${approved ? 'Approved' : 'Rejected'} signalement:`, signalementId);
    // Intégrer avec le hook useSignalementValidation
  };

  return (
    <DashboardLayout
      header={<HeaderAuthority logo={<span>RetrouvonsLes</span>} />}
      sidebar={<SidebarAuthority />}
    >
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <h1>Validation des Signalements</h1>
            <p className={styles.subtitle}>
              {filteredSignalements.length} signalement{filteredSignalements.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className={styles.controls}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Rechercher un signalement..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterTabs}>
            {(
              [
                'all',
                'en_attente',
                'en_verification',
                'valide',
                'invalide',
              ] as const
            ).map((tab) => (
              <button
                key={tab}
                className={`${styles.filterTab} ${filter === tab ? styles.active : ''}`}
                onClick={() => setFilter(tab)}
              >
                {tab === 'all' && 'Tous'}
                {tab === 'en_attente' && 'En Attente'}
                {tab === 'en_verification' && 'En Vérification'}
                {tab === 'valide' && 'Valides'}
                {tab === 'invalide' && 'Invalides'}
              </button>
            ))}
          </div>
        </div>

        {/* Signalements Grid */}
        <div className={styles.signalementsList}>
          {isLoading ? (
            <div className={styles.loading}>Chargement des signalements...</div>
          ) : filteredSignalements.length > 0 ? (
            filteredSignalements.map((signalement) => (
              <div key={signalement.id} className={styles.signalementCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>
                    <h3>{signalement.lieu_observation || 'Localisation inconnue'}</h3>
                    <span
                      className={styles.statusBadge}
                      style={{
                        backgroundColor:
                          signalement.etat === 'valide'
                            ? '#4caf50'
                            : signalement.etat === 'rejete'
                              ? '#ff6b6b'
                              : signalement.etat === 'en_cours'
                                ? '#2196f3'
                                : '#ffc107',
                      }}
                    >
                      {signalement.etat}
                    </span>
                  </div>
                  <span className={styles.certitude}>
                    {signalement.score_correspondance || 'probable'}
                  </span>
                </div>

                <div className={styles.cardBody}>
                  <p className={styles.description}>
                    {signalement.description.substring(0, 100)}...
                  </p>

                  <div className={styles.metadata}>
                    <span>📍 {signalement.lieu_observation}</span>
                    <span>📅 {new Date(signalement.date_observation).toLocaleDateString()}</span>
                    <span>👤 {signalement.notes ? 'Avec notes' : 'Standard'}</span>
                  </div>

                  {signalement.etat === 'nouveau' && (
                    <div className={styles.actions}>
                      <button
                        className={`${styles.actionBtn} ${styles.approve}`}
                        onClick={() => handleValidate(signalement.id, true)}
                      >
                        ✓ Valider
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.reject}`}
                        onClick={() => handleValidate(signalement.id, false)}
                      >
                        ✗ Rejeter
                      </button>
                      <button
                        className={styles.actionBtn}
                        onClick={() => navigate(`/authority/signalements/${signalement.id}`)}
                      >
                        👁️ Détails
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className={styles.empty}>Aucun signalement trouvé</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SignalementsPage;
