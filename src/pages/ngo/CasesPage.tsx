import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, AlertTriangle, ChevronLeft, ChevronRight, FolderOpen } from 'lucide-react';
import { useI18n } from '../../hooks';
import { supabase } from '../../config';
import { StatutDossier } from '../../@types/enums.types';
import { NGOLayout } from './NGOLayout';
import { AdminTableSkeleton } from '../admin/skeletons';
import styles from './CasesPage.module.css';

interface CaseRow {
  id: string;
  nom_complet: string;
  localisation: string;
  statut_dossier: string;
  date_disparition: string;
}

export interface NGOCasesPageProps {
  noLayout?: boolean;
  /** Base path for links (e.g. /admin when used from admin org). Default /ngo. Admin uses segment "cas", NGO "cases". */
  basePath?: string;
}

export const NGOCasesPage: React.FC<NGOCasesPageProps> = ({ noLayout, basePath = '/ngo' }) => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resolved' | 'closed'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const itemsPerPage = 10;

  const loadCases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Modèle officiel: dossier_disparition (+ jointure personne)
      let query: any = supabase
        .from('dossier_disparition')
        .select(`
          id,
          numero_dossier,
          date_disparition,
          statut_dossier,
          lieu_disparition,
          ville_disparition,
          region_disparition,
          personne:id_personne (
            nom,
            prenom,
            nom_complet
          )
        `)
        .order('date_disparition', { ascending: false })
        .limit(500);

      if (statusFilter !== 'all') {
        if (statusFilter === 'active') {
          query = query.eq('statut_dossier', StatutDossier.EN_COURS);
        } else if (statusFilter === 'resolved') {
          query = query.in('statut_dossier', [StatutDossier.RETROUVE_VIVANT, StatutDossier.RETROUVE_DECEDE]);
        } else if (statusFilter === 'closed') {
          query = query.in('statut_dossier', [StatutDossier.SUSPENDU, StatutDossier.CLASSE_SANS_SUITE, StatutDossier.TRANSFERE]);
        }
      }

      const { data, error: err } = await query;

      if (err) throw err;
      const mapped: CaseRow[] = (data || []).map((d: any) => {
        const personne = d.personne || {};
        const nomComplet =
          personne.nom_complet ||
          `${personne.prenom || ''} ${personne.nom || ''}`.trim() ||
          d.numero_dossier ||
          '—';
        const localisation = [d.lieu_disparition, d.ville_disparition, d.region_disparition]
          .filter(Boolean)
          .join(', ') || '—';
        return {
          id: d.id,
          nom_complet: nomComplet,
          localisation,
          statut_dossier: d.statut_dossier,
          date_disparition: d.date_disparition,
        };
      });

      // Recherche côté client (nom/prénom + localisation)
      const term = searchTerm.trim().toLowerCase();
      const filtered = term
        ? mapped.filter((c) =>
            c.nom_complet.toLowerCase().includes(term) ||
            c.localisation.toLowerCase().includes(term),
          )
        : mapped;

      setCases(filtered);
      setCurrentPage(1);
    } catch (err) {
      console.error('Erreur:', err);
      setError(t('common.errorLoadingData'));
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, t]);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  const totalPages = Math.ceil(cases.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedCases = cases.slice(startIdx, startIdx + itemsPerPage);

  const loadingContent = (
    <div className={styles.skeletonWrap}>
      <AdminTableSkeleton columns={4} rows={8} />
    </div>
  );
  if (loading) {
    if (noLayout) return loadingContent;
    return <NGOLayout>{loadingContent}</NGOLayout>;
  }

  const content = (
    <div className={styles.ngoCases}>
      <header className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <h1 className={styles.pageTitle}>
              <FolderOpen size={24} />
              {t('ngo.casesTitle')}
            </h1>
            <p className={styles.pageSubtitle}>{t('ngo.casesSubtitle')}</p>
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => navigate(basePath === '/admin' ? `${basePath}/cas/create` : `${basePath}/cases/create`)}
            >
              <Plus size={18} />
              <span>{t('ngo.createCase')}</span>
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className={styles.errorBanner} role="alert">
          <AlertTriangle size={20} className={styles.errorBannerIcon} aria-hidden />
          <span>{error}</span>
        </div>
      )}

      <div className={styles.controls}>
        <div className={styles.searchBox}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder={t('common.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.filterSort}>
          <div className={styles.selectWrapper}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className={styles.select}
            >
              <option value="all">{t('common.allStatuses')}</option>
              <option value="active">{t('common.active')}</option>
              <option value="resolved">{t('ngo.resolved')}</option>
              <option value="closed">{t('ngo.closed')}</option>
            </select>
          </div>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <div className={styles.headerCell}>{t('common.name')}</div>
            <div className={styles.headerCell}>{t('common.location')}</div>
            <div className={styles.headerCell}>{t('ngo.missingDate')}</div>
            <div className={styles.headerCell}>{t('common.status')}</div>
          </div>
          {paginatedCases.length > 0 ? (
            paginatedCases.map((c) => (
              <div
                key={c.id}
                className={styles.tableRow}
                role="button"
                tabIndex={0}
                onClick={() => navigate(basePath === '/admin' ? `${basePath}/dossiers/${c.id}` : `${basePath}/cases/${c.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(basePath === '/admin' ? `${basePath}/dossiers/${c.id}` : `${basePath}/cases/${c.id}`);
                  }
                }}
              >
                <div className={styles.tableCell}>{c.nom_complet}</div>
                <div className={styles.tableCell}>{c.localisation}</div>
                <div className={styles.tableCell}>{new Date(c.date_disparition).toLocaleDateString('fr-FR')}</div>
                <div className={styles.tableCell}>
                  <span
                    className={styles.statusBadge}
                    data-status={
                      c.statut_dossier === StatutDossier.EN_COURS
                        ? 'en_cours'
                        : [StatutDossier.RETROUVE_VIVANT, StatutDossier.RETROUVE_DECEDE].includes(c.statut_dossier as any)
                          ? 'resolved'
                          : 'closed'
                    }
                  >
                    {c.statut_dossier === StatutDossier.EN_COURS
                      ? t('common.active')
                      : [StatutDossier.RETROUVE_VIVANT, StatutDossier.RETROUVE_DECEDE].includes(c.statut_dossier as any)
                        ? t('ngo.resolved')
                        : t('ngo.closed')}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              <p>{t('ngo.noCases')}</p>
            </div>
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            type="button"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={styles.paginationButton}
          >
            <ChevronLeft size={18} /> {t('common.previous')}
          </button>
          <span className={styles.pageInfo}>
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={styles.paginationButton}
          >
            {t('common.next')} <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
  if (noLayout) return content;
  return <NGOLayout>{content}</NGOLayout>;
};
