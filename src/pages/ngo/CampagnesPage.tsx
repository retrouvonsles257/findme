import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, AlertTriangle, ChevronLeft, ChevronRight, Megaphone } from 'lucide-react';
import { useI18n } from '../../hooks';
import { getCampagnes } from '../../features/campagnes/services/campagneAPI';
import { NGOLayout } from './NGOLayout';
import { AdminCardsGridSkeleton } from '../admin/skeletons';
import styles from './CampagnesPage.module.css';

interface CampaignRow {
  id: string;
  titre: string;
  description: string | null;
  statut_campagne: 'planifiee' | 'en_cours' | 'terminee' | 'annulee';
  date_debut: string;
  date_fin: string | null;
  objectif: string | null;
  type_campagne?: string;
  budget_alloue?: number | null;
}

export interface NGOCampagnesPageProps {
  noLayout?: boolean;
  /** Base path for links (e.g. /admin when used from admin org). Default /ngo */
  basePath?: string;
}

export const NGOCampagnesPage: React.FC<NGOCampagnesPageProps> = ({ noLayout, basePath = '/ngo' }) => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'planifiee' | 'en_cours' | 'terminee' | 'annulee'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const itemsPerPage = 8;

  const loadCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await getCampagnes(1, 200, {
        statut: statusFilter === 'all' ? undefined : [statusFilter as any],
        search: searchTerm || undefined,
      } as any, 'date_debut', 'desc');

      setCampaigns((res.data || []) as any);
      setCurrentPage(1);
    } catch (err) {
      console.error('Erreur:', err);
      setError(t('common.errorLoadingData'));
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, t]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const totalPages = Math.ceil(campaigns.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedCampaigns = campaigns.slice(startIdx, startIdx + itemsPerPage);

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
    <div className={styles.ngoCampagnes}>
      <header className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <h1 className={styles.pageTitle}>
              <Megaphone size={24} />
              {t('ngo.campaignsTitle')}
            </h1>
            <p className={styles.pageSubtitle}>{t('ngo.campaignsSubtitle')}</p>
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => navigate(`${basePath}/campagnes/create`)}
            >
              <Plus size={18} />
              <span>{t('ngo.createCampaign')}</span>
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
              <option value="planifiee">{t('ngo.campaignStatus.planned')}</option>
              <option value="en_cours">{t('common.active')}</option>
              <option value="terminee">{t('ngo.campaignStatus.completed')}</option>
              <option value="annulee">{t('ngo.campaignStatus.cancelled')}</option>
            </select>
          </div>
        </div>
      </div>

      <div className={styles.cardsGrid}>
        {paginatedCampaigns.length > 0 ? (
          paginatedCampaigns.map((campaign) => (
            <div key={campaign.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>{campaign.titre}</h3>
                <span
                  className={styles.statusBadge}
                  data-status={campaign.statut_campagne}
                >
                  {campaign.statut_campagne === 'en_cours'
                    ? t('common.active')
                    : campaign.statut_campagne === 'terminee'
                      ? t('ngo.campaignStatus.completed')
                      : campaign.statut_campagne === 'planifiee'
                        ? t('ngo.campaignStatus.planned')
                        : t('ngo.campaignStatus.cancelled')}
                </span>
              </div>
              <p className={styles.cardDescription}>{campaign.description || '—'}</p>
              <div className={styles.cardMeta}>
                <small>
                  {new Date(campaign.date_debut).toLocaleDateString('fr-FR')}
                  {campaign.date_fin ? ` – ${new Date(campaign.date_fin).toLocaleDateString('fr-FR')}` : ''}
                </small>
              </div>
              <p className={styles.cardObjective}>
                {t('ngo.objective')}: <strong>{campaign.objectif || '—'}</strong>
              </p>
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>
            <p>{t('ngo.noCampaigns')}</p>
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
    </div>
  );
  if (noLayout) return content;
  return <NGOLayout>{content}</NGOLayout>;
};
