import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody } from '../../components/common/Card';
import { useI18n } from '../../hooks';
import { supabase } from '../../config/supabase.config';
import { NGOLayout } from './NGOLayout';
import styles from './ResourcesPage.module.css';

interface Resource {
  id: string;
  titre: string;
  type: 'document' | 'tool' | 'guide' | 'training';
  description: string;
  url: string;
  date_creation: string;
}

export const NGOResourcesPage: React.FC = () => {
  const navigate = useNavigate();
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

      let query = supabase.from('ressources_ngo').select('*');

      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }

      if (searchTerm) {
        query = query.or(`titre.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      const { data, error: err } = await (query.order('date_creation', { ascending: false }) as any);

      if (err) throw err;
      setResources(data || []);
      setCurrentPage(1);
    } catch (err) {
      console.error('Erreur:', err);
      setError(t('common.errorLoadingData'));
    } finally {
      setLoading(false);
    }
  }, [searchTerm, typeFilter, t]);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  const filteredResources = resources.filter((r) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      r.titre.toLowerCase().includes(searchLower) ||
      r.description.toLowerCase().includes(searchLower)
    );
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

  if (loading) {
    return (
      <NGOLayout title={t('ngo.resourcesTitle')}>
        <div className={styles['ngo-resources__loading-container']}>
          <div className={styles['ngo-resources__spinner']}></div>
          <p>{t('common.loading')}</p>
        </div>
      </NGOLayout>
    );
  }

  return (
    <NGOLayout title={t('ngo.resourcesTitle')}>
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
              <Card key={resource.id}>
                <CardBody>
                  <div className={styles['ngo-resources__resource-card']}>
                    <div className={styles['ngo-resources__resource-icon']}>
                      {getTypeIcon(resource.type)}
                    </div>
                    <h3>{resource.titre}</h3>
                    <p className={styles['ngo-resources__description']}>{resource.description}</p>
                    <div className={styles['ngo-resources__resource-meta']}>
                      <span className={styles['ngo-resources__type']}>{resource.type}</span>
                      <a href={resource.url} target="_blank" rel="noopener noreferrer" className={styles['ngo-resources__link']}>
                        {t('ngo.accessResource')} →
                      </a>
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
    </NGOLayout>
  );
};
