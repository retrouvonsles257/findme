import React, { useEffect, useState, useCallback } from 'react';
import { Search, AlertTriangle, ChevronLeft, ChevronRight, Handshake } from 'lucide-react';
import { useI18n } from '../../hooks';
import { NGOLayout } from './NGOLayout';
import { getPartenariatsOrganisation } from '../../features/admin-organisation/services';
import { AdminTableSkeleton } from '../admin/skeletons';
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
  const noOrganisation = organisationId === undefined || organisationId === null;

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
    <div className={styles.skeletonWrap}>
      <AdminTableSkeleton columns={5} rows={8} />
    </div>
  );
  if (loading) {
    if (noLayout) return loadingContent;
    return <NGOLayout>{loadingContent}</NGOLayout>;
  }

  const content = (
    <div className={styles.ngoPartnerships}>
      <header className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <h1 className={styles.pageTitle}>
              <Handshake size={24} />
              {t('ngo.partnershipsTitle')}
            </h1>
            <p className={styles.pageSubtitle}>{t('ngo.partnershipsSubtitle')}</p>
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
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className={styles.select}
                >
                  <option value="all">{t('common.allStatuses')}</option>
                  <option value="active">{t('common.active')}</option>
                  <option value="inactive">{t('common.inactive')}</option>
                  <option value="pending">{t('common.pending')}</option>
                </select>
              </div>
            </div>
          </div>

          <div className={styles.tableContainer}>
            <div className={styles.table}>
              <div className={styles.tableHeader}>
                <div className={styles.headerCell}>{t('ngo.organisation')}</div>
                <div className={styles.headerCell}>{t('ngo.contactPerson')}</div>
                <div className={styles.headerCell}>{t('common.email')}</div>
                <div className={styles.headerCell}>{t('common.phone')}</div>
                <div className={styles.headerCell}>{t('common.status')}</div>
              </div>
              {paginatedPartnerships.length > 0 ? (
                paginatedPartnerships.map((partnership) => (
                  <div key={partnership.id} className={styles.tableRow}>
                    <div className={styles.tableCell}>{partnership.organisation_name}</div>
                    <div className={styles.tableCell}>{partnership.contact_person}</div>
                    <div className={styles.tableCell}>{partnership.email}</div>
                    <div className={styles.tableCell}>{partnership.phone}</div>
                    <div className={styles.tableCell}>
                      <span className={styles.statusBadge} data-status={partnership.statut}>
                        {partnership.statut === 'active' ? t('common.active') : partnership.statut === 'inactive' ? t('common.inactive') : t('common.pending')}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>
                  <p>{t('ngo.noPartnerships')}</p>
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
