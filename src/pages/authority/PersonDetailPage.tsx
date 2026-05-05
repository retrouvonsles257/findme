/**
 * Fiche personne — silo Autorité (contenu sans layout pour admin org : `noLayout` + `basePath`).
 * Ne pas dépendre de `pages/operator` : source pour `/authority/personnes/:id`.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { NomRole } from '../../@types/enums.types';
import { AuthorityLayout } from '../../components/layout';
import * as personneAPI from '../../features/personnes/services/personneAPI';
import * as dossierAPI from '../../features/dossiers/services/dossierAPI';
import type { Personne } from '../../features/personnes/types';
import type { DossierDisparition } from '../../@types/database.types';
import { AdminDetailSkeleton } from '../admin/skeletons';
import styles from './PersonDetailPage.module.css';

/** Format a date value for display; avoids rendering a Date object as React child. */
function safeFormatDate(value: unknown): string {
  if (value == null) return '—';
  if (value instanceof Date) return value.toLocaleDateString('fr-FR');
  if (typeof value === 'string') return value;
  return String(value);
}

export interface PersonDetailPageProps {
  noLayout?: boolean;
  /** `/authority` (défaut), `/admin` (admin org), ou `/operator` (legacy). */
  basePath?: string;
}

export const PersonDetailPage: React.FC<PersonDetailPageProps> = ({ noLayout = false, basePath = '/authority' }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const currentUser = useAppSelector(selectCurrentUser);

  const [personne, setPersonne] = useState<Personne | null>(null);
  const [dossiers, setDossiers] = useState<DossierDisparition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser && currentUser.role !== NomRole.AUTORITE && currentUser.role !== NomRole.ADMIN_SYSTEME) {
      navigate('/auth/login');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        const p = await personneAPI.getPersonneById(id);
        if (!p) {
          setPersonne(null);
          setDossiers([]);
          setError('Personne introuvable');
          return;
        }
        setPersonne(p);

        const { data } = await dossierAPI.getDossiers({
          personne_id: id,
          limit: 50,
          offset: 0,
          sortBy: 'date',
          sortOrder: 'desc',
        } as any);
        setDossiers(data as any);
      } catch (e: any) {
        setError(e?.message || 'Erreur lors du chargement');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  const title =
    (personne as any)?.nom_complet ||
    `${(personne as any)?.prenom || ''} ${(personne as any)?.nom || ''}`.trim() ||
    'Personne';

  const content = (
    <div className={styles.operatorPersonDetail}>
        {isLoading && (
          <div className={styles.operatorPersonDetail__skeletonWrap}>
            <AdminDetailSkeleton blockCount={3} linesPerBlock={4} />
          </div>
        )}
        {!isLoading && error && (
          <div className={styles.operatorPersonDetail__errorBanner} role="alert">
            <span>{error}</span>
          </div>
        )}

        {!isLoading && !error && personne && (
          <>
            <div className={styles.operatorPersonDetail__card}>
              <div className={styles.operatorPersonDetail__header}>
                <div>
                  <h2 className={styles.operatorPersonDetail__title}>{title}</h2>
                  <div className={styles.operatorPersonDetail__meta}>
                    {(personne as any).sexe || '—'}
                    {(personne as any).nationalite ? ` • ${(personne as any).nationalite}` : ''}
                  </div>
                </div>

                <div className={styles.operatorPersonDetail__btnRow}>
                  <button
                    className={`${styles.operatorPersonDetail__btn} ${styles.operatorPersonDetail__btnPrimary}`}
                    onClick={() => {
                      const pid = (personne as any).id;
                      if (basePath === '/admin') {
                        navigate(`${basePath}/cas/create?personneId=${pid}`);
                      } else if (basePath === '/authority') {
                        navigate(`${basePath}/dossiers/new?personneId=${pid}`);
                      } else {
                        navigate(`${basePath}/create-dossier?personneId=${pid}`);
                      }
                    }}
                  >
                    Créer un dossier avec cette personne
                  </button>
                  <button
                    className={styles.operatorPersonDetail__btn}
                    onClick={() => navigate(`${basePath}/personnes`)}
                  >
                    Retour liste
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.operatorPersonDetail__card}>
              <h3 className={styles.operatorPersonDetail__sectionTitle}>Identité</h3>
              <div className={styles.operatorPersonDetail__grid}>
                <div className={styles.operatorPersonDetail__kv}>
                  <p className={styles.operatorPersonDetail__k}>Nom</p>
                  <p className={styles.operatorPersonDetail__v}>{(personne as any).nom ?? '—'}</p>
                </div>
                <div className={styles.operatorPersonDetail__kv}>
                  <p className={styles.operatorPersonDetail__k}>Prénom</p>
                  <p className={styles.operatorPersonDetail__v}>{(personne as any).prenom ?? '—'}</p>
                </div>
                <div className={styles.operatorPersonDetail__kv}>
                  <p className={styles.operatorPersonDetail__k}>Nom complet</p>
                  <p className={styles.operatorPersonDetail__v}>{(personne as any).nom_complet ?? '—'}</p>
                </div>
                <div className={styles.operatorPersonDetail__kv}>
                  <p className={styles.operatorPersonDetail__k}>Alias</p>
                  <p className={styles.operatorPersonDetail__v}>{(personne as any).alias ?? '—'}</p>
                </div>
                <div className={styles.operatorPersonDetail__kv}>
                  <p className={styles.operatorPersonDetail__k}>Sexe</p>
                  <p className={styles.operatorPersonDetail__v}>{(personne as any).sexe ?? '—'}</p>
                </div>
                <div className={styles.operatorPersonDetail__kv}>
                  <p className={styles.operatorPersonDetail__k}>Date de naissance</p>
                  <p className={styles.operatorPersonDetail__v}>{safeFormatDate((personne as any).date_naissance)}</p>
                </div>
                <div className={styles.operatorPersonDetail__kv}>
                  <p className={styles.operatorPersonDetail__k}>Âge estimé</p>
                  <p className={styles.operatorPersonDetail__v}>
                    {(personne as any).age_estime_min != null ? (personne as any).age_estime_min : '—'}
                    {(personne as any).age_estime_max != null ? ` - ${(personne as any).age_estime_max}` : ''}
                  </p>
                </div>
                <div className={styles.operatorPersonDetail__kv}>
                  <p className={styles.operatorPersonDetail__k}>Nationalité</p>
                  <p className={styles.operatorPersonDetail__v}>{(personne as any).nationalite ?? '—'}</p>
                </div>
                <div className={styles.operatorPersonDetail__kv}>
                  <p className={styles.operatorPersonDetail__k}>Autres nationalités</p>
                  <p className={styles.operatorPersonDetail__v}>{(personne as any).autres_nationalites ?? '—'}</p>
                </div>
                <div className={styles.operatorPersonDetail__kv}>
                  <p className={styles.operatorPersonDetail__k}>Langue(s) parlée(s)</p>
                  <p className={styles.operatorPersonDetail__v}>{(personne as any).langue_parlee ?? '—'}</p>
                </div>
                <div className={styles.operatorPersonDetail__kv}>
                  <p className={styles.operatorPersonDetail__k}>N° identification</p>
                  <p className={styles.operatorPersonDetail__v}>{(personne as any).numero_identification ?? '—'}</p>
                </div>
                <div className={styles.operatorPersonDetail__kv}>
                  <p className={styles.operatorPersonDetail__k}>Type identification</p>
                  <p className={styles.operatorPersonDetail__v}>{(personne as any).type_identification ?? '—'}</p>
                </div>
                <div className={styles.operatorPersonDetail__kv}>
                  <p className={styles.operatorPersonDetail__k}>Statut identité</p>
                  <p className={styles.operatorPersonDetail__v}>{(personne as any).statut_identite ?? '—'}</p>
                </div>
                <div className={styles.operatorPersonDetail__kv}>
                  <p className={styles.operatorPersonDetail__k}>Fiabilité des informations</p>
                  <p className={styles.operatorPersonDetail__v}>{(personne as any).fiabilite_informations ?? '—'}</p>
                </div>
                <div className={styles.operatorPersonDetail__kv}>
                  <p className={styles.operatorPersonDetail__k}>Situation familiale</p>
                  <p className={styles.operatorPersonDetail__v}>{(personne as any).situation_familiale ?? '—'}</p>
                </div>
                <div className={styles.operatorPersonDetail__kv}>
                  <p className={styles.operatorPersonDetail__k}>Nombre d'enfants</p>
                  <p className={styles.operatorPersonDetail__v}>{(personne as any).nombre_enfants != null ? (personne as any).nombre_enfants : '—'}</p>
                </div>
              </div>
            </div>

            <div className={styles.operatorPersonDetail__card}>
              <h3 className={styles.operatorPersonDetail__sectionTitle}>Description physique</h3>
              <div className={styles.operatorPersonDetail__grid}>
                <div className={styles.operatorPersonDetail__kv}>
                  <p className={styles.operatorPersonDetail__k}>Taille (cm)</p>
                  <p className={styles.operatorPersonDetail__v}>{(personne as any).taille_cm != null ? (personne as any).taille_cm : '—'}</p>
                </div>
                <div className={styles.operatorPersonDetail__kv}>
                  <p className={styles.operatorPersonDetail__k}>Poids (kg)</p>
                  <p className={styles.operatorPersonDetail__v}>{(personne as any).poids_kg != null ? (personne as any).poids_kg : '—'}</p>
                </div>
                <div className={styles.operatorPersonDetail__kv}>
                  <p className={styles.operatorPersonDetail__k}>Corpulence</p>
                  <p className={styles.operatorPersonDetail__v}>{(personne as any).corpulence ?? '—'}</p>
                </div>
                <div className={styles.operatorPersonDetail__kv}>
                  <p className={styles.operatorPersonDetail__k}>Couleur de peau</p>
                  <p className={styles.operatorPersonDetail__v}>{(personne as any).couleur_peau ?? '—'}</p>
                </div>
                <div className={styles.operatorPersonDetail__kv}>
                  <p className={styles.operatorPersonDetail__k}>Couleur des cheveux</p>
                  <p className={styles.operatorPersonDetail__v}>{(personne as any).couleur_cheveux ?? '—'}</p>
                </div>
                <div className={styles.operatorPersonDetail__kv}>
                  <p className={styles.operatorPersonDetail__k}>Type de cheveux</p>
                  <p className={styles.operatorPersonDetail__v}>{(personne as any).type_cheveux ?? '—'}</p>
                </div>
                <div className={styles.operatorPersonDetail__kv}>
                  <p className={styles.operatorPersonDetail__k}>Couleur des yeux</p>
                  <p className={styles.operatorPersonDetail__v}>{(personne as any).couleur_yeux ?? '—'}</p>
                </div>
                <div className={styles.operatorPersonDetail__kv}>
                  <p className={styles.operatorPersonDetail__k}>Signes distinctifs</p>
                  <p className={styles.operatorPersonDetail__v}>{(personne as any).signes_distinctifs ?? '—'}</p>
                </div>
                <div className={styles.operatorPersonDetail__kv}>
                  <p className={styles.operatorPersonDetail__k}>Handicaps / maladies</p>
                  <p className={styles.operatorPersonDetail__v}>{(personne as any).handicaps_maladies ?? '—'}</p>
                </div>
                <div className={styles.operatorPersonDetail__kv}>
                  <p className={styles.operatorPersonDetail__k}>Groupe sanguin</p>
                  <p className={styles.operatorPersonDetail__v}>{(personne as any).groupe_sanguin ?? '—'}</p>
                </div>
                <div className={styles.operatorPersonDetail__kv}>
                  <p className={styles.operatorPersonDetail__k}>Derniers vêtements portés</p>
                  <p className={styles.operatorPersonDetail__v}>{(personne as any).derniers_vetements_portes ?? '—'}</p>
                </div>
                <div className={styles.operatorPersonDetail__kv}>
                  <p className={styles.operatorPersonDetail__k}>Accessoires</p>
                  <p className={styles.operatorPersonDetail__v}>{(personne as any).accessoires ?? '—'}</p>
                </div>
              </div>
              {(personne as any).description_physique && (
                <div style={{ marginTop: '0.75rem' }}>
                  <p className={styles.operatorPersonDetail__k}>Description physique (texte)</p>
                  <p className={styles.operatorPersonDetail__v}>{(personne as any).description_physique}</p>
                </div>
              )}
            </div>

            <div className={styles.operatorPersonDetail__card}>
              <h3 className={styles.operatorPersonDetail__sectionTitle}>Dossiers liés</h3>
              {dossiers.length === 0 ? (
                <div className={styles.operatorPersonDetail__state}>Aucun dossier lié pour l’instant.</div>
              ) : (
                <div className={styles.operatorPersonDetail__list}>
                  {dossiers.map((d: any) => (
                    <div
                      key={d.id}
                      className={styles.operatorPersonDetail__listItem}
                      onClick={() => navigate(`${basePath}/dossiers/${d.id}`)}
                      role="button"
                      tabIndex={0}
                    >
                      <strong>{d.numero_dossier || `DOS-${String(d.id).slice(0, 6)}`}</strong>
                      <div className={styles.operatorPersonDetail__meta}>
                        {d.statut_dossier} • {d.ville_disparition || d.lieu_disparition || '—'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

export default PersonDetailPage;

