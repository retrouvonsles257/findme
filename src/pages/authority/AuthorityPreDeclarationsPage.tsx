/**
 * Liste des pré-déclarations pour l'organisation de l'autorité connectée
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Loader2 } from 'lucide-react';
import { AuthorityLayout } from '../../components/layout';
import { useI18n } from '../../hooks';
import { listOrgPreDeclarations, type PreDeclarationRow } from '../../features/preDeclarations/preDeclarationApi';
import styles from '../citizen/PreDeclarationCommon.module.css';

function statutClass(s: string): string {
  if (s === 'en_examen') return styles.badgeExamen;
  if (s === 'convertie') return styles.badgeConvertie;
  if (s === 'rejetee') return styles.badgeRejetee;
  return styles.badgeSoumise;
}

export const AuthorityPreDeclarationsPage: React.FC = () => {
  const { t } = useI18n();
  const [rows, setRows] = useState<PreDeclarationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await listOrgPreDeclarations();
      setRows(data);
    } catch (e: any) {
      setErr(e?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AuthorityLayout contentVariant="flush">
      <div className={styles.pageBleed}>
        <header className={styles.pageHeaderCard}>
          <div className={styles.headerRow}>
            <div>
              <h1 className={styles.title}>{t('authority.preDeclaration.listTitle')}</h1>
              <p className={styles.subtitle}>{t('authority.preDeclaration.listSubtitle')}</p>
            </div>
          </div>
        </header>

        {err && <div className={styles.errorBox}>{err}</div>}

        {loading ? (
          <div className={styles.sectionCard}>
            <div className={styles.loadingState}>
              <Loader2 className={styles.loadingSpinner} size={22} aria-hidden />
              {t('common.loading')}
            </div>
          </div>
        ) : rows.length === 0 ? (
          <p className={styles.emptyState}>{t('authority.preDeclaration.empty')}</p>
        ) : (
          <div className={styles.cardList}>
            {rows.map((r) => (
              <Link key={r.id} to={`/authority/pre-declarations/${r.id}`} className={styles.card}>
                <div className={styles.cardRow}>
                  <div className={styles.cardRowIcon}>
                    <ClipboardList size={18} />
                  </div>
                  <div>
                    <p className={styles.cardTitle}>
                      {r.prenom_personne} {r.nom_personne}
                    </p>
                    <p className={styles.cardMeta}>
                      {r.date_disparition} — {r.ville_disparition || r.region_disparition || r.pays_disparition}
                    </p>
                    <span className={`${styles.badge} ${statutClass(r.statut)}`}>
                      {t(`authority.preDeclaration.statut.${r.statut}`)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AuthorityLayout>
  );
};
