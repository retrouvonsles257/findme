import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody } from '../../components/common/Card';
import { useI18n } from '../../hooks';
import { supabase } from '../../config';
import { StatutDossier } from '../../@types/enums.types';
import { NGOLayout } from './NGOLayout';
import styles from './CasesPage.module.css';

interface CaseRow {
  id: string;
  nom_complet: string;
  localisation: string;
  statut_dossier: string;
  date_disparition: string;
}

export const NGOCasesPage: React.FC = () => {
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

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button
          type="button"
          onClick={() => navigate('/ngo/cases/create')}
          style={{
            padding: '10px 12px',
            borderRadius: 10,
            border: 'none',
            background: '#2563eb',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          Créer un dossier
        </button>
      </div>

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
                    <div className={styles['ngo-cases__table-cell']}>{c.nom_complet}</div>
                    <div className={styles['ngo-cases__table-cell']}>{c.localisation}</div>
                    <div className={styles['ngo-cases__table-cell']}>{new Date(c.date_disparition).toLocaleDateString('fr-FR')}</div>
                    <div className={styles['ngo-cases__table-cell']}>
                      <span
                        className={styles['ngo-cases__badge']}
                        style={{
                          backgroundColor:
                            c.statut_dossier === StatutDossier.EN_COURS
                              ? '#ef4444'
                              : [StatutDossier.RETROUVE_VIVANT, StatutDossier.RETROUVE_DECEDE].includes(c.statut_dossier as any)
                                ? '#10b981'
                                : '#9ca3af',
                        }}
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
