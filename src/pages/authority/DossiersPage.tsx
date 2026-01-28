/**
 * =====================================================
 * RETROUVONSLES - Dossiers Management Page
 * Gestion de liste des dossiers de disparitions
 * =====================================================
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderOpen,
  Plus,
  Search,
  Eye,
  Edit,
  RefreshCw,
  Filter,
  ArrowUpDown,
  Calendar,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
} from 'lucide-react';
import { useDossiers } from '../../features/dossiers/hooks/useDossiers';
import { AuthorityLayout } from '../../components/layout';
import { useI18n } from '../../hooks';
import styles from './DossiersPage.module.css';

export const DossiersPage: React.FC = () => {
  const navigate = useNavigate();
  const { dossiers, isLoading, fetchDossiers } = useDossiers();
  const { t, language } = useI18n();
  
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

  // Count by status
  const countByStatus = {
    all: dossiers.length,
    en_cours: dossiers.filter(d => d.statut_dossier === 'en_cours').length,
    retrouve: dossiers.filter(d => d.statut_dossier?.includes('retrouve')).length,
    suspendu: dossiers.filter(d => d.statut_dossier === 'suspendu').length,
  };

  const getStatusIcon = (status: string) => {
    if (status === 'en_cours') return <Clock size={14} />;
    if (status?.includes('retrouve')) return <CheckCircle size={14} />;
    return <AlertTriangle size={14} />;
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'en_cours': return t('authority.dossiers.status.inProgress');
      case 'retrouve_vivant': return t('authority.dossiers.status.foundAlive');
      case 'retrouve_decede': return t('authority.dossiers.status.foundDeceased');
      case 'suspendu': return t('authority.dossiers.status.suspended');
      default: return status?.replace('_', ' ') || '';
    }
  };

  const getUrgencyLabel = (urgency: string) => {
    switch (urgency) {
      case 'critique': return t('authority.dossiers.urgency.critical');
      case 'urgent': return t('authority.dossiers.urgency.urgent');
      case 'normal': return t('authority.dossiers.urgency.normal');
      case 'faible': return t('authority.dossiers.urgency.low');
      default: return urgency || '';
    }
  };

  return (
    <AuthorityLayout>
      <div className={styles.authorityDossiers}>
        {/* Page Header */}
        <header className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <div className={styles.titleSection}>
              <h1 className={styles.pageTitle}>
                <FolderOpen size={24} />
                {t('authority.dossiers.title')}
              </h1>
              <p className={styles.pageSubtitle}>
                {filteredDossiers.length === 1 
                  ? t('authority.dossiers.subtitle').replace('{{count}}', String(filteredDossiers.length))
                  : t('authority.dossiers.subtitlePlural').replace('{{count}}', String(filteredDossiers.length))}
              </p>
            </div>
            <div className={styles.headerActions}>
              <button 
                className={styles.refreshButton}
                onClick={() => fetchDossiers()}
                disabled={isLoading}
              >
                <RefreshCw size={18} className={isLoading ? styles.spinning : ''} />
                <span>{t('authority.dossiers.refresh')}</span>
              </button>
              <button
                className={styles.primaryButton}
                onClick={() => navigate('/authority/dossiers/new')}
              >
                <Plus size={18} />
                <span>{t('authority.dossiers.newDossier')}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Stats Bar */}
        <div className={styles.statsBar}>
          <button 
            className={`${styles.statCard} ${filter === 'all' ? styles.active : ''}`}
            onClick={() => setFilter('all')}
          >
            <FolderOpen size={20} />
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{countByStatus.all}</span>
              <span className={styles.statLabel}>{t('authority.dossiers.stats.total')}</span>
            </div>
          </button>
          <button 
            className={`${styles.statCard} ${filter === 'en_cours' ? styles.active : ''}`}
            onClick={() => setFilter('en_cours')}
          >
            <Clock size={20} />
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{countByStatus.en_cours}</span>
              <span className={styles.statLabel}>{t('authority.dossiers.stats.inProgress')}</span>
            </div>
          </button>
          <button 
            className={`${styles.statCard} ${styles.success} ${filter === 'retrouve' ? styles.active : ''}`}
            onClick={() => setFilter('retrouve')}
          >
            <CheckCircle size={20} />
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{countByStatus.retrouve}</span>
              <span className={styles.statLabel}>{t('authority.dossiers.stats.found')}</span>
            </div>
          </button>
          <button 
            className={`${styles.statCard} ${styles.warning} ${filter === 'suspendu' ? styles.active : ''}`}
            onClick={() => setFilter('suspendu')}
          >
            <AlertTriangle size={20} />
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{countByStatus.suspendu}</span>
              <span className={styles.statLabel}>{t('authority.dossiers.stats.suspended')}</span>
            </div>
          </button>
        </div>

        {/* Controls */}
        <div className={styles.controls}>
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder={t('authority.dossiers.searchByNumber')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterSort}>
            <div className={styles.selectWrapper}>
              <Filter size={16} />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | 'en_cours' | 'retrouve' | 'suspendu')}
                className={styles.select}
              >
                <option value="all">{t('authority.filters.allStatus')}</option>
                <option value="en_cours">{t('authority.dossiers.filterInProgress')}</option>
                <option value="retrouve">{t('authority.dossiers.stats.found')}</option>
                <option value="suspendu">{t('authority.dossiers.stats.suspended')}</option>
              </select>
            </div>

            <div className={styles.selectWrapper}>
              <ArrowUpDown size={16} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'recent' | 'urgent' | 'ancien')}
                className={styles.select}
              >
                <option value="recent">{t('authority.dossiers.sortRecent')}</option>
                <option value="urgent">{t('authority.dossiers.sortUrgent')}</option>
                <option value="ancien">{t('authority.dossiers.sortOldest')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dossiers Table */}
        <div className={styles.tableContainer}>
          {isLoading ? (
            <div className={styles.loadingState}>
              <RefreshCw size={24} className={styles.spinning} />
              <span>{t('authority.dossiers.loading')}</span>
            </div>
          ) : filteredDossiers.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t('authority.dossiers.tableHeaders.number')}</th>
                  <th>{t('authority.dossiers.tableHeaders.person')}</th>
                  <th>{t('authority.dossiers.tableHeaders.date')}</th>
                  <th>{t('authority.dossiers.tableHeaders.status')}</th>
                  <th>{t('authority.dossiers.tableHeaders.urgency')}</th>
                  <th>{t('authority.dossiers.tableHeaders.reports')}</th>
                  <th>{t('authority.dossiers.tableHeaders.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredDossiers.map((dossier) => (
                  <tr 
                    key={dossier.id} 
                    className={styles.row}
                    onClick={() => navigate(`/authority/dossiers/${dossier.id}`)}
                  >
                    <td>
                      <span className={styles.numero}>
                        <FolderOpen size={16} />
                        {dossier.numero_dossier}
                      </span>
                    </td>
                    <td>
                      <span className={styles.personne}>
                        <User size={16} />
                        {dossier.personne 
                          ? (dossier.personne.nom_complet || `${dossier.personne.prenom || ''} ${dossier.personne.nom || ''}`.trim() || t('authority.dossiers.identified'))
                          : dossier.id_personne 
                            ? t('authority.dossiers.identified')
                            : t('authority.dossiers.toIdentify')}
                      </span>
                    </td>
                    <td>
                      <span className={styles.dateCell}>
                        <Calendar size={14} />
                        <span>{new Date(dossier.date_disparition).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}</span>
                      </span>
                    </td>
                    <td>
                      <span className={styles.statusBadge} data-status={dossier.statut_dossier}>
                        {getStatusIcon(dossier.statut_dossier)}
                        {getStatusLabel(dossier.statut_dossier)}
                      </span>
                    </td>
                    <td>
                      <span className={styles.urgencyBadge} data-urgency={dossier.niveau_urgence}>
                        {getUrgencyLabel(dossier.niveau_urgence)}
                      </span>
                    </td>
                    <td>
                      <span className={styles.signalements}>
                        <FileText size={14} />
                        {dossier.nombre_signalements || 0}
                      </span>
                    </td>
                    <td>
                      <span className={styles.actions}>
                        <button
                          className={styles.actionBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/authority/dossiers/${dossier.id}`);
                          }}
                          title={t('authority.dossiers.viewDetails')}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className={styles.actionBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/authority/dossiers/${dossier.id}/edit`);
                          }}
                          title={t('authority.commonActions.edit')}
                        >
                          <Edit size={16} />
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className={styles.emptyState}>
              <FolderOpen size={48} />
              <h3>{t('authority.dossiers.noDossiers')}</h3>
              <p>
                {searchQuery 
                  ? t('authority.dossiers.noDossiers')
                  : t('authority.dossiers.noDossiers')}
              </p>
              <button 
                className={styles.primaryButton}
                onClick={() => navigate('/authority/dossiers/new')}
              >
                <Plus size={18} />
                {t('authority.dossiers.newDossier')}
              </button>
            </div>
          )}
        </div>
      </div>
    </AuthorityLayout>
  );
};

export default DossiersPage;