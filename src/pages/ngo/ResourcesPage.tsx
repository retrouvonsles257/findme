import React, { useEffect, useState, useCallback } from 'react';
import { FileText, Wrench, BookOpen, GraduationCap, Library, AlertTriangle, ExternalLink, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '../../hooks';
import { NGOLayout } from './NGOLayout';
import { getRessourcesOrganisation } from '../../features/admin-organisation/services';
import { AdminCardsGridSkeleton } from '../admin/skeletons';
import styles from './ResourcesPage.module.css';

interface Resource {
  id: string;
  titre: string;
  type: 'document' | 'tool' | 'guide' | 'training';
  description: string;
  url: string;
  date_creation: string;
}

export interface NGOResourcesPageProps {
  noLayout?: boolean;
  /** Quand fourni (contexte admin org), charge les ressources depuis ressource_organisation */
  organisationId?: string | null;
}

export const NGOResourcesPage: React.FC<NGOResourcesPageProps> = ({ noLayout, organisationId }) => {
  const { t } = useI18n();
  const [resources, setResources] = useState<Resource[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'document' | 'tool' | 'guide' | 'training'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const itemsPerPage = 10;

  const loadResources = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (organisationId) {
        const rows = await getRessourcesOrganisation(organisationId);
        setResources(
          rows.map((r) => ({
            id: r.id,
            titre: r.titre,
            type: r.type,
            description: r.description ?? '',
            url: r.url ?? '',
            date_creation: r.created_at,
          }))
        );
      } else {
        setResources([]);
      }
      setCurrentPage(1);
    } catch (err) {
      console.error('Erreur:', err);
      setError(t('common.errorLoadingData'));
    } finally {
      setLoading(false);
    }
  }, [t, organisationId]);
  const noOrganisation = organisationId === undefined || organisationId === null;

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  const filteredResources = resources.filter((r) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      r.titre.toLowerCase().includes(searchLower) ||
      r.description.toLowerCase().includes(searchLower);
    const matchesType = typeFilter === 'all' || r.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredResources.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedResources = filteredResources.slice(startIdx, startIdx + itemsPerPage);

  const getTypeIcon = (type: string): React.ReactNode => {
    const iconProps = { size: 28 };
    switch (type) {
      case 'document': return <FileText {...iconProps} />;
      case 'tool': return <Wrench {...iconProps} />;
      case 'guide': return <BookOpen {...iconProps} />;
      case 'training': return <GraduationCap {...iconProps} />;
      default: return <Library {...iconProps} />;
    }
  };

  const loadingContent = (
    <div className={styles.skeletonWrap}>
      <AdminCardsGridSkeleton cardCount={6} />
    </div>
  );
  if (loading) {
    if (noLayout) return loadingContent;
    return <NGOLayout>{loadingContent}</NGOLayout>;
  }

  const content = (
    <div className={styles.ngoResources}>
      <header className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <h1 className={styles.pageTitle}>
              <BookOpen size={24} />
              {t('ngo.resourcesTitle')}
            </h1>
            <p className={styles.pageSubtitle}>{t('ngo.resourcesSubtitle')}</p>
          </div>
        </div>
      </header>

      {noOrganisation && (
        <div className={styles.errorBanner} role="alert">
          <AlertTriangle size={20} className={styles.errorBannerIcon} aria-hidden />
          <span>{t('ngo.noOrganisation')}</span>
        </div>
      )}

      {error && (
        <div className={styles.errorBanner} role="alert">
          <AlertTriangle size={20} className={styles.errorBannerIcon} aria-hidden />
          <span>{error}</span>
        </div>
      )}

      {!noOrganisation && (
        <>
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
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className={styles.select}
                >
                  <option value="all">{t('ngo.allTypes')}</option>
                  <option value="document">{t('ngo.document')}</option>
                  <option value="tool">{t('ngo.tool')}</option>
                  <option value="guide">{t('ngo.guide')}</option>
                  <option value="training">{t('ngo.training')}</option>
                </select>
              </div>
            </div>
          </div>

          <div className={styles.cardsGrid}>
            {paginatedResources.length > 0 ? (
              paginatedResources.map((resource) => (
                <div key={resource.id} className={styles.card}>
                  <div className={styles.cardIcon}>{getTypeIcon(resource.type)}</div>
                  <h3 className={styles.cardTitle}>{resource.titre}</h3>
                  <p className={styles.cardDescription}>{resource.description}</p>
                  <div className={styles.cardMeta}>
                    <span className={styles.typeBadge}>{resource.type}</span>
                    {resource.url && resource.url.trim() ? (
                      <a href={resource.url} target="_blank" rel="noopener noreferrer" className={styles.cardLink}>
                        {t('ngo.accessResource')} <ExternalLink size={14} />
                      </a>
                    ) : (
                      <span className={styles.noLink}>{t('ngo.noLink')}</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                <p>{t('ngo.noResources')}</p>
              </div>
            )}
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
              <span className={styles.pageInfo}>{currentPage} / {totalPages}</span>
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
        </>
      )}
    </div>
  );
  if (noLayout) return content;
  return <NGOLayout>{content}</NGOLayout>;
};
