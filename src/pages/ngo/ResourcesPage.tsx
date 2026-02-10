import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardBody } from '../../components/common/Card';
import { useI18n } from '../../hooks';
import { NGOLayout } from './NGOLayout';
import { getRessourcesOrganisation } from '../../features/admin-organisation/services';
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document': return '📄';
      case 'tool': return '🛠️';
      case 'guide': return '📖';
      case 'training': return '🎓';
      default: return '📚';
    }
  };

  const loadingContent = (
    <div className={styles['ngo-resources__loading-container']}>
      <div className={styles['ngo-resources__spinner']}></div>
      <p>{t('common.loading')}</p>
    </div>
  );
  if (loading) {
    if (noLayout) return loadingContent;
    return <NGOLayout title={t('ngo.resourcesTitle')}>{loadingContent}</NGOLayout>;
  }

  const content = (
    <div>
      <p className={styles['ngo-resources__subtitle']}>{t('ngo.resourcesSubtitle')}</p>

      {error && (
        <div className={styles['ngo-resources__error-message']}>
          ⚠️ {error}
        </div>
      )}

        <div className={styles['ngo-resources__controls']}>
          <input
            type="text"
            placeholder={t('common.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles['ngo-resources__search-input']}
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className={styles['ngo-resources__filter-select']}
          >
            <option value="all">{t('ngo.allTypes')}</option>
            <option value="document">{t('ngo.document')}</option>
            <option value="tool">{t('ngo.tool')}</option>
            <option value="guide">{t('ngo.guide')}</option>
            <option value="training">{t('ngo.training')}</option>
          </select>
        </div>

        <div className={styles['ngo-resources__resources-grid']}>
          {paginatedResources.length > 0 ? (
            paginatedResources.map((resource) => (
              <Card key={resource.id} className={styles['ngo-resources__card']}>
                <CardBody className={styles['ngo-resources__card-body']}>
                  <div className={styles['ngo-resources__resource-card']}>
                    <div className={styles['ngo-resources__resource-icon']}>
                      {getTypeIcon(resource.type)}
                    </div>
                    <h3>{resource.titre}</h3>
                    <p className={styles['ngo-resources__description']}>{resource.description}</p>
                    <div className={styles['ngo-resources__resource-meta']}>
                      <span className={styles['ngo-resources__type']}>{resource.type}</span>
                      {resource.url && resource.url.trim() ? (
                        <a href={resource.url} target="_blank" rel="noopener noreferrer" className={styles['ngo-resources__link']}>
                          {t('ngo.accessResource')} →
                        </a>
                      ) : (
                        <span className={styles['ngo-resources__no-link']}>{t('ngo.noLink')}</span>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))
          ) : (
            <div className={styles['ngo-resources__empty-state']}>
              <p>{t('ngo.noResources')}</p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className={styles['ngo-resources__pagination']}>
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={styles['ngo-resources__pagination-button']}
            >
              ← {t('common.previous')}
            </button>
            <span className={styles['ngo-resources__page-info']}>
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={styles['ngo-resources__pagination-button']}
            >
              {t('common.next')} →
            </button>
          </div>
        )}
    </div>
  );
  if (noLayout) return content;
  return <NGOLayout title={t('ngo.resourcesTitle')}>{content}</NGOLayout>;
};
