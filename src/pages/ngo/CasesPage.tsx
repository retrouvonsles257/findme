import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody } from '../../components/common/Card';
import { useI18n } from '../../hooks';
import { supabase } from '../../config/supabase.config';
import { NGOLayout } from './NGOLayout';
import styles from './CasesPage.module.css';

interface Case {
  id: string;
  nom: string;
  prenom: string;
  localisation: string;
  statut: 'active' | 'resolved' | 'closed';
  date_disparition: string;
  description: string;
}

export const NGOCasesPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [cases, setCases] = useState<Case[]>([]);
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

      let query = supabase.from('dossiers').select('*');

      if (statusFilter !== 'all') {
        query = query.eq('statut', statusFilter);
      }

      if (searchTerm) {
        query = query.or(`nom.ilike.%${searchTerm}%,prenom.ilike.%${searchTerm}%`);
      }

      const { data, error: err } = await (query.order('date_creation', { ascending: false }) as any);

      if (err) throw err;
      setCases(data || []);
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

  const filteredCases = cases.filter((c) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      c.nom.toLowerCase().includes(searchLower) ||
      c.prenom.toLowerCase().includes(searchLower)
    );
  });

  const totalPages = Math.ceil(filteredCases.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedCases = filteredCases.slice(startIdx, startIdx + itemsPerPage);

  if (loading) {
    return (
      <NGOLayout title={t('ngo.casesTitle')}>
        <div className={styles['ngo-cases__loading-container']}>
          <div className={styles['ngo-cases__spinner']}></div>
          <p>{t('common.loading')}</p>
        </div>
      </NGOLayout>
    );
  }

  return (
    <NGOLayout title={t('ngo.casesTitle')}>
      <p className={styles['ngo-cases__subtitle']}>{t('ngo.casesSubtitle')}</p>

      {error && (
        <div className={styles['ngo-cases__error-message']}>
          ⚠️ {error}
        </div>
      )}

        <div className={styles['ngo-cases__controls']}>
          <input
            type="text"
            placeholder={t('common.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles['ngo-cases__search-input']}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className={styles['ngo-cases__filter-select']}
          >
            <option value="all">{t('common.allStatuses')}</option>
            <option value="active">{t('common.active')}</option>
            <option value="resolved">{t('ngo.resolved')}</option>
            <option value="closed">{t('ngo.closed')}</option>
          </select>
        </div>

        <Card>
          <CardBody>
            <div className={styles['ngo-cases__table']}>
              <div className={styles['ngo-cases__table-header']}>
                <div className={styles['ngo-cases__header-cell']}>{t('common.name')}</div>
                <div className={styles['ngo-cases__header-cell']}>{t('common.location')}</div>
                <div className={styles['ngo-cases__header-cell']}>{t('ngo.missingDate')}</div>
                <div className={styles['ngo-cases__header-cell']}>{t('common.status')}</div>
              </div>

              {paginatedCases.length > 0 ? (
                paginatedCases.map((c) => (
                  <div key={c.id} className={styles['ngo-cases__table-row']}>
                    <div className={styles['ngo-cases__table-cell']}>{c.nom} {c.prenom}</div>
                    <div className={styles['ngo-cases__table-cell']}>{c.localisation}</div>
                    <div className={styles['ngo-cases__table-cell']}>{new Date(c.date_disparition).toLocaleDateString('fr-FR')}</div>
                    <div className={styles['ngo-cases__table-cell']}>
                      <span
                        className={styles['ngo-cases__badge']}
                        style={{
                          backgroundColor: c.statut === 'active' ? '#ef4444' : c.statut === 'resolved' ? '#10b981' : '#9ca3af',
                        }}
                      >
                        {c.statut === 'active' ? t('common.active') : c.statut === 'resolved' ? t('ngo.resolved') : t('ngo.closed')}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles['ngo-cases__empty-state']}>
                  <p>{t('ngo.noCases')}</p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {totalPages > 1 && (
          <div className={styles['ngo-cases__pagination']}>
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={styles['ngo-cases__pagination-button']}
            >
              ← {t('common.previous')}
            </button>
            <span className={styles['ngo-cases__page-info']}>
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={styles['ngo-cases__pagination-button']}
            >
              {t('common.next')} →
            </button>
          </div>
        )}
    </NGOLayout>
  );
};
