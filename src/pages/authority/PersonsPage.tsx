/**
 * Liste des personnes — espace Autorité (contenu sans layout pour admin org via `noLayout` + `basePath`).
 * Source de vérité pour `/authority/personnes`.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { NomRole } from '../../@types/enums.types';
import { AuthorityLayout } from '../../components/layout';
import * as personneAPI from '../../features/personnes/services/personneAPI';
import type { Personne } from '../../features/personnes/types';
import { AdminListSkeleton } from 'components/skeletons';
import styles from './PersonsPage.module.css';

const PAGE_SIZE = 20;

export interface PersonsPageProps {
  noLayout?: boolean;
  /** `/authority` (défaut) ou `/admin` pour l’admin organisation. */
  basePath?: string;
}

export const PersonsPage: React.FC<PersonsPageProps> = ({ noLayout = false, basePath = '/authority' }) => {
  const navigate = useNavigate();
  const currentUser = useAppSelector(selectCurrentUser);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Personne[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  useEffect(() => {
    if (currentUser && currentUser.role !== NomRole.AUTORITE && currentUser.role !== NomRole.ADMIN_SYSTEME) {
      navigate('/auth/login');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    const handle = window.setTimeout(async () => {
      try {
        setIsLoading(true);
        setError(null);
        const { data, total: count } = await personneAPI.getPersonnes(
          { search: search.trim() || undefined },
          page,
          PAGE_SIZE,
        );
        setItems(data);
        setTotal(count);
      } catch (e: any) {
        setError(e?.message || 'Erreur lors du chargement des personnes');
        setItems([]);
        setTotal(0);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(handle);
  }, [search, page]);

  const content = (
    <div className={styles.authorityPersons}>
      <div className={styles.authorityPersons__toolbar}>
        <div className={styles.authorityPersons__search}>
          <input
            className={styles.authorityPersons__searchInput}
            placeholder="Rechercher (nom, prénom, description...)"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {basePath === '/authority' && (
          <button
            type="button"
            className={styles.authorityPersons__primaryBtn}
            onClick={() => navigate(`${basePath}/create-person`)}
          >
            Créer une personne
          </button>
        )}
      </div>

      {isLoading && (
        <div className={styles.authorityPersons__skeletonWrap}>
          <AdminListSkeleton cardCount={6} showFilters={true} />
        </div>
      )}
      {!isLoading && error && (
        <div className={styles.authorityPersons__errorBanner} role="alert">
          <span>{error}</span>
        </div>
      )}

      {!isLoading && !error && (
        <>
          <div className={styles.authorityPersons__grid}>
            {items.map((p) => {
              const label =
                (p as any).nom_complet ||
                `${(p as any).prenom || ''} ${(p as any).nom || ''}`.trim() ||
                'Sans nom';
              return (
                <div
                  key={(p as any).id}
                  className={styles.authorityPersons__card}
                  onClick={() => navigate(`${basePath}/personnes/${(p as any).id}`)}
                  role="button"
                  tabIndex={0}
                >
                  <p className={styles.authorityPersons__name}>{label}</p>
                  <div className={styles.authorityPersons__meta}>
                    {(p as any).sexe || '—'}
                    {(p as any).age_estime_min ? ` • ~${(p as any).age_estime_min} ans` : ''}
                    {(p as any).nationalite ? ` • ${(p as any).nationalite}` : ''}
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.authorityPersons__pagination}>
            <button
              type="button"
              className={styles.authorityPersons__pageBtn}
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Précédent
            </button>
            <div className={styles.authorityPersons__meta}>
              Page {page} / {totalPages} • {total} résultat(s)
            </div>
            <button
              type="button"
              className={styles.authorityPersons__pageBtn}
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Suivant
            </button>
          </div>
        </>
      )}
    </div>
  );

  if (noLayout) return content;
  if (basePath === '/authority') {
    return <AuthorityLayout>{content}</AuthorityLayout>;
  }
  return content;
};

export default PersonsPage;
