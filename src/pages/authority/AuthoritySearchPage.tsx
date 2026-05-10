/**
 * Recherche globale autorité (dossiers, personnes) — évite la redirection catch-all
 * qui renvoyait vers le dashboard et donnait l’impression d’un « rafraîchissement ».
 */

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FolderOpen, User, Search, ArrowLeft } from 'lucide-react';
import { AuthorityLayout } from '../../components/layout';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { NomRole } from '../../@types/enums.types';
import { supabase } from '../../config';
import { useI18n } from '../../hooks';
import styles from './AuthoritySearchPage.module.css';

type DossierHit = { id: string; numero_dossier: string | null; statut_dossier: string | null };
type PersonneHit = { id: string; nom: string | null; prenom: string | null; nom_complet: string | null };

export const AuthoritySearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const q = (params.get('q') || '').trim();
  const { t } = useI18n();
  const currentUser = useAppSelector(selectCurrentUser);
  const orgId = (currentUser as { organisation_id?: string | null })?.organisation_id;

  const restrictOrg = useMemo(
    () => currentUser?.role === NomRole.AUTORITE && Boolean(orgId),
    [currentUser?.role, orgId],
  );

  const [dossiers, setDossiers] = useState<DossierHit[]>([]);
  const [personnes, setPersonnes] = useState<PersonneHit[]>([]);
  const [loading, setLoading] = useState(false);

  const runSearch = useCallback(async () => {
    if (!q) {
      setDossiers([]);
      setPersonnes([]);
      return;
    }
    setLoading(true);
    try {
      let dq = (supabase as any)
        .from('dossier_disparition')
        .select('id, numero_dossier, statut_dossier')
        .or(`numero_dossier.ilike.%${q}%,circonstances.ilike.%${q}%,lieu_disparition.ilike.%${q}%,ville_disparition.ilike.%${q}%`)
        .limit(20);
      if (restrictOrg && orgId) dq = dq.eq('id_organisation_responsable', orgId);

      const pq = (supabase as any)
        .from('personne')
        .select('id, nom, prenom, nom_complet')
        .or(`nom.ilike.%${q}%,prenom.ilike.%${q}%,nom_complet.ilike.%${q}%`)
        .limit(20);

      const [dRes, pRes] = await Promise.all([dq, pq]);
      if (dRes.error) throw dRes.error;
      if (pRes.error) throw pRes.error;
      setDossiers(dRes.data || []);
      setPersonnes(pRes.data || []);
    } catch {
      setDossiers([]);
      setPersonnes([]);
    } finally {
      setLoading(false);
    }
  }, [q, restrictOrg, orgId]);

  useEffect(() => {
    void runSearch();
  }, [runSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = (e.currentTarget as HTMLFormElement).elements.namedItem('q') as HTMLInputElement;
    const next = (input?.value || '').trim();
    if (next) navigate(`/authority/search?q=${encodeURIComponent(next)}`, { replace: true });
  };

  return (
    <AuthorityLayout>
      <div className={styles.wrap}>
        <button type="button" className={styles.back} onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> {t('authority.commonActions.back')}
        </button>

        <h1 className={styles.title}>
          <Search size={22} /> {t('authority.header.searchPlaceholder')}
        </h1>

        <form className={styles.form} onSubmit={handleSubmit}>
          <input
            name="q"
            type="search"
            className={styles.input}
            placeholder={t('authority.header.searchPlaceholder')}
            defaultValue={q}
            autoFocus
          />
          <button type="submit" className={styles.submit}>
            {t('authority.search.submit')}
          </button>
        </form>

        {!q && <p className={styles.hint}>{t('authority.search.hint')}</p>}

        {loading && <p className={styles.loading}>{t('authority.header.loading')}</p>}

        {q && !loading && (
          <div className={styles.cols}>
            <section className={styles.section}>
              <h2>
                <FolderOpen size={18} /> {t('authority.menu.dossiers')}
              </h2>
              {dossiers.length === 0 ? (
                <p className={styles.empty}>{t('authority.dossiers.noDossiers')}</p>
              ) : (
                <ul className={styles.list}>
                  {dossiers.map((d) => (
                    <li key={d.id}>
                      <button type="button" className={styles.linkBtn} onClick={() => navigate(`/authority/dossiers/${d.id}`)}>
                        {d.numero_dossier || d.id.slice(0, 8)}
                        {d.statut_dossier ? ` — ${d.statut_dossier}` : ''}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className={styles.section}>
              <h2>
                <User size={18} /> {t('authority.menu.personnes')}
              </h2>
              {personnes.length === 0 ? (
                <p className={styles.empty}>{t('authority.search.emptyPersonnes')}</p>
              ) : (
                <ul className={styles.list}>
                  {personnes.map((p) => (
                    <li key={p.id}>
                      <button type="button" className={styles.linkBtn} onClick={() => navigate(`/authority/personnes/${p.id}`)}>
                        {p.nom_complet || `${p.prenom || ''} ${p.nom || ''}`.trim() || p.id.slice(0, 8)}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </AuthorityLayout>
  );
};

export default AuthoritySearchPage;
