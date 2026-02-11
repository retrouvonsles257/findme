import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody } from '../../components/common/Card';
import { useI18n } from '../../hooks';
import { getCampagnes } from '../../features/campagnes/services/campagneAPI';
import { NGOLayout } from './NGOLayout';
import { AdminListSkeleton } from '../admin/skeletons';
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
    <div className={styles['ngo-campagnes__skeletonWrap']}>
      <AdminListSkeleton cardCount={6} showFilters={false} />
    </div>
  );
  if (loading) {
    if (noLayout) return loadingContent;
    return <NGOLayout title={t('ngo.campaignsTitle')}>{loadingContent}</NGOLayout>;
  }

  const content = (
    <div>
      <p className={styles['ngo-campagnes__subtitle']}>{t('ngo.campaignsSubtitle')}</p>

      {error && (
        <div className={styles['ngo-campagnes__error-banner']} role="alert">
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button
          type="button"
          onClick={() => navigate(`${basePath}/campagnes/create`)}
          style={{
            padding: '10px 12px',
            borderRadius: 10,
            border: 'none',
            background: '#2563eb',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          Créer une campagne
        </button>
      </div>

        <div className={styles['ngo-campagnes__controls']}>
          <input
            type="text"
            placeholder={t('common.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles['ngo-campagnes__search-input']}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className={styles['ngo-campagnes__filter-select']}
          >
            <option value="all">{t('common.allStatuses')}</option>
            <option value="planifiee">Planifiée</option>
            <option value="en_cours">{t('common.active')}</option>
            <option value="terminee">Terminée</option>
            <option value="annulee">Annulée</option>
          </select>
        </div>

        <div className={styles['ngo-campagnes__campaigns-grid']}>
          {paginatedCampaigns.length > 0 ? (
            paginatedCampaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardBody>
                  <div className={styles['ngo-campagnes__campaign-card']}>
                    <div className={styles['ngo-campagnes__campaign-header']}>
                      <h3>{campaign.titre}</h3>
                      <span
                        className={styles['ngo-campagnes__badge']}
                        style={{
                          backgroundColor:
                            campaign.statut_campagne === 'en_cours'
                              ? '#10b981'
                              : campaign.statut_campagne === 'terminee'
                                ? '#667eea'
                                : campaign.statut_campagne === 'planifiee'
                                  ? '#f59e0b'
                                  : '#ef4444',
                        }}
                      >
                        {campaign.statut_campagne === 'en_cours'
                          ? t('common.active')
                          : campaign.statut_campagne === 'terminee'
                            ? 'Terminée'
                            : campaign.statut_campagne === 'planifiee'
                              ? 'Planifiée'
                              : 'Annulée'}
                      </span>
                    </div>
                    <p className={styles['ngo-campagnes__description']}>{campaign.description || '—'}</p>
                    <div className={styles['ngo-campagnes__dates']}>
                      <small>
                        {new Date(campaign.date_debut).toLocaleDateString('fr-FR')}
                        {campaign.date_fin ? ` - ${new Date(campaign.date_fin).toLocaleDateString('fr-FR')}` : ''}
                      </small>
                    </div>
                    <div className={styles['ngo-campagnes__objective']}>
                      <p>
                        {t('ngo.objective')}: <strong>{campaign.objectif || '—'}</strong>
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))
          ) : (
            <div className={styles['ngo-campagnes__empty-state']}>
              <p>{t('ngo.noCampaigns')}</p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className={styles['ngo-campagnes__pagination']}>
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={styles['ngo-campagnes__pagination-button']}
            >
              ← {t('common.previous')}
            </button>
            <span className={styles['ngo-campagnes__page-info']}>
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={styles['ngo-campagnes__pagination-button']}
            >
              {t('common.next')} →
            </button>
          </div>
        )}
    </div>
  );
  if (noLayout) return content;
  return <NGOLayout title={t('ngo.campaignsTitle')}>{content}</NGOLayout>;
};
