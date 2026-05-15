/**
 * Détail pré-déclaration + messagerie + actions (autorité)
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AuthorityLayout } from '../../components/layout';
import { useI18n } from '../../hooks';
import { useAuth } from '../../contexts';
import { useNotification } from '../../contexts';
import { useAppSelector } from '../../store/types';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { supabase } from '../../config';
import { uploadFileToCloudinary } from '../../services/cloudinary';
import {
  getConversationByPreDeclaration,
  getMessagePieceJointesForMessages,
  getMessageReferencesForMessages,
  getMessages,
  getPreDeclarationById,
  listAuthorityColleaguesInOrganisation,
  listMessagerieTaches,
  listOrganisationsForPreDeclaration,
  createMessagerieTache,
  updateMessagerieTacheStatut,
  escalateConversationToOrganisation,
  markMessagesReadForViewer,
  markMessageMessagerieTraite,
  markPreDeclarationEnExamen,
  rejectPreDeclarationWithMotif,
  sendMessage,
  softDeleteOwnMessage,
  updateConversationAssignee,
  updateConversationStatut,
  type ConversationRow,
  type MessagerieTacheRow,
  type MessagerieTacheStatut,
  type MessagePieceJointeRow,
  type MessageReferenceRow,
  type MessageReferenceTypeEntite,
  type MessageRow,
  type MessageTypeMessagerie,
  type PreDeclarationRow,
} from '../../features/preDeclarations/preDeclarationApi';
import { Loader2, Paperclip, Send } from 'lucide-react';
import styles from '../citizen/PreDeclarationCommon.module.css';

const REF_TYPES_AUTHORITY: MessageReferenceTypeEntite[] = [
  'dossier',
  'pre_declaration',
  'signalement',
  'document',
  'personne',
  'alerte',
  'message',
  'localisation',
];

export const AuthorityPreDeclarationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user } = useAuth();
  const currentUser = useAppSelector(selectCurrentUser);
  const { addNotification } = useNotification();
  const userId = user?.id;
  const orgId = (currentUser as { organisation_id?: string } | null)?.organisation_id ?? null;

  const [pre, setPre] = useState<PreDeclarationRow | null>(null);
  const [convRow, setConvRow] = useState<ConversationRow | null>(null);
  const [convId, setConvId] = useState<string | null>(null);
  const [convAssignee, setConvAssignee] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [attachmentsByMessage, setAttachmentsByMessage] = useState<Record<string, MessagePieceJointeRow[]>>({});
  const [referencesByMessage, setReferencesByMessage] = useState<Record<string, MessageReferenceRow[]>>({});
  const [taches, setTaches] = useState<MessagerieTacheRow[]>([]);
  const [orgsEscalate, setOrgsEscalate] = useState<{ id: string; nom: string; region: string | null }[]>([]);
  const [escOrgId, setEscOrgId] = useState('');
  const [newTacheTitle, setNewTacheTitle] = useState('');
  const [newTacheDesc, setNewTacheDesc] = useState('');
  const [draft, setDraft] = useState('');
  const [messageType, setMessageType] = useState<MessageTypeMessagerie>('texte');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [refTypeAuth, setRefTypeAuth] = useState<MessageReferenceTypeEntite>('dossier');
  const [refIdAuth, setRefIdAuth] = useState('');
  const [demandeTraitement, setDemandeTraitement] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [rejectMotif, setRejectMotif] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [colleagues, setColleagues] = useState<{ id: string; nom: string; prenom: string; email: string }[]>([]);

  const canChat = pre && (pre.statut === 'soumise' || pre.statut === 'en_examen');

  const escaladeOrgLabel = useMemo(() => {
    const oid = convRow?.id_organisation_escalade;
    if (!oid) return null;
    const o = orgsEscalate.find((x) => x.id === oid);
    return o ? (o.region ? `${o.nom} — ${o.region}` : o.nom) : `${oid.slice(0, 8)}…`;
  }, [convRow?.id_organisation_escalade, orgsEscalate]);

  const refresh = useCallback(async () => {
    if (!id || !userId) return;
    const p = await getPreDeclarationById(id);
    if (!p) {
      setErr(t('authority.preDeclaration.notFound'));
      setPre(null);
      return;
    }
    setErr(null);
    setPre(p);
    const c = await getConversationByPreDeclaration(id);
    setConvRow(c);
    setConvId(c?.id || null);
    setConvAssignee(c?.id_utilisateur_assigne ?? null);
    setEscOrgId(c?.id_organisation_escalade || '');
    if (c?.id) {
      const msgs = await getMessages(c.id);
      setMessages(msgs);
      const ids = msgs.map((m) => m.id);
      const [pj, rf, th] = await Promise.all([
        getMessagePieceJointesForMessages(ids),
        getMessageReferencesForMessages(ids),
        listMessagerieTaches(c.id),
      ]);
      setAttachmentsByMessage(pj);
      setReferencesByMessage(rf);
      setTaches(th);
      const others = msgs.filter((m) => m.id_auteur !== userId && !m.deleted_at).map((m) => m.id);
      await markMessagesReadForViewer(c.id, userId, others);
    } else {
      setAttachmentsByMessage({});
      setReferencesByMessage({});
      setTaches([]);
    }
  }, [id, userId, t]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id || !userId) return;
      setLoading(true);
      try {
        await refresh();
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || 'Erreur');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, userId, refresh]);

  useEffect(() => {
    if (!orgId) return;
    let c = false;
    void (async () => {
      try {
        const list = await listAuthorityColleaguesInOrganisation(orgId);
        if (!c) setColleagues(list);
      } catch {
        if (!c) setColleagues([]);
      }
    })();
    return () => {
      c = true;
    };
  }, [orgId]);

  useEffect(() => {
    let c = false;
    void (async () => {
      try {
        const o = await listOrganisationsForPreDeclaration();
        if (!c) setOrgsEscalate(o);
      } catch {
        if (!c) setOrgsEscalate([]);
      }
    })();
    return () => {
      c = true;
    };
  }, []);

  const pollRef = useRef<number | null>(null);
  useEffect(() => {
    if (!convId) return;
    pollRef.current = window.setInterval(() => {
      void refresh();
    }, 12_000);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [convId, refresh]);

  useEffect(() => {
    if (!convId) return;
    const channel = supabase
      .channel(`messagerie:${convId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'message', filter: `id_conversation=eq.${convId}` },
        () => {
          void refresh();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [convId, refresh]);

  const onSend = async () => {
    if (!pre || !convId || !userId || !canChat) return;
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    try {
      const pieceJointes: { nom_fichier: string; mime_type: string; taille_octets: number; url_storage: string }[] = [];
      for (const f of pendingFiles.slice(0, 3)) {
        const up = await uploadFileToCloudinary(f, { type: 'document', tags: ['messagerie', convId] });
        if (!up.success || !up.secureUrl) {
          addNotification({
            title: t('errors.generic'),
            message: up.error || t('authority.preDeclaration.uploadFailed'),
            type: 'error',
          });
          setSending(false);
          return;
        }
        pieceJointes.push({
          nom_fichier: f.name,
          mime_type: f.type || 'application/octet-stream',
          taille_octets: f.size,
          url_storage: up.secureUrl,
        });
      }
      const rid = refIdAuth.trim();
      const references =
        rid.length >= 32 ? [{ type_entite: refTypeAuth, id_entite: rid }] : undefined;
      await sendMessage({
        conversationId: convId,
        authorId: userId,
        corps: text,
        preDeclaration: pre,
        authorIsCitizenOwner: false,
        typeMessage: messageType,
        pieceJointes: pieceJointes.length ? pieceJointes : undefined,
        references,
        demandeTraitement: demandeTraitement || undefined,
      });
      setDraft('');
      setPendingFiles([]);
      setMessageType('texte');
      setRefIdAuth('');
      setDemandeTraitement(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await refresh();
    } catch (e: any) {
      addNotification({ title: t('errors.generic'), message: e?.message || 'Erreur', type: 'error' });
    } finally {
      setSending(false);
    }
  };

  const onMarkExamen = async () => {
    if (!pre || !convId || !userId) return;
    setBusy(true);
    try {
      await markPreDeclarationEnExamen({
        preDeclarationId: pre.id,
        conversationId: convId,
        authorityUserId: userId,
      });
      addNotification({
        title: t('authority.preDeclaration.markExamenOk'),
        message: '',
        type: 'success',
      });
      await refresh();
    } catch (e: any) {
      addNotification({ title: t('errors.generic'), message: e?.message || '', type: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const onRejectSubmit = async () => {
    if (!pre || !convId || !userId) return;
    setBusy(true);
    try {
      await rejectPreDeclarationWithMotif({
        preDeclarationId: pre.id,
        conversationId: convId,
        authorityUserId: userId,
        motif: rejectMotif,
      });
      setRejectOpen(false);
      setRejectMotif('');
      addNotification({
        title: t('authority.preDeclaration.rejectOk'),
        message: '',
        type: 'info',
      });
      await refresh();
    } catch (e: any) {
      addNotification({ title: t('errors.generic'), message: e?.message || '', type: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const onSaveAssignee = async (assigneeId: string | null) => {
    if (!convId || !orgId) return;
    setBusy(true);
    try {
      await updateConversationAssignee(convId, assigneeId, orgId);
      setConvAssignee(assigneeId);
      addNotification({
        title: t('authority.preDeclaration.assigneeSaved'),
        message: '',
        type: 'success',
      });
      await refresh();
    } catch (e: any) {
      addNotification({ title: t('errors.generic'), message: e?.message || '', type: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const onSoftDelete = async (messageId: string) => {
    if (!window.confirm(t('authority.preDeclaration.confirmDeleteMessage'))) return;
    try {
      await softDeleteOwnMessage(messageId);
      await refresh();
    } catch (e: any) {
      addNotification({ title: t('errors.generic'), message: e?.message || '', type: 'error' });
    }
  };

  const onMarkTraite = async (messageId: string) => {
    try {
      await markMessageMessagerieTraite(messageId);
      addNotification({ title: t('authority.messagerieContext.traiteOk'), message: '', type: 'success' });
      await refresh();
    } catch (e: any) {
      addNotification({ title: t('errors.generic'), message: e?.message || '', type: 'error' });
    }
  };

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onSaveConvStatut = async (st: string) => {
    if (!convId) return;
    setBusy(true);
    try {
      await updateConversationStatut(convId, st);
      addNotification({ title: t('authority.preDeclaration.convStatutSaved'), message: '', type: 'success' });
      await refresh();
    } catch (e: any) {
      addNotification({ title: t('errors.generic'), message: e?.message || '', type: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const onApplyEscalade = async () => {
    if (!convId || !userId) return;
    setBusy(true);
    try {
      await escalateConversationToOrganisation(convId, escOrgId || null, userId);
      addNotification({ title: t('authority.preDeclaration.escaladeOk'), message: '', type: 'success' });
      await refresh();
    } catch (e: any) {
      addNotification({ title: t('errors.generic'), message: e?.message || '', type: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const onAddTache = async () => {
    if (!convId || !userId || !newTacheTitle.trim()) return;
    setBusy(true);
    try {
      await createMessagerieTache({
        conversationId: convId,
        titre: newTacheTitle.trim(),
        description: newTacheDesc.trim() || null,
        authorityUserId: userId,
      });
      setNewTacheTitle('');
      setNewTacheDesc('');
      await refresh();
    } catch (e: any) {
      addNotification({ title: t('errors.generic'), message: e?.message || '', type: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const onTacheStatut = async (tid: string, st: MessagerieTacheStatut) => {
    setBusy(true);
    try {
      await updateMessagerieTacheStatut(tid, st);
      await refresh();
    } catch (e: any) {
      addNotification({ title: t('errors.generic'), message: e?.message || '', type: 'error' });
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <AuthorityLayout contentVariant="flush">
        <div className={styles.pageBleed}>
          <div className={styles.sectionCard}>
            <div className={styles.loadingState}>
              <Loader2 className={styles.loadingSpinner} size={22} aria-hidden />
              {t('common.loading')}
            </div>
          </div>
        </div>
      </AuthorityLayout>
    );
  }

  if (err || !pre) {
    return (
      <AuthorityLayout contentVariant="flush">
        <div className={styles.pageBleed}>
          <div className={styles.sectionCard}>
            <div className={styles.errorBox}>{err || t('authority.preDeclaration.notFound')}</div>
            <button type="button" className={styles.secondaryBtn} style={{ marginTop: 12 }} onClick={() => navigate('/authority/pre-declarations')}>
              {t('authority.preDeclaration.backList')}
            </button>
          </div>
        </div>
      </AuthorityLayout>
    );
  }

  return (
    <AuthorityLayout contentVariant="flush">
      <div className={styles.messagerieRoot}>
        <div className={styles.messagerieTop}>
          <header className={styles.pageHeaderCard}>
            <div className={styles.headerRow}>
              <div>
                <h1 className={styles.title}>
                  {pre.prenom_personne} {pre.nom_personne}
                </h1>
                <p className={styles.subtitle}>
                  {t(`authority.preDeclaration.statut.${pre.statut}`)} · {pre.date_disparition}
                  {convRow?.statut
                    ? ` · ${t('authority.preDeclaration.convStatut')}: ${t(`authority.preDeclaration.convStatutVal.${convRow.statut}`)}`
                    : ''}
                  {escaladeOrgLabel ? ` · ${t('authority.preDeclaration.escaladeActive', { nom: escaladeOrgLabel })}` : ''}
                </p>
              </div>
              <button type="button" className={styles.secondaryBtn} onClick={() => navigate('/authority/pre-declarations')}>
                {t('authority.preDeclaration.backList')}
              </button>
            </div>
          </header>

          <section className={styles.sectionCard}>
            <div className={styles.toolbarActions}>
              {pre.statut === 'soumise' && (
                <button type="button" className={styles.secondaryBtn} onClick={onMarkExamen} disabled={busy}>
                  {t('authority.preDeclaration.actionExamen')}
                </button>
              )}
              {(pre.statut === 'soumise' || pre.statut === 'en_examen') && (
                <>
                  <Link to={`/authority/dossiers/new?preDeclarationId=${pre.id}`} className={styles.primaryBtn}>
                    {t('authority.preDeclaration.actionConvert')}
                  </Link>
                  <button type="button" className={`${styles.secondaryBtn} ${styles.dangerBtn}`} onClick={() => setRejectOpen(true)} disabled={busy}>
                    {t('authority.preDeclaration.actionReject')}
                  </button>
                </>
              )}
              {pre.id_dossier && (
                <Link to={`/authority/dossiers/${pre.id_dossier}`} className={styles.secondaryBtn}>
                  {t('authority.preDeclaration.openDossier')}
                </Link>
              )}
            </div>
          </section>

          {orgId && convId && (
            <section className={styles.sectionCard}>
            <label className={styles.subtitle} style={{ display: 'block', marginBottom: 8 }}>
              {t('authority.preDeclaration.assigneeLabel')}
            </label>
            <select
              value={convAssignee || ''}
              onChange={(e) => void onSaveAssignee(e.target.value || null)}
              disabled={busy}
              className={styles.toolbarSelect}
            >
              <option value="">{t('authority.preDeclaration.assigneeNone')}</option>
              {colleagues.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.prenom} {u.nom}
                </option>
              ))}
            </select>
            </section>
          )}

          {convId && (
            <section className={styles.sectionCard}>
            <label className={styles.subtitle}>{t('authority.preDeclaration.convStatutLabel')}</label>
            <div className={styles.toolbarActions} style={{ marginTop: 8 }}>
              <select
                className={styles.toolbarSelect}
                value={convRow?.statut || 'ouverte'}
                onChange={(e) => void onSaveConvStatut(e.target.value)}
                disabled={busy}
              >
                <option value="ouverte">{t('authority.preDeclaration.convStatutVal.ouverte')}</option>
                <option value="en_attente">{t('authority.preDeclaration.convStatutVal.en_attente')}</option>
                <option value="traitee">{t('authority.preDeclaration.convStatutVal.traitee')}</option>
                <option value="fermee">{t('authority.preDeclaration.convStatutVal.fermee')}</option>
              </select>
            </div>
            </section>
          )}

          {convId && orgId && (
            <section className={styles.sectionCard}>
            <label className={styles.subtitle}>{t('authority.preDeclaration.escaladeLabel')}</label>
            <div className={styles.toolbarActions} style={{ marginTop: 8 }}>
              <select
                className={styles.toolbarSelect}
                style={{ minWidth: 260 }}
                value={escOrgId}
                onChange={(e) => setEscOrgId(e.target.value)}
                disabled={busy}
              >
                <option value="">{t('authority.preDeclaration.escaladeNone')}</option>
                {orgsEscalate
                  .filter((o) => o.id !== orgId)
                  .map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nom}
                      {o.region ? ` — ${o.region}` : ''}
                    </option>
                  ))}
              </select>
              <button type="button" className={styles.secondaryBtn} onClick={() => void onApplyEscalade()} disabled={busy}>
                {t('authority.preDeclaration.escaladeApply')}
              </button>
            </div>
            </section>
          )}

          {convId && (
            <section className={styles.sectionCard}>
            <h3 className={styles.sectionTitle}>{t('authority.preDeclaration.tachesTitle')}</h3>
            <div className={styles.tacheList}>
              {taches.map((tc) => (
                <div key={tc.id} className={styles.tacheCard}>
                  <div>
                    <p className={styles.tacheTitle}>{tc.titre}</p>
                    {tc.description && <p className={styles.cardMeta}>{tc.description}</p>}
                    <span className={styles.refChip}>{t(`authority.preDeclaration.tacheStatut.${tc.statut}`)}</span>
                  </div>
                  <div className={styles.toolbarActions}>
                    {tc.statut !== 'faite' && (
                      <button type="button" className={styles.secondaryBtn} onClick={() => void onTacheStatut(tc.id, 'faite')} disabled={busy}>
                        {t('authority.preDeclaration.tacheDone')}
                      </button>
                    )}
                    {tc.statut !== 'annulee' && (
                      <button type="button" className={`${styles.secondaryBtn} ${styles.dangerBtn}`} onClick={() => void onTacheStatut(tc.id, 'annulee')} disabled={busy}>
                        {t('authority.preDeclaration.tacheCancel')}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.field} style={{ marginTop: 12 }}>
              <label>{t('authority.preDeclaration.tacheNewTitle')}</label>
              <input value={newTacheTitle} onChange={(e) => setNewTacheTitle(e.target.value)} disabled={busy} />
            </div>
            <div className={styles.field}>
              <label>{t('authority.preDeclaration.tacheNewDesc')}</label>
              <input value={newTacheDesc} onChange={(e) => setNewTacheDesc(e.target.value)} disabled={busy} />
            </div>
            <button type="button" className={styles.primaryBtn} style={{ marginTop: 8 }} onClick={() => void onAddTache()} disabled={busy || !newTacheTitle.trim()}>
              {t('authority.preDeclaration.tacheAdd')}
            </button>
            </section>
          )}

          <div className={styles.infoPanel}>
            <dl>
              <dt>{t('citizen.preDeclaration.fieldLieu')}</dt>
              <dd>{pre.lieu_disparition || '—'}</dd>
              <dt>{t('citizen.preDeclaration.fieldVille')}</dt>
              <dd>{pre.ville_disparition || '—'}</dd>
              <dt>{t('citizen.preDeclaration.fieldCirconstances')}</dt>
              <dd>{pre.circonstances}</dd>
              <dt>{t('citizen.preDeclaration.fieldInfos')}</dt>
              <dd>{pre.infos_complementaires || '—'}</dd>
              <dt>{t('citizen.preDeclaration.fieldContactNom')}</dt>
              <dd>{pre.contact_nom || '—'}</dd>
              <dt>{t('citizen.preDeclaration.fieldContactTel')}</dt>
              <dd>{pre.contact_telephone || '—'}</dd>
              <dt>{t('citizen.preDeclaration.fieldContactEmail')}</dt>
              <dd>{pre.contact_email || '—'}</dd>
              {pre.statut === 'rejetee' && pre.motif_rejet && (
                <>
                  <dt>{t('authority.preDeclaration.rejectMotifLabel')}</dt>
                  <dd>{pre.motif_rejet}</dd>
                </>
              )}
            </dl>
          </div>

          {!canChat && (
            <div className={styles.bannerClosed}>{t(`authority.preDeclaration.threadClosed.${pre.statut}`)}</div>
          )}
        </div>

        <section className={styles.messagerieThread}>
          <div className={styles.sectionHead} style={{ padding: '0.65rem 1rem 0', marginBottom: 0, border: 'none' }}>
            <h2 className={styles.sectionTitle}>{t('authority.preDeclaration.messagesTitle')}</h2>
          </div>
          <div className={`${styles.chatBox} ${styles.chatBoxFlex}`}>
            {messages.length === 0 ? (
              <p className={styles.subtitle} style={{ margin: '0.5rem 0', textAlign: 'center' }}>
                {t('authority.preDeclaration.noMessages')}
              </p>
            ) : (
              messages.map((m) => {
                const mine = m.id_auteur === userId;
                const deleted = Boolean(m.deleted_at);
                const tm = (m.type_message || 'texte') as MessageTypeMessagerie;
                const pjs = attachmentsByMessage[m.id] || [];
                const refs = referencesByMessage[m.id] || [];
                const meta = (m.metadonnees || {}) as Record<string, unknown>;
                const traite = Boolean(meta.traite_messagerie);
                return (
                  <div key={m.id} className={`${styles.bubble} ${mine ? styles.bubbleCitizen : styles.bubbleAuthority}`}>
                    {tm !== 'texte' && (
                      <div className={styles.msgTypeChip}>{t(`authority.preDeclaration.messageType.${tm}`)}</div>
                    )}
                    {meta.demande_traitement ? (
                      <div className={styles.refChipRow} style={{ marginBottom: 6 }}>
                        <span className={styles.refChip}>{t('authority.preDeclaration.metaDemandeTraitement')}</span>
                      </div>
                    ) : null}
                    {traite ? (
                      <div className={styles.refChipRow} style={{ marginBottom: 6 }}>
                        <span className={styles.refChip}>{t('authority.messagerieContext.badgeTraite')}</span>
                      </div>
                    ) : null}
                    {deleted ? <em>{t('authority.preDeclaration.messageDeleted')}</em> : m.corps}
                    {refs.length > 0 && (
                      <div className={styles.refChipRow} style={{ marginTop: 6 }}>
                        {refs.map((r) => (
                          <span key={r.id} className={styles.refChip}>
                            {t(`authority.preDeclaration.refType.${r.type_entite}`)}:{r.id_entite.slice(0, 8)}…
                          </span>
                        ))}
                      </div>
                    )}
                    {pjs.length > 0 && (
                      <ul className={styles.attachmentList}>
                        {pjs.map((pj) => (
                          <li key={pj.id}>
                            <a href={pj.url_storage} target="_blank" rel="noopener noreferrer">
                              {pj.nom_fichier}
                            </a>{' '}
                            ({Math.round(pj.taille_octets / 1024)} Ko)
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className={styles.bubbleMeta}>
                      {mine ? t('authority.preDeclaration.you') : t('authority.preDeclaration.citizenLabel')} ·{' '}
                      {new Date(m.created_at).toLocaleString()}
                      {mine && !deleted && canChat && (
                        <>
                          {' · '}
                          <button type="button" className={styles.linkBtn} onClick={() => void onSoftDelete(m.id)}>
                            {t('authority.preDeclaration.deleteMessage')}
                          </button>
                        </>
                      )}
                      {!mine && !deleted && orgId && !traite && (
                        <>
                          {' · '}
                          <button type="button" className={styles.linkBtn} onClick={() => void onMarkTraite(m.id)}>
                            {t('authority.messagerieContext.markTraite')}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {canChat && (
            <footer className={styles.composerBar}>
              <div className={styles.composerBarInner}>
                <div className={styles.metaActionRow} style={{ marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span className={styles.subtitle}>{t('authority.preDeclaration.messageTypeLabel')}</span>
                  <select
                    value={messageType}
                    onChange={(e) => setMessageType(e.target.value as MessageTypeMessagerie)}
                    disabled={sending}
                    className={styles.toolbarSelect}
                    style={{ maxWidth: 280 }}
                  >
                    <option value="texte">{t('authority.preDeclaration.messageType.texte')}</option>
                    <option value="demande_complement">{t('authority.preDeclaration.messageType.demande_complement')}</option>
                    <option value="demande_piece">{t('authority.preDeclaration.messageType.demande_piece')}</option>
                  </select>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={demandeTraitement}
                      onChange={(e) => setDemandeTraitement(e.target.checked)}
                      disabled={sending}
                    />
                    <span className={styles.subtitle}>{t('authority.preDeclaration.demandeTraitement')}</span>
                  </label>
                </div>
                <div className={styles.metaActionRow} style={{ marginBottom: '0.5rem' }}>
                  <span className={styles.subtitle}>{t('authority.preDeclaration.optionalRef')}</span>
                  <select
                    className={styles.toolbarSelect}
                    style={{ maxWidth: 160 }}
                    value={refTypeAuth}
                    onChange={(e) => setRefTypeAuth(e.target.value as MessageReferenceTypeEntite)}
                    disabled={sending}
                  >
                    {REF_TYPES_AUTHORITY.map((rt) => (
                      <option key={rt} value={rt}>
                        {t(`authority.preDeclaration.refType.${rt}`)}
                      </option>
                    ))}
                  </select>
                  <input
                    className={styles.composerTextarea}
                    style={{ minHeight: 36, maxHeight: 48, flex: 1, minWidth: 120 }}
                    placeholder={t('authority.preDeclaration.refIdPlaceholder')}
                    value={refIdAuth}
                    onChange={(e) => setRefIdAuth(e.target.value)}
                    disabled={sending}
                  />
                </div>
                <div className={styles.composerGrid}>
                  <div className={styles.composerMainCol}>
                    <div className={styles.fileRow}>
                      <input
                        ref={fileInputRef}
                        id="authority-messagerie-files"
                        type="file"
                        className={styles.fileInputHidden}
                        multiple
                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                        disabled={sending}
                        onChange={(e) => setPendingFiles(Array.from(e.target.files || []).slice(0, 3))}
                      />
                      <button
                        type="button"
                        className={styles.filePickBtn}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={sending}
                      >
                        <Paperclip size={16} aria-hidden />
                        {t('authority.preDeclaration.attachFiles')}
                      </button>
                      {pendingFiles.map((f, i) => (
                        <span key={`${f.name}-${i}`} className={styles.fileChip}>
                          <span className={styles.fileChipName}>{f.name}</span>
                          <button type="button" className={styles.fileChipRemove} onClick={() => removePendingFile(i)} aria-label={t('common.remove')}>
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <textarea
                      className={styles.composerTextarea}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder={t('authority.preDeclaration.messagePlaceholder')}
                      disabled={sending}
                      rows={2}
                    />
                  </div>
                  <button type="button" className={styles.sendBtn} onClick={() => void onSend()} disabled={sending || !draft.trim()}>
                    <Send size={18} aria-hidden />
                    {t('authority.preDeclaration.send')}
                  </button>
                </div>
              </div>
            </footer>
          )}
        </section>

        {rejectOpen && (
          <div className={styles.modalOverlay} role="dialog" aria-modal>
            <div className={styles.modalCard}>
              <h3 className={styles.title}>{t('authority.preDeclaration.rejectModalTitle')}</h3>
              <p className={styles.subtitle}>{t('authority.preDeclaration.rejectModalBody')}</p>
              <textarea
                value={rejectMotif}
                onChange={(e) => setRejectMotif(e.target.value)}
                rows={4}
                placeholder={t('authority.preDeclaration.rejectMotifPlaceholder')}
                style={{ width: '100%', marginTop: 8 }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
                <button type="button" className={styles.secondaryBtn} onClick={() => setRejectOpen(false)} disabled={busy}>
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  className={`${styles.primaryBtn} ${styles.dangerBtn}`}
                  onClick={() => void onRejectSubmit()}
                  disabled={busy || rejectMotif.trim().length < 3}
                >
                  {t('authority.preDeclaration.rejectConfirmAction')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthorityLayout>
  );
};
