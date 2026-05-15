/**
 * Détail pré-déclaration + messagerie (citoyen)
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useI18n } from '../../hooks';
import { useAppSelector } from '../../store/types';
import { selectUser } from '../../features/auth/store/authSelectors';
import { CitizenLayout } from './CitizenLayout';
import {
  getConversationByPreDeclaration,
  getMessagePieceJointesForMessages,
  getMessageReferencesForMessages,
  getMessages,
  getPreDeclarationById,
  listOrganisationsForPreDeclaration,
  markMessagesReadForViewer,
  sendMessage,
  softDeleteOwnMessage,
  type ConversationRow,
  type MessagePieceJointeRow,
  type MessageReferenceRow,
  type MessageRow,
  type MessageReferenceTypeEntite,
  type MessageTypeMessagerie,
  type PreDeclarationRow,
} from '../../features/preDeclarations/preDeclarationApi';
import { useNotification } from '../../contexts';
import { supabase } from '../../config';
import { uploadFileToCloudinary } from '../../services/cloudinary';
import { Loader2, Paperclip, Send } from 'lucide-react';
import styles from './PreDeclarationCommon.module.css';

const REF_TYPES_CITIZEN: MessageReferenceTypeEntite[] = [
  'dossier',
  'pre_declaration',
  'signalement',
  'document',
  'personne',
  'alerte',
  'message',
  'localisation',
];

export const CitizenPreDeclarationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { addNotification } = useNotification();
  const currentUser = useAppSelector(selectUser);
  const userId = (currentUser as any)?.id;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pre, setPre] = useState<PreDeclarationRow | null>(null);
  const [convRow, setConvRow] = useState<ConversationRow | null>(null);
  const [convId, setConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [attachmentsByMessage, setAttachmentsByMessage] = useState<Record<string, MessagePieceJointeRow[]>>({});
  const [referencesByMessage, setReferencesByMessage] = useState<Record<string, MessageReferenceRow[]>>({});
  const [draft, setDraft] = useState('');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [refType, setRefType] = useState<MessageReferenceTypeEntite>('document');
  const [refId, setRefId] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [escaladeOrgLabel, setEscaladeOrgLabel] = useState<string | null>(null);

  const canChat = pre && (pre.statut === 'soumise' || pre.statut === 'en_examen');

  const refresh = useCallback(async () => {
    if (!id || !userId) return;
    const p = await getPreDeclarationById(id);
    if (!p || p.id_utilisateur !== userId) {
      setErr(t('citizen.preDeclaration.notFound'));
      setPre(null);
      return;
    }
    setPre(p);
    const c = await getConversationByPreDeclaration(id);
    setConvRow(c);
    setConvId(c?.id || null);
    if (c?.id) {
      const msgs = await getMessages(c.id);
      setMessages(msgs);
      const ids = msgs.map((m) => m.id);
      const [pj, rf] = await Promise.all([getMessagePieceJointesForMessages(ids), getMessageReferencesForMessages(ids)]);
      setAttachmentsByMessage(pj);
      setReferencesByMessage(rf);
      const others = msgs.filter((m) => m.id_auteur !== userId && !m.deleted_at).map((m) => m.id);
      await markMessagesReadForViewer(c.id, userId, others);
    } else {
      setAttachmentsByMessage({});
      setReferencesByMessage({});
    }
  }, [id, userId, t]);

  useEffect(() => {
    const oid = convRow?.id_organisation_escalade;
    if (!oid) {
      setEscaladeOrgLabel(null);
      return;
    }
    let cancelled = false;
    void listOrganisationsForPreDeclaration()
      .then((orgs) => {
        if (cancelled) return;
        const o = orgs.find((x) => x.id === oid);
        setEscaladeOrgLabel(o ? (o.region ? `${o.nom} — ${o.region}` : o.nom) : `${oid.slice(0, 8)}…`);
      })
      .catch(() => {
        if (!cancelled) setEscaladeOrgLabel(`${oid.slice(0, 8)}…`);
      });
    return () => {
      cancelled = true;
    };
  }, [convRow?.id_organisation_escalade]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id || !userId) return;
      setLoading(true);
      setErr(null);
      try {
        if (cancelled) return;
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
      .channel(`messagerie-citizen:${convId}`)
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

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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
            message: up.error || t('citizen.preDeclaration.uploadFailed'),
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
      const rid = refId.trim();
      const references =
        rid.length >= 32
          ? [{ type_entite: refType, id_entite: rid }]
          : undefined;
      await sendMessage({
        conversationId: convId,
        authorId: userId,
        corps: text,
        preDeclaration: pre,
        authorIsCitizenOwner: true,
        typeMessage: 'texte',
        pieceJointes: pieceJointes.length ? pieceJointes : undefined,
        references,
      });
      setDraft('');
      setPendingFiles([]);
      setRefId('');
      await refresh();
    } catch (e: any) {
      addNotification({ title: t('errors.generic'), message: e?.message || 'Erreur', type: 'error' });
    } finally {
      setSending(false);
    }
  };

  const onSoftDelete = async (messageId: string) => {
    if (!window.confirm(t('citizen.preDeclaration.confirmDeleteMessage'))) return;
    try {
      await softDeleteOwnMessage(messageId);
      await refresh();
    } catch (e: any) {
      addNotification({ title: t('errors.generic'), message: e?.message || '', type: 'error' });
    }
  };

  if (loading) {
    return (
      <CitizenLayout activeNav="pre-declarations" contentVariant="flush">
        <div className={styles.pageBleed}>
          <div className={styles.sectionCard}>
            <div className={styles.loadingState}>
              <Loader2 className={styles.loadingSpinner} size={22} aria-hidden />
              {t('common.loading')}
            </div>
          </div>
        </div>
      </CitizenLayout>
    );
  }

  if (err || !pre) {
    return (
      <CitizenLayout activeNav="pre-declarations" contentVariant="flush">
        <div className={styles.pageBleed}>
          <div className={styles.sectionCard}>
            <div className={styles.errorBox}>{err || t('citizen.preDeclaration.notFound')}</div>
            <Link to="/citizen/pre-declarations" className={styles.secondaryBtn} style={{ marginTop: 12 }}>
              {t('citizen.preDeclaration.backList')}
            </Link>
          </div>
        </div>
      </CitizenLayout>
    );
  }

  return (
    <CitizenLayout activeNav="pre-declarations" contentVariant="flush">
      <div className={styles.messagerieRoot}>
        <div className={styles.messagerieTop}>
          <header className={styles.pageHeaderCard}>
            <div className={styles.headerRow}>
              <div>
                <h1 className={styles.title}>
                  {pre.prenom_personne} {pre.nom_personne}
                </h1>
                <p className={styles.subtitle}>
                  {t(`citizen.preDeclaration.statut.${pre.statut}`)} · {pre.date_disparition}
                  {convRow?.statut ? ` · ${t('citizen.preDeclaration.convStatut')}: ${t(`citizen.preDeclaration.convStatutVal.${convRow.statut}`)}` : ''}
                  {escaladeOrgLabel ? ` · ${t('citizen.preDeclaration.escaladeActive', { nom: escaladeOrgLabel })}` : ''}
                </p>
              </div>
              <button type="button" className={styles.secondaryBtn} onClick={() => navigate('/citizen/pre-declarations')}>
                {t('citizen.preDeclaration.backList')}
              </button>
            </div>
          </header>

          <div className={styles.infoPanel}>
            <dl>
              <dt>{t('citizen.preDeclaration.fieldLieu')}</dt>
              <dd>{pre.lieu_disparition || '—'}</dd>
              <dt>{t('citizen.preDeclaration.fieldVille')}</dt>
              <dd>{pre.ville_disparition || '—'}</dd>
              <dt>{t('citizen.preDeclaration.fieldCirconstances')}</dt>
              <dd>{pre.circonstances}</dd>
              {pre.id_dossier && (
                <>
                  <dt>{t('citizen.preDeclaration.linkedDossier')}</dt>
                  <dd>
                    <Link to={`/citizen/dossier/${pre.id_dossier}`}>{pre.id_dossier}</Link>
                  </dd>
                </>
              )}
              {pre.statut === 'rejetee' && pre.motif_rejet && (
                <>
                  <dt>{t('authority.preDeclaration.rejectMotifLabel')}</dt>
                  <dd>{pre.motif_rejet}</dd>
                </>
              )}
            </dl>
          </div>

          {!canChat && (
            <div className={styles.bannerClosed}>{t(`citizen.preDeclaration.threadClosed.${pre.statut}`)}</div>
          )}
        </div>

        <section className={styles.messagerieThread}>
          <div className={styles.sectionHead} style={{ padding: '0.65rem 1rem 0', marginBottom: 0, border: 'none' }}>
            <h2 className={styles.sectionTitle}>{t('citizen.preDeclaration.messagesTitle')}</h2>
          </div>
          <div className={`${styles.chatBox} ${styles.chatBoxFlex}`}>
            {messages.length === 0 ? (
              <p className={styles.subtitle} style={{ margin: '0.5rem 0', textAlign: 'center' }}>
                {t('citizen.preDeclaration.noMessages')}
              </p>
            ) : (
              messages.map((m) => {
                const mine = m.id_auteur === userId;
                const deleted = Boolean(m.deleted_at);
                const tm = (m.type_message || 'texte') as MessageTypeMessagerie;
                const pjs = attachmentsByMessage[m.id] || [];
                const refs = referencesByMessage[m.id] || [];
                const meta = (m.metadonnees || {}) as Record<string, unknown>;
                return (
                  <div key={m.id} className={`${styles.bubble} ${mine ? styles.bubbleCitizen : styles.bubbleAuthority}`}>
                    {tm !== 'texte' && (
                      <div className={styles.msgTypeChip}>{t(`citizen.preDeclaration.messageType.${tm}`)}</div>
                    )}
                    {meta.demande_traitement ? (
                      <div className={styles.refChipRow} style={{ marginBottom: 6 }}>
                        <span className={styles.refChip}>{t('citizen.preDeclaration.metaDemandeTraitement')}</span>
                      </div>
                    ) : null}
                    {deleted ? <em>{t('citizen.preDeclaration.messageDeleted')}</em> : m.corps}
                    {refs.length > 0 && (
                      <div className={styles.refChipRow} style={{ marginTop: 6 }}>
                        {refs.map((r) => (
                          <span key={r.id} className={styles.refChip}>
                            {r.type_entite}:{r.id_entite.slice(0, 8)}…
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
                      {mine ? t('citizen.preDeclaration.you') : t('citizen.preDeclaration.authorityLabel')} ·{' '}
                      {new Date(m.created_at).toLocaleString()}
                      {mine && !deleted && canChat && (
                        <>
                          {' · '}
                          <button type="button" className={styles.linkBtn} onClick={() => void onSoftDelete(m.id)}>
                            {t('citizen.preDeclaration.deleteMessage')}
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
                <div className={styles.metaActionRow} style={{ marginBottom: '0.5rem' }}>
                  <span className={styles.subtitle}>{t('citizen.preDeclaration.optionalRef')}</span>
                  <select
                    className={styles.toolbarSelect}
                    style={{ maxWidth: 160 }}
                    value={refType}
                    onChange={(e) => setRefType(e.target.value as MessageReferenceTypeEntite)}
                  >
                    {REF_TYPES_CITIZEN.map((rt) => (
                      <option key={rt} value={rt}>
                        {t(`citizen.preDeclaration.refType.${rt}`)}
                      </option>
                    ))}
                  </select>
                  <input
                    className={styles.composerTextarea}
                    style={{ minHeight: 36, maxHeight: 48, flex: 1, minWidth: 120 }}
                    placeholder={t('citizen.preDeclaration.refIdPlaceholder')}
                    value={refId}
                    onChange={(e) => setRefId(e.target.value)}
                  />
                </div>
                <div className={styles.composerGrid}>
                  <div className={styles.composerMainCol}>
                    <div className={styles.fileRow}>
                      <input
                        ref={fileInputRef}
                        id="citizen-messagerie-files"
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
                        {t('citizen.preDeclaration.attachFiles')}
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
                      placeholder={t('citizen.preDeclaration.messagePlaceholder')}
                      disabled={sending}
                      rows={2}
                    />
                  </div>
                  <button type="button" className={styles.sendBtn} onClick={() => void onSend()} disabled={sending || !draft.trim()}>
                    <Send size={18} aria-hidden />
                    {t('citizen.preDeclaration.send')}
                  </button>
                </div>
              </div>
            </footer>
          )}
        </section>
      </div>
    </CitizenLayout>
  );
};
