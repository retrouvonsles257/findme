/**
 * Liste des alertes SOS (autorité)
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AuthorityLayout } from '../../components/layout';
import { useI18n } from '../../hooks';
import { useAuth } from '../../contexts';
import { useNotification } from '../../contexts';
import { useAppSelector } from '../../store/types';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { listOrganisationsForPreDeclaration } from '../../features/preDeclarations/preDeclarationApi';
import {
  listAuthoritySosEvents,
  markSosEventHandled,
  getUtilisateurPublicForSos,
  assignSosEventToOrganisation,
  type SosEventRow,
} from '../../features/sos/sosApi';
import { supabase } from '../../config';
import { Loader2 } from 'lucide-react';
import styles from '../citizen/PreDeclarationCommon.module.css';

type Filter = 'active' | 'all';
type AssignScope = 'all' | 'unassigned' | 'myOrg';

export const AuthoritySosPage: React.FC = () => {
  const { t } = useI18n();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const currentUser = useAppSelector(selectCurrentUser);
  const [searchParams] = useSearchParams();
  const focusId = searchParams.get('focus');

  const [rows, setRows] = useState<SosEventRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { nom: string; prenom: string; email: string }>>({});
  const [orgs, setOrgs] = useState<{ id: string; nom: string; region: string | null }[]>([]);
  const [assignDraft, setAssignDraft] = useState<Record<string, string>>({});
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('active');
  const [assignScope, setAssignScope] = useState<AssignScope>('all');
  const [loading, setLoading] = useState(true);

  const orgById = useMemo(() => {
    const m = new Map<string, string>();
    orgs.forEach((o) => m.set(o.id, o.region ? `${o.nom} — ${o.region}` : o.nom));
    return m;
  }, [orgs]);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const data = await listAuthoritySosEvents(250);
      setRows(data);
      const ids = [...new Set(data.map((r) => r.id_utilisateur))];
      const entries = await Promise.all(
        ids.map(async (id) => {
          try {
            const p = await getUtilisateurPublicForSos(id);
            return [id, p] as const;
          } catch {
            return [id, null] as const;
          }
        }),
      );
      const map: Record<string, { nom: string; prenom: string; email: string }> = {};
      entries.forEach(([id, p]) => {
        if (p) map[id] = p;
      });
      setProfiles(map);
    } catch (e: any) {
      addNotification({ title: t('errors.generic'), message: e?.message || '', type: 'error' });
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [addNotification, t]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    listOrganisationsForPreDeclaration()
      .then(setOrgs)
      .catch(() => {
        /* liste optionnelle pour l’assignation */
      });
  }, []);

  useEffect(() => {
    if (!focusId || rows.length === 0) return;
    const el = document.getElementById(`sos-row-${focusId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focusId, rows]);

  const myOrgId = (currentUser as { organisation_id?: string | null } | null)?.organisation_id ?? null;

  useEffect(() => {
    const channel = supabase
      .channel('authority-sos-events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sos_event' }, () => {
        void load({ silent: true });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load]);

  const baseFiltered = useMemo(() => {
    if (filter === 'active') return rows.filter((r) => r.statut === 'envoye');
    return rows;
  }, [rows, filter]);

  const filtered = useMemo(() => {
    if (assignScope === 'all') return baseFiltered;
    if (assignScope === 'unassigned') {
      return baseFiltered.filter((r) => !r.id_organisation_assignee);
    }
    if (assignScope === 'myOrg' && myOrgId) {
      return baseFiltered.filter((r) => r.id_organisation_assignee === myOrgId);
    }
    return baseFiltered;
  }, [baseFiltered, assignScope, myOrgId]);

  const onMarkHandled = async (id: string) => {
    if (!user?.id) return;
    if (!window.confirm(t('authority.sos.markHandledConfirm'))) return;
    try {
      await markSosEventHandled(id, user.id);
      addNotification({ title: t('authority.sos.handledOk'), message: '', type: 'success' });
      await load();
    } catch (e: any) {
      addNotification({ title: t('errors.generic'), message: e?.message || '', type: 'error' });
    }
  };

  const onSaveAssign = async (evId: string) => {
    const ev = rows.find((r) => r.id === evId);
    if (!ev || ev.statut !== 'envoye') return;
    const fromServer = ev.id_organisation_assignee || '';
    const draft = assignDraft[evId] !== undefined ? assignDraft[evId] : fromServer;
    const nextId = draft.trim() || null;
    const prevId = fromServer || null;
    if (nextId === prevId) return;
    setAssigningId(evId);
    try {
      await assignSosEventToOrganisation(evId, nextId);
      setAssignDraft((d) => {
        const copy = { ...d };
        delete copy[evId];
        return copy;
      });
      addNotification({ title: t('authority.sos.assignOk'), message: '', type: 'success' });
      await load();
    } catch (e: any) {
      addNotification({ title: t('errors.generic'), message: e?.message || '', type: 'error' });
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <AuthorityLayout contentVariant="flush">
      <div className={styles.pageBleed}>
        <header className={styles.pageHeaderCard}>
          <h1 className={styles.title}>{t('authority.sos.listTitle')}</h1>
          <p className={styles.subtitle}>{t('authority.sos.listSubtitle')}</p>
        </header>

        <div className={styles.sectionCard} style={{ paddingBottom: '1rem' }}>
          <div className={styles.filterBar}>
            <button
              type="button"
              className={filter === 'active' ? styles.primaryBtn : styles.secondaryBtn}
              onClick={() => setFilter('active')}
            >
              {t('authority.sos.filterActive')}
            </button>
            <button
              type="button"
              className={filter === 'all' ? styles.primaryBtn : styles.secondaryBtn}
              onClick={() => setFilter('all')}
            >
              {t('authority.sos.filterAll')}
            </button>
          </div>
          <div className={styles.filterBar} style={{ marginTop: '0.65rem' }}>
            <button
              type="button"
              className={assignScope === 'all' ? styles.primaryBtn : styles.secondaryBtn}
              onClick={() => setAssignScope('all')}
            >
              {t('authority.sos.filterAssignAll')}
            </button>
            <button
              type="button"
              className={assignScope === 'unassigned' ? styles.primaryBtn : styles.secondaryBtn}
              onClick={() => setAssignScope('unassigned')}
            >
              {t('authority.sos.filterUnassigned')}
            </button>
            <button
              type="button"
              className={assignScope === 'myOrg' ? styles.primaryBtn : styles.secondaryBtn}
              onClick={() => setAssignScope('myOrg')}
              disabled={!myOrgId}
              title={!myOrgId ? t('authority.sos.filterMyOrgDisabledHint') : undefined}
            >
              {t('authority.sos.filterMyOrg')}
            </button>
          </div>
        </div>

        {loading ? (
          <div className={styles.sectionCard}>
            <div className={styles.loadingState}>
              <Loader2 className={styles.loadingSpinner} size={22} aria-hidden />
              {t('common.loading')}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <p className={styles.emptyState}>{t('authority.sos.empty')}</p>
        ) : (
          <div className={styles.cardList}>
            {filtered.map((ev) => {
              const prof = profiles[ev.id_utilisateur];
              const label = prof ? `${prof.prenom || ''} ${prof.nom || ''}`.trim() || prof.email : ev.id_utilisateur;
              const mapUrl =
                ev.latitude != null && ev.longitude != null
                  ? `https://maps.google.com/?q=${encodeURIComponent(`${ev.latitude},${ev.longitude}`)}`
                  : null;
              const statKey = ev.statut as string;
              const statClass =
                statKey === 'envoye' ? styles.statBadgeActive : statKey === 'traite' ? styles.statBadgeDone : styles.statBadge;
              const isFocus = focusId === ev.id;
              const assignValue = assignDraft[ev.id] !== undefined ? assignDraft[ev.id] : ev.id_organisation_assignee || '';
              const assignedLabel = ev.id_organisation_assignee ? orgById.get(ev.id_organisation_assignee) || ev.id_organisation_assignee : null;
              return (
                <div
                  key={ev.id}
                  id={`sos-row-${ev.id}`}
                  className={`${styles.card} ${isFocus ? styles.sosRowHighlight : ''}`}
                  style={{ cursor: 'default' }}
                >
                  <div className={styles.cardRow}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className={styles.cardTitle}>
                        {t('authority.sos.citizen')}: {label}
                      </p>
                      <p className={styles.cardMeta}>
                        {t('authority.sos.when')}: {new Date(ev.created_at).toLocaleString()}
                      </p>
                      <p className={styles.cardMeta}>
                        <span className={statClass}>{t(`authority.sos.statut.${ev.statut}`)}</span>
                      </p>
                      {assignedLabel && (
                        <p className={styles.cardMeta}>
                          {t('authority.sos.assignLabel')}: {assignedLabel}
                        </p>
                      )}
                      <p className={styles.cardMeta}>
                        {t('authority.sos.position')}:{' '}
                        {ev.sans_position || !mapUrl ? (
                          t('authority.sos.sansPositionGps')
                        ) : (
                          <a href={mapUrl || '#'} target="_blank" rel="noopener noreferrer" className={styles.linkBtn}>
                            {t('authority.sos.openMap')}
                          </a>
                        )}
                      </p>
                      <p className={styles.cardMeta}>
                        {t('authority.sos.message')}: {ev.message || '—'}
                      </p>
                    </div>
                  </div>
                  {ev.statut === 'envoye' && orgs.length > 0 && (
                    <div className={styles.cardActions} style={{ flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                      <label className={styles.subtitle} style={{ margin: 0 }}>
                        {t('authority.sos.assignLabel')}
                      </label>
                      <select
                        className={styles.toolbarSelect}
                        style={{ minWidth: 220 }}
                        value={assignValue}
                        onChange={(e) => setAssignDraft((d) => ({ ...d, [ev.id]: e.target.value }))}
                        disabled={assigningId === ev.id}
                      >
                        <option value="">{t('authority.sos.assignNone')}</option>
                        {orgs.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.region ? `${o.nom} — ${o.region}` : o.nom}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className={styles.secondaryBtn}
                        onClick={() => void onSaveAssign(ev.id)}
                        disabled={assigningId === ev.id}
                      >
                        {t('authority.sos.assignApply')}
                      </button>
                    </div>
                  )}
                  {ev.statut === 'envoye' && (
                    <div className={styles.cardActions}>
                      <button type="button" className={styles.primaryBtn} onClick={() => onMarkHandled(ev.id)}>
                        {t('authority.sos.markHandled')}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AuthorityLayout>
  );
};
