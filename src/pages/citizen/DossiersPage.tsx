/**
 * =====================================================
 * RETROUVONSLES - Citizen Dossiers Page
 * Liste des dossiers publics visibles par le citoyen (cards)
 * Depuis un dossier, le citoyen peut créer un signalement lié (id_dossier)
 * =====================================================
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useI18n } from '../../hooks';
import { supabase } from '../../config';
import { CitizenLayout } from './CitizenLayout';
import { Search, Filter, MapPin, Calendar, Eye, MessageSquare, AlertCircle } from 'lucide-react';
import { AdminListSkeleton } from 'components/skeletons';
import styles from './DossiersPage.module.css';
import { StatutDossier } from '../../@types/enums.types';

interface PublicDossier {
  id: string;
  numero_dossier?: string | null;
  date_disparition: string;
  statut_dossier: string;
  niveau_urgence?: string | number | null;
  type_disparition?: string | null;
  circonstances?: string | null;
  lieu_disparition?: string | null;
  ville_disparition?: string | null;
  region_disparition?: string | null;
  pays_disparition?: string | null;
  visible_public?: boolean | null;
  id_personne?: string | null;
  personne?: {
    nom_complet?: string | null;
    nom?: string | null;
    prenom?: string | null;
    photo_principale?: string | null;
    sexe?: string | null;
    date_naissance?: string | null;
    age_estime_min?: number | null;
    age_estime_max?: number | null;
    description_physique?: string | null;
    signes_distinctifs?: string | null;
    derniers_vetements_portes?: string | null;
  } | null;
}

type StatusFilter = 'all' | 'en_cours' | 'resolved' | 'closed';

export const CitizenDossiersPage: React.FC = () => {
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [dossiers, setDossiers] = useState<PublicDossier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  const itemsPerPage = 12;
  const [page, setPage] = useState(1);

  const reportMode = useMemo(() => searchParams.get('mode') === 'report', [searchParams]);

  const loadDossiers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      let query: any = (supabase as any)
        .from('dossier_disparition')
        .select(
          `
          id,
          numero_dossier,
          date_disparition,
          statut_dossier,
          niveau_urgence,
          type_disparition,
          circonstances,
          lieu_disparition,
          ville_disparition,
          region_disparition,
          pays_disparition,
          visible_public,
          id_personne,
          personne:id_personne (
            nom_complet,
            nom,
            prenom,
            photo_principale,
            sexe,
            date_naissance,
            age_estime_min,
            age_estime_max,
            description_physique,
            signes_distinctifs,
            derniers_vetements_portes
          )
        `,
        )
        .eq('visible_public', true)
        .order('date_disparition', { ascending: false })
        .limit(500);

      // Filtre statut (côté DB)
      if (statusFilter === 'en_cours') {
        query = query.eq('statut_dossier', StatutDossier.EN_COURS);
      } else if (statusFilter === 'resolved') {
        query = query.in('statut_dossier', [StatutDossier.RETROUVE_VIVANT, StatutDossier.RETROUVE_DECEDE]);
      } else if (statusFilter === 'closed') {
        query = query.in('statut_dossier', [StatutDossier.SUSPENDU, StatutDossier.CLASSE_SANS_SUITE, StatutDossier.TRANSFERE]);
      }

      const { data, error: err } = await query;
      if (err) throw err;

      setDossiers((data || []) as PublicDossier[]);
      setPage(1);
    } catch (e: any) {
      setError(e?.message || 'Erreur lors du chargement des dossiers');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadDossiers();
  }, [loadDossiers]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const loc = locationFilter.trim().toLowerCase();

    return dossiers.filter((d) => {
      const nom = (d.personne?.nom_complet || `${d.personne?.prenom || ''} ${d.personne?.nom || ''}`.trim() || '').toLowerCase();
      const desc = (d.circonstances || '').toLowerCase();
      const matchesTerm = term ? nom.includes(term) || desc.includes(term) : true;

      const localisation = [d.lieu_disparition, d.ville_disparition, d.region_disparition, d.pays_disparition]
        .filter(Boolean)
        .join(', ')
        .toLowerCase();
      const matchesLoc = loc ? localisation.includes(loc) : true;

      return matchesTerm && matchesLoc;
    });
  }, [dossiers, searchTerm, locationFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const startIdx = (page - 1) * itemsPerPage;
  const paginated = filtered.slice(startIdx, startIdx + itemsPerPage);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const getAgeDisplay = (d: PublicDossier) => {
    const p = d.personne;
    if (p?.date_naissance) {
      const age = Math.max(0, Math.floor((Date.now() - new Date(p.date_naissance).getTime()) / 31557600000));
      return `${age} ${language === 'fr' ? 'ans' : 'years'}`;
    }
    const min = p?.age_estime_min ?? null;
    const max = p?.age_estime_max ?? null;
    if (typeof min === 'number' && typeof max === 'number' && min !== max) return `${min}-${max} ${language === 'fr' ? 'ans' : 'years'}`;
    if (typeof min === 'number') return `${min} ${language === 'fr' ? 'ans' : 'years'}`;
    return language === 'fr' ? 'Âge inconnu' : 'Unknown age';
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case StatutDossier.EN_COURS:
        return language === 'fr' ? 'En cours' : 'In progress';
      case StatutDossier.RETROUVE_VIVANT:
      case StatutDossier.RETROUVE_DECEDE:
        return language === 'fr' ? 'Retrouvé' : 'Resolved';
      case StatutDossier.SUSPENDU:
      case StatutDossier.CLASSE_SANS_SUITE:
      case StatutDossier.TRANSFERE:
        return language === 'fr' ? 'Archivé' : 'Closed';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case StatutDossier.EN_COURS:
        return '#ef4444';
      case StatutDossier.RETROUVE_VIVANT:
        return '#0284c7';
      case StatutDossier.RETROUVE_DECEDE:
        return '#6b7280';
      case StatutDossier.SUSPENDU:
      case StatutDossier.CLASSE_SANS_SUITE:
      case StatutDossier.TRANSFERE:
        return '#9ca3af';
      default:
        return '#6b7280';
    }
  };

  const handleOpenDossier = (id: string) => navigate(`/citizen/dossier/${id}`);
  const handleReport = (id: string) => navigate(`/citizen/new-signalement?dossierId=${id}`);

  return (
    <CitizenLayout activeNav="dossiers">
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>{t('citizen.dossiers')}</h1>
            <p className={styles.subtitle}>
              {reportMode
                ? (t('citizen.selectDossier') || 'Choisissez un dossier pour signaler')
                : (t('citizen.lastSeen') || 'Dossiers publics')}
            </p>
          </div>
        </div>

        <div className={styles.filters}>
          <div className={styles.searchBox}>
            <Search size={18} />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('citizen.searchPlaceholder') || 'Rechercher...'}
            />
          </div>

          <div className={styles.searchBox}>
            <MapPin size={18} />
            <input
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              placeholder={t('public.filters.location') || 'Ville / Région'}
            />
          </div>

          <div className={styles.selectBox}>
            <Filter size={18} />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}>
              <option value="all">{t('common.allItems') || 'Tous'}</option>
              <option value="en_cours">{t('citizen.inProgress') || 'En cours'}</option>
              <option value="resolved">{t('citizen.resolved') || 'Retrouvé'}</option>
              <option value="closed">{t('citizen.archived') || 'Archivé'}</option>
            </select>
          </div>
        </div>

        {error && (
          <div className={styles.error}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className={styles.skeletonWrap}>
            <AdminListSkeleton cardCount={6} showFilters={true} />
          </div>
        ) : (
          <>
            {paginated.length === 0 ? (
              <div className={styles.empty}>
                <p>{t('citizen.noResultsFound') || 'Aucun résultat'}</p>
              </div>
            ) : (
              <div className={styles.grid}>
                {paginated.map((d) => {
                  const p = d.personne || {};
                  const title =
                    p.nom_complet || `${p.prenom || ''} ${p.nom || ''}`.trim() || d.numero_dossier || '—';
                  const photo = p.photo_principale || null;
                  const localisation = [d.lieu_disparition, d.ville_disparition, d.region_disparition]
                    .filter(Boolean)
                    .join(', ');
                  const canReport = d.statut_dossier === StatutDossier.EN_COURS;
                  return (
                    <div key={d.id} className={styles.card}>
                      <div className={styles.cardMedia}>
                        {photo ? (
                          <img src={photo} alt={title} />
                        ) : (
                          <div className={styles.cardPlaceholder} />
                        )}
                        <span className={styles.statusBadge} style={{ backgroundColor: getStatusColor(d.statut_dossier) }}>
                          {getStatusLabel(d.statut_dossier)}
                        </span>
                      </div>

                      <div className={styles.cardBody}>
                        <div className={styles.cardTitleRow}>
                          <h3 className={styles.cardTitle}>{title}</h3>
                          <span className={styles.cardAge}>{getAgeDisplay(d)}</span>
                        </div>

                        <div className={styles.meta}>
                          <span title={localisation}>
                            <MapPin size={14} /> {localisation || '—'}
                          </span>
                          <span>
                            <Calendar size={14} /> {formatDate(d.date_disparition)}
                          </span>
                        </div>

                        <div className={styles.cardContent}>
                          {d.circonstances && (
                            <p className={styles.desc}>
                              {d.circonstances.length > 120 ? `${d.circonstances.slice(0, 120)}…` : d.circonstances}
                            </p>
                          )}
                        </div>

                        <div className={styles.actions}>
                          <button type="button" className={styles.btn} onClick={() => handleOpenDossier(d.id)}>
                            <Eye size={16} /> {t('citizen.viewShort') || 'Voir'}
                          </button>
                          <button type="button" className={styles.btnPrimary} onClick={() => handleReport(d.id)} disabled={!canReport}>
                            <MessageSquare size={16} /> {t('citizen.reportShort') || 'Signaler'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className={styles.pagination}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                ‹
              </button>
              <span>
                {page} / {totalPages}
              </span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                ›
              </button>
            </div>
          </>
        )}
      </div>
    </CitizenLayout>
  );
};

