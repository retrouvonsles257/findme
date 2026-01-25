import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody } from '../../components/common/Card';
import { useI18n } from '../../hooks';
import { supabase } from '../../config/supabase.config';
import { NGOLayout } from './NGOLayout';
import styles from './CampagnesPage.module.css';

interface Campaign {
  id: string;
  titre: string;
  description: string;
  statut: 'active' | 'completed' | 'paused';
  date_debut: string;
  date_fin: string;
  objectif: number;
}

export const NGOCampagnesPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'paused'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const itemsPerPage = 8;

  const loadCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase.from('campagnes').select('*');

      if (statusFilter !== 'all') {
        query = query.eq('statut', statusFilter);
      }

      if (searchTerm) {
        query = query.or(`titre.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      const { data, error: err } = await (query.order('date_debut', { ascending: false }) as any);

      if (err) throw err;
      setCampaigns(data || []);
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

  const filteredCampaigns = campaigns.filter((c) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      c.titre.toLowerCase().includes(searchLower) ||
      c.description.toLowerCase().includes(searchLower)
    );
  });

  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedCampaigns = filteredCampaigns.slice(startIdx, startIdx + itemsPerPage);

  if (loading) {
    return (
      <NGOLayout title={t('ngo.campaignsTitle')}>
        <div className={styles['ngo-campagnes__loading-container']}>
          <div className={styles['ngo-campagnes__spinner']}></div>
          <p>{t('common.loading')}</p>
        </div>
      </NGOLayout>
    );
  }

  return (
    <NGOLayout title={t('ngo.campaignsTitle')}>
      <p className={styles['ngo-campagnes__subtitle']}>{t('ngo.campaignsSubtitle')}</p>

      {error && (
        <div className={styles['ngo-campagnes__error-message']}>
          ⚠️ {error}
        </div>
      )}

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
            <option value="active">{t('common.active')}</option>
            <option value="completed">{t('ngo.completed')}</option>
            <option value="paused">{t('ngo.paused')}</option>
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
                          backgroundColor: campaign.statut === 'active' ? '#10b981' : campaign.statut === 'completed' ? '#667eea' : '#f59e0b',
                        }}
                      >
                        {campaign.statut === 'active' ? t('common.active') : campaign.statut === 'completed' ? t('ngo.completed') : t('ngo.paused')}
                      </span>
                    </div>
                    <p className={styles['ngo-campagnes__description']}>{campaign.description}</p>
                    <div className={styles['ngo-campagnes__dates']}>
                      <small>{new Date(campaign.date_debut).toLocaleDateString('fr-FR')} - {new Date(campaign.date_fin).toLocaleDateString('fr-FR')}</small>
                    </div>
                    <div className={styles['ngo-campagnes__objective']}>
                      <p>{t('ngo.objective')}: <strong>{campaign.objectif}</strong></p>
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
    </NGOLayout>
  );
};
