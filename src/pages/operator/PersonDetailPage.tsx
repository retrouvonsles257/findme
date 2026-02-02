/**
 * =====================================================
 * RETROUVONSLES - Operator Person Detail Page
 * Page dédiée à une personne (sinon "Créer une personne" mène nulle part)
 * =====================================================
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { OperatorLayout } from './OperatorLayout';
import * as personneAPI from '../../features/personnes/services/personneAPI';
import * as dossierAPI from '../../features/dossiers/services/dossierAPI';
import type { Personne } from '../../features/personnes/types';
import type { DossierDisparition } from '../../@types/database.types';
import styles from './PersonDetailPage.module.css';

export const OperatorPersonDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const currentUser = useAppSelector(selectCurrentUser);

  const [personne, setPersonne] = useState<Personne | null>(null);
  const [dossiers, setDossiers] = useState<DossierDisparition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser && !['operateur_saisie', 'admin_organisation'].includes(currentUser.role)) {
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

  return (
    <OperatorLayout title={title}>
      <div className={styles.operatorPersonDetail}>
        {error && <div className={styles.operatorPersonDetail__state}>{error}</div>}
        {isLoading && <div className={styles.operatorPersonDetail__state}>Chargement…</div>}

        {!isLoading && personne && (
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
                    onClick={() => navigate(`/operator/create-dossier?personneId=${(personne as any).id}`)}
                  >
                    Créer un dossier avec cette personne
                  </button>
                  <button
                    className={styles.operatorPersonDetail__btn}
                    onClick={() => navigate('/operator/personnes')}
                  >
                    Retour liste
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.operatorPersonDetail__card}>
              <h3 className={styles.operatorPersonDetail__sectionTitle}>Informations</h3>
              <div className={styles.operatorPersonDetail__grid}>
                <div className={styles.operatorPersonDetail__kv}>
                  <p className={styles.operatorPersonDetail__k}>Âge estimé</p>
                  <p className={styles.operatorPersonDetail__v}>
                    {(personne as any).age_estime_min || '—'}
                    {(personne as any).age_estime_max ? ` - ${(personne as any).age_estime_max}` : ''}
                  </p>
                </div>
                <div className={styles.operatorPersonDetail__kv}>
                  <p className={styles.operatorPersonDetail__k}>Statut identité</p>
                  <p className={styles.operatorPersonDetail__v}>{(personne as any).statut_identite || '—'}</p>
                </div>
                <div className={styles.operatorPersonDetail__kv}>
                  <p className={styles.operatorPersonDetail__k}>Fiabilité</p>
                  <p className={styles.operatorPersonDetail__v}>{(personne as any).fiabilite_informations || '—'}</p>
                </div>
              </div>
              {(personne as any).description_physique && (
                <div style={{ marginTop: '0.75rem' }}>
                  <p className={styles.operatorPersonDetail__k}>Description</p>
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
                      onClick={() => navigate(`/operator/dossiers/${d.id}`)}
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
    </OperatorLayout>
  );
};

export default OperatorPersonDetailPage;

