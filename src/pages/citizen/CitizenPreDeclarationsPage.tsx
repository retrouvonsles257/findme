/**
 * Liste des pré-déclarations du citoyen
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../hooks';
import { useAppSelector } from '../../store/types';
import { selectUser } from '../../features/auth/store/authSelectors';
import { CitizenLayout } from './CitizenLayout';
import { listMyPreDeclarations, type PreDeclarationRow } from '../../features/preDeclarations/preDeclarationApi';
import { Plus, ClipboardList, Loader2 } from 'lucide-react';
import styles from './PreDeclarationCommon.module.css';

function statutClass(s: string): string {
  if (s === 'en_examen') return styles.badgeExamen;
  if (s === 'convertie') return styles.badgeConvertie;
  if (s === 'rejetee') return styles.badgeRejetee;
  return styles.badgeSoumise;
}

export const CitizenPreDeclarationsPage: React.FC = () => {
  const { t } = useI18n();
  const currentUser = useAppSelector(selectUser);
  const userId = (currentUser as any)?.id;
  const [rows, setRows] = useState<PreDeclarationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setErr(null);
    try {
      const data = await listMyPreDeclarations(userId);
      setRows(data);
    } catch (e: any) {
      setErr(e?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <CitizenLayout activeNav="pre-declarations" contentVariant="flush">
      <div className={styles.pageBleed}>
        <header className={styles.pageHeaderCard}>
          <div className={styles.headerRow}>
            <div>
              <h1 className={styles.title}>{t('citizen.preDeclaration.listTitle')}</h1>
              <p className={styles.subtitle}>{t('citizen.preDeclaration.listSubtitle')}</p>
            </div>
            <Link to="/citizen/pre-declarations/new" className={styles.primaryBtn}>
              <Plus size={18} />
              {t('citizen.preDeclaration.newCta')}
            </Link>
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
          <p className={styles.emptyState}>{t('citizen.preDeclaration.empty')}</p>
        ) : (
          <div className={styles.cardList}>
            {rows.map((r) => (
              <Link key={r.id} to={`/citizen/pre-declarations/${r.id}`} className={styles.card}>
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
                      {t(`citizen.preDeclaration.statut.${r.statut}`)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </CitizenLayout>
  );
};
