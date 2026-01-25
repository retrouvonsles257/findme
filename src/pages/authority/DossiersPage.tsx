/**
 * =====================================================
 * RETROUVONSLES - Dossiers Management Page
 * Gestion de liste des dossiers de disparitions
 * =====================================================
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDossiers } from '../../features/dossiers/hooks/useDossiers';
import { DashboardLayout, HeaderAuthority, SidebarAuthority } from '../../components/layout';
import styles from './DossiersPage.module.css';

export const DossiersPage: React.FC = () => {
  const navigate = useNavigate();
  const { dossiers, isLoading } = useDossiers();
  
  const [filter, setFilter] = useState<'all' | 'en_cours' | 'retrouve' | 'suspendu'>('en_cours');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'urgent' | 'ancien'>('recent');

  const filteredDossiers = dossiers
    .filter((dossier) => {
      const matchFilter =
        filter === 'all' ||
        (filter === 'en_cours' && dossier.statut_dossier === 'en_cours') ||
        (filter === 'retrouve' &&
          (dossier.statut_dossier === 'retrouve_vivant' || dossier.statut_dossier === 'retrouve_decede')) ||
        (filter === 'suspendu' && dossier.statut_dossier === 'suspendu');

      const matchSearch =
        dossier.numero_dossier.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (dossier.id_personne ? 'personne' : '').toLowerCase().includes(searchQuery.toLowerCase());

      return matchFilter && matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === 'urgent') {
        const urgencyOrder = { critique: 0, urgent: 1, normal: 2, faible: 3 };
        return (
          (urgencyOrder[a.niveau_urgence as keyof typeof urgencyOrder] || 999) -
          (urgencyOrder[b.niveau_urgence as keyof typeof urgencyOrder] || 999)
        );
      } else {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
    });

  return (
    <DashboardLayout
      header={<HeaderAuthority logo={<span>RetrouvonsLes</span>} />}
      sidebar={<SidebarAuthority />}
    >
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <h1>Gestion des Dossiers</h1>
            <p className={styles.subtitle}>
              {filteredDossiers.length} dossier{filteredDossiers.length > 1 ? 's' : ''}
            </p>
          </div>
          <button
            className={styles.createButton}
            onClick={() => navigate('/authority/dossiers/new')}
          >
            ➕ Nouveau Dossier
          </button>
        </div>

        {/* Controls */}
        <div className={styles.controls}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Rechercher par numéro..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterSort}>
            <select
              value={filter}
              onChange={(e) =>
                setFilter(e.target.value as 'all' | 'en_cours' | 'retrouve' | 'suspendu')
              }
              className={styles.select}
            >
              <option value="all">Tous les dossiers</option>
              <option value="en_cours">En cours</option>
              <option value="retrouve">Retrouvés</option>
              <option value="suspendu">Suspendus</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'urgent' | 'ancien')}
              className={styles.select}
            >
              <option value="recent">Plus récents</option>
              <option value="urgent">Plus urgents</option>
              <option value="ancien">Plus anciens</option>
            </select>
          </div>
        </div>

        {/* Dossiers Table */}
        <div className={styles.tableContainer}>
          {isLoading ? (
            <div className={styles.loading}>Chargement des dossiers...</div>
          ) : filteredDossiers.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>N° Dossier</th>
                  <th>Personne</th>
                  <th>Date Disparition</th>
                  <th>Statut</th>
                  <th>Urgence</th>
                  <th>Signalements</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDossiers.map((dossier) => (
                  <tr key={dossier.id} className={styles.row}>
                    <td className={styles.numero}>{dossier.numero_dossier}</td>
                    <td className={styles.personne}>
                      {dossier.id_personne ? 'Personne identifiée' : 'À identifier'}
                    </td>
                    <td>{new Date(dossier.date_disparition).toLocaleDateString()}</td>
                    <td>
                      <span
                        className={styles.statusBadge}
                        style={{
                          backgroundColor:
                            dossier.statut_dossier === 'en_cours'
                              ? '#ffc107'
                              : dossier.statut_dossier.includes('retrouve')
                                ? '#4caf50'
                                : '#999',
                        }}
                      >
                        {dossier.statut_dossier}
                      </span>
                    </td>
                    <td>
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
                    </td>
                    <td className={styles.centered}>{dossier.nombre_signalements || 0}</td>
                    <td className={styles.actions}>
                      <button
                        className={styles.actionBtn}
                        onClick={() => navigate(`/authority/dossiers/${dossier.id}`)}
                      >
                        👁️
                      </button>
                      <button
                        className={styles.actionBtn}
                        onClick={() => navigate(`/authority/dossiers/${dossier.id}/edit`)}
                      >
                        ✏️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className={styles.empty}>Aucun dossier trouvé</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DossiersPage;
