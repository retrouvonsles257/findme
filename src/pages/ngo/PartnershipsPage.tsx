import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardBody } from '../../components/common/Card';
import { useI18n } from '../../hooks';
import { NGOLayout } from './NGOLayout';
import { getPartenariatsOrganisation } from '../../features/admin-organisation/services';
import styles from './PartnershipsPage.module.css';

interface Partnership {
  id: string;
  organisation_name: string;
  contact_person: string;
  email: string;
  phone: string;
  statut: 'active' | 'inactive' | 'pending';
  date_partnership: string;
}

export interface NGOPartnershipsPageProps {
  noLayout?: boolean;
  /** Quand fourni (contexte admin org), charge les partenariats depuis partenariat_organisation */
  organisationId?: string | null;
}

export const NGOPartnershipsPage: React.FC<NGOPartnershipsPageProps> = ({ noLayout, organisationId }) => {
  const { t } = useI18n();
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const itemsPerPage = 10;

  const loadPartnerships = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (organisationId) {
        const rows = await getPartenariatsOrganisation(organisationId);
        setPartnerships(
          rows.map((p) => ({
            id: p.id,
            organisation_name: p.nom_partenaire,
            contact_person: p.personne_contact ?? '',
            email: p.email ?? '',
            phone: p.telephone ?? '',
            statut: p.statut,
            date_partnership: p.date_partnership ?? '',
          }))
        );
      } else {
        setPartnerships([]);
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
    loadPartnerships();
  }, [loadPartnerships]);

  const filteredPartnerships = partnerships.filter((p) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      p.organisation_name.toLowerCase().includes(searchLower) ||
      (p.contact_person && p.contact_person.toLowerCase().includes(searchLower));
    const matchesStatus = statusFilter === 'all' || p.statut === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredPartnerships.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedPartnerships = filteredPartnerships.slice(startIdx, startIdx + itemsPerPage);

  const loadingContent = (
    <div className={styles['ngo-partnerships__loading-container']}>
      <div className={styles['ngo-partnerships__spinner']}></div>
      <p>{t('common.loading')}</p>
    </div>
  );
  if (loading) {
    if (noLayout) return loadingContent;
    return <NGOLayout title={t('ngo.partnershipsTitle')}>{loadingContent}</NGOLayout>;
  }

  const content = (
    <div>
      <p className={styles['ngo-partnerships__subtitle']}>{t('ngo.partnershipsSubtitle')}</p>

      {error && (
        <div className={styles['ngo-partnerships__error-message']}>
          ⚠️ {error}
        </div>
      )}

        <div className={styles['ngo-partnerships__controls']}>
          <input
            type="text"
            placeholder={t('common.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles['ngo-partnerships__search-input']}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className={styles['ngo-partnerships__filter-select']}
          >
            <option value="all">{t('common.allStatuses')}</option>
            <option value="active">{t('common.active')}</option>
            <option value="inactive">{t('common.inactive')}</option>
            <option value="pending">{t('common.pending')}</option>
          </select>
        </div>

        <Card>
          <CardBody>
            <div className={styles['ngo-partnerships__table']}>
              <div className={styles['ngo-partnerships__table-header']}>
                <div className={styles['ngo-partnerships__header-cell']}>{t('ngo.organisation')}</div>
                <div className={styles['ngo-partnerships__header-cell']}>{t('ngo.contactPerson')}</div>
                <div className={styles['ngo-partnerships__header-cell']}>{t('common.email')}</div>
                <div className={styles['ngo-partnerships__header-cell']}>{t('common.phone')}</div>
                <div className={styles['ngo-partnerships__header-cell']}>{t('common.status')}</div>
              </div>

              {paginatedPartnerships.length > 0 ? (
                paginatedPartnerships.map((partnership) => (
                  <div key={partnership.id} className={styles['ngo-partnerships__table-row']}>
                    <div className={styles['ngo-partnerships__table-cell']}>{partnership.organisation_name}</div>
                    <div className={styles['ngo-partnerships__table-cell']}>{partnership.contact_person}</div>
                    <div className={styles['ngo-partnerships__table-cell']}>{partnership.email}</div>
                    <div className={styles['ngo-partnerships__table-cell']}>{partnership.phone}</div>
                    <div className={styles['ngo-partnerships__table-cell']}>
                      <span
                        className={styles['ngo-partnerships__badge']}
                        style={{
                          backgroundColor: partnership.statut === 'active' ? '#10b981' : partnership.statut === 'inactive' ? '#ef4444' : '#f59e0b',
                        }}
                      >
                        {partnership.statut === 'active' ? t('common.active') : partnership.statut === 'inactive' ? t('common.inactive') : t('common.pending')}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles['ngo-partnerships__empty-state']}>
                  <p>{t('ngo.noPartnerships')}</p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {totalPages > 1 && (
          <div className={styles['ngo-partnerships__pagination']}>
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={styles['ngo-partnerships__pagination-button']}
            >
              ← {t('common.previous')}
            </button>
            <span className={styles['ngo-partnerships__page-info']}>
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={styles['ngo-partnerships__pagination-button']}
            >
              {t('common.next')} →
            </button>
          </div>
        )}
    </div>
  );
  if (noLayout) return content;
  return <NGOLayout title={t('ngo.partnershipsTitle')}>{content}</NGOLayout>;
};
