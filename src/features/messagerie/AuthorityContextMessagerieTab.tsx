/**
 * Fil de messagerie lié à un dossier ou un signalement (vue autorité).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts';
import { useNotification } from '../../contexts';
import { useI18n } from '../../hooks';
import { useAppSelector } from '../../store/types';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { supabase } from '../../config';
import { uploadFileToCloudinary } from '../../services/cloudinary';
import {
  ensureConversationForDossier,
  ensureConversationForSignalement,
  getConversationByDossierId,
  getConversationBySignalementId,
  getMessagePieceJointesForMessages,
  getMessageReferencesForMessages,
  getMessages,
  markMessagesReadForViewer,
  markMessageMessagerieTraite,
  sendContextMessagerieMessage,
  softDeleteOwnMessage,
  type ConversationRow,
  type MessagePieceJointeRow,
  type MessageReferenceRow,
  type MessageRow,
} from '../preDeclarations/preDeclarationApi';
import { Loader2, Paperclip, Send } from 'lucide-react';
import pdStyles from '../../pages/citizen/PreDeclarationCommon.module.css';

export type AuthorityMessagerieContextKind = 'dossier' | 'signalement';

export interface AuthorityContextMessagerieTabProps {
  kind: AuthorityMessagerieContextKind;
  /** id dossier ou id signalement */
  entityId: string;
  dossierMeta?: {
    dossierId: string;
    creatorUserId: string | null;
    responsibleOrgId: string | null;
  } | null;
  signalementMeta?: {
    signalementId: string;
    reporterUserId: string | null;
    responsibleOrgId: string | null;
  } | null;
}

export const AuthorityContextMessagerieTab: React.FC<AuthorityContextMessagerieTabProps> = ({
  kind,
  entityId,
  dossierMeta,
  signalementMeta,
}) => {
  const { t } = useI18n();
  const { user } = useAuth();
  const currentUser = useAppSelector(selectCurrentUser);
  const { addNotification } = useNotification();
  const userId = user?.id;
  const orgId = (currentUser as { organisation_id?: string } | null)?.organisation_id ?? null;

  const [convRow, setConvRow] = useState<ConversationRow | null>(null);
  const [convId, setConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [attachmentsByMessage, setAttachmentsByMessage] = useState<Record<string, MessagePieceJointeRow[]>>({});
  const [referencesByMessage, setReferencesByMessage] = useState<Record<string, MessageReferenceRow[]>>({});
  const [loading, setLoading] = useState(true);
  const [ensuring, setEnsuring] = useState(false);
  const [draft, setDraft] = useState('');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    if (!entityId || !userId) return;
    let c: ConversationRow | null = null;
    if (kind === 'dossier') {
      c = await getConversationByDossierId(entityId);
    } else {
      c = await getConversationBySignalementId(entityId);
    }
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
      setMessages([]);
      setAttachmentsByMessage({});
      setReferencesByMessage({});
    }
  }, [entityId, userId, kind]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!entityId || !userId) return;
      setLoading(true);
      try {
        await refresh();
      } catch (e: any) {
        if (!cancelled) {
          addNotification({ title: t('errors.generic'), message: e?.message || '', type: 'error' });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [entityId, userId, refresh, addNotification, t]);

  useEffect(() => {
    if (!convId) return;
    const channel = supabase
      .channel(`messagerie-ctx:${convId}`)
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

  const onEnsureThread = async () => {
    if (!entityId || !userId) return;
    if (kind === 'signalement' && !orgId) {
      addNotification({
        title: t('errors.generic'),
        message: t('authority.messagerieContext.orgRequiredHint'),
        type: 'error',
      });
      return;
    }
    setEnsuring(true);
    try {
      if (kind === 'dossier') {
        await ensureConversationForDossier(entityId);
      } else {
        await ensureConversationForSignalement(entityId);
      }
      await refresh();
      addNotification({ title: t('authority.messagerieContext.threadReady'), message: '', type: 'success' });
    } catch (e: any) {
      addNotification({ title: t('errors.generic'), message: e?.message || '', type: 'error' });
    } finally {
      setEnsuring(false);
    }
  };

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onSend = async () => {
    if (!convId || !userId || !draft.trim()) return;
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

      const dossierThread =
        kind === 'dossier' && dossierMeta
          ? {
              dossierId: dossierMeta.dossierId,
              creatorUserId: dossierMeta.creatorUserId,
              responsibleOrgId: dossierMeta.responsibleOrgId,
            }
          : null;

      const signalementThread =
        kind === 'signalement' && signalementMeta
          ? {
              signalementId: signalementMeta.signalementId,
              reporterUserId: signalementMeta.reporterUserId,
              responsibleOrgId: signalementMeta.responsibleOrgId,
            }
          : null;

      await sendContextMessagerieMessage({
        conversationId: convId,
        authorId: userId,
        corps: draft.trim(),
        authorIsCitizen: false,
        pieceJointes: pieceJointes.length ? pieceJointes : undefined,
        dossierThread,
        signalementThread,
      });
      setDraft('');
      setPendingFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await refresh();
    } catch (e: any) {
      addNotification({ title: t('errors.generic'), message: e?.message || '', type: 'error' });
    } finally {
      setSending(false);
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

  if (!userId) {
    return <p className={pdStyles.subtitle}>{t('citizen.preDeclaration.mustLogin')}</p>;
  }

  if (loading) {
    return (
      <div className={pdStyles.loadingState}>
        <Loader2 className={pdStyles.loadingSpinner} size={22} aria-hidden />
        {t('common.loading')}
      </div>
    );
  }

  if (!convId) {
    return (
      <div className={pdStyles.sectionCard}>
        <p className={pdStyles.subtitle}>{t('authority.messagerieContext.noThread')}</p>
        <button type="button" className={pdStyles.primaryBtn} onClick={() => void onEnsureThread()} disabled={ensuring}>
          {ensuring ? t('common.loading') : t('authority.messagerieContext.openThread')}
        </button>
      </div>
    );
  }

  return (
    <div className={pdStyles.messagerieRoot} style={{ minHeight: 0 }}>
      <section className={pdStyles.messagerieThread}>
        <div className={pdStyles.sectionHead} style={{ padding: '0.65rem 1rem 0', marginBottom: 0, border: 'none' }}>
          <h2 className={pdStyles.sectionTitle}>{t('authority.messagerieContext.messagesTitle')}</h2>
          {convRow?.statut ? (
            <p className={pdStyles.subtitle}>
              {t('authority.preDeclaration.convStatut')}: {t(`authority.preDeclaration.convStatutVal.${convRow.statut}` as const)}
            </p>
          ) : null}
        </div>
        <div className={`${pdStyles.chatBox} ${pdStyles.chatBoxFlex}`}>
          {messages.length === 0 ? (
            <p className={pdStyles.subtitle} style={{ margin: '0.5rem 0', textAlign: 'center' }}>
              {t('authority.preDeclaration.noMessages')}
            </p>
          ) : (
            messages.map((m) => {
              const mine = m.id_auteur === userId;
              const deleted = Boolean(m.deleted_at);
              const pjs = attachmentsByMessage[m.id] || [];
              const refs = referencesByMessage[m.id] || [];
              const meta = (m.metadonnees || {}) as Record<string, unknown>;
              const traite = Boolean(meta.traite_messagerie);
              return (
                <div key={m.id} className={`${pdStyles.bubble} ${mine ? pdStyles.bubbleCitizen : pdStyles.bubbleAuthority}`}>
                  {traite ? (
                    <div className={pdStyles.refChipRow} style={{ marginBottom: 6 }}>
                      <span className={pdStyles.refChip}>{t('authority.messagerieContext.badgeTraite')}</span>
                    </div>
                  ) : null}
                  {deleted ? <em>{t('authority.preDeclaration.messageDeleted')}</em> : m.corps}
                  {refs.length > 0 && (
                    <div className={pdStyles.refChipRow} style={{ marginTop: 6 }}>
                      {refs.map((r) => (
                        <span key={r.id} className={pdStyles.refChip}>
                          {r.type_entite}:{r.id_entite.slice(0, 8)}…
                        </span>
                      ))}
                    </div>
                  )}
                  {pjs.length > 0 && (
                    <ul className={pdStyles.attachmentList}>
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
                  <div className={pdStyles.bubbleMeta}>
                    {mine ? t('authority.preDeclaration.you') : t('authority.preDeclaration.citizenLabel')} ·{' '}
                    {new Date(m.created_at).toLocaleString()}
                    {mine && !deleted && (
                      <>
                        {' · '}
                        <button type="button" className={pdStyles.linkBtn} onClick={() => void onSoftDelete(m.id)}>
                          {t('authority.preDeclaration.deleteMessage')}
                        </button>
                      </>
                    )}
                    {!mine && !deleted && orgId && !traite ? (
                      <>
                        {' · '}
                        <button type="button" className={pdStyles.linkBtn} onClick={() => void onMarkTraite(m.id)}>
                          {t('authority.messagerieContext.markTraite')}
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <footer className={pdStyles.composerBar}>
          <div className={pdStyles.composerBarInner}>
            <div className={pdStyles.composerGrid}>
              <div className={pdStyles.composerMainCol}>
                <div className={pdStyles.fileRow}>
                  <input
                    ref={fileInputRef}
                    id={`ctx-messagerie-files-${entityId}`}
                    type="file"
                    className={pdStyles.fileInputHidden}
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    disabled={sending}
                    onChange={(e) => setPendingFiles(Array.from(e.target.files || []).slice(0, 3))}
                  />
                  <button
                    type="button"
                    className={pdStyles.filePickBtn}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sending}
                  >
                    <Paperclip size={16} aria-hidden />
                    {t('authority.preDeclaration.attachFiles')}
                  </button>
                  {pendingFiles.map((f, i) => (
                    <span key={`${f.name}-${i}`} className={pdStyles.fileChip}>
                      <span className={pdStyles.fileChipName}>{f.name}</span>
                      <button type="button" className={pdStyles.fileChipRemove} onClick={() => removePendingFile(i)} aria-label={t('common.remove')}>
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <textarea
                  className={pdStyles.composerTextarea}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={t('authority.messagerieContext.placeholder')}
                  disabled={sending}
                  rows={2}
                />
              </div>
              <button type="button" className={pdStyles.sendBtn} onClick={() => void onSend()} disabled={sending || !draft.trim()}>
                <Send size={18} aria-hidden />
                {t('authority.preDeclaration.send')}
              </button>
            </div>
          </div>
        </footer>
      </section>
    </div>
  );
};
