/**
 * Fil messagerie dossier (citoyen créateur du dossier).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts';
import { useNotification } from '../../contexts';
import { useI18n } from '../../hooks';
import { supabase } from '../../config';
import { uploadFileToCloudinary } from '../../services/cloudinary';
import {
  ensureConversationForDossier,
  getConversationByDossierId,
  getMessagePieceJointesForMessages,
  getMessageReferencesForMessages,
  getMessages,
  markMessagesReadForViewer,
  sendContextMessagerieMessage,
  softDeleteOwnMessage,
  type ConversationRow,
  type MessagePieceJointeRow,
  type MessageReferenceRow,
  type MessageRow,
} from '../preDeclarations/preDeclarationApi';
import { Loader2, Paperclip, Send } from 'lucide-react';
import pdStyles from '../../pages/citizen/PreDeclarationCommon.module.css';

export interface CitizenDossierMessagerieSectionProps {
  dossierId: string;
  creatorUserId: string | null;
  responsibleOrgId: string | null;
}

export const CitizenDossierMessagerieSection: React.FC<CitizenDossierMessagerieSectionProps> = ({
  dossierId,
  creatorUserId,
  responsibleOrgId,
}) => {
  const { t } = useI18n();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const userId = user?.id;

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
    if (!dossierId || !userId) return;
    const c = await getConversationByDossierId(dossierId);
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
  }, [dossierId, userId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!dossierId || !userId) return;
      setLoading(true);
      try {
        await refresh();
      } catch (e: any) {
        if (!cancelled) addNotification({ title: t('errors.generic'), message: e?.message || '', type: 'error' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dossierId, userId, refresh, addNotification, t]);

  useEffect(() => {
    if (!convId) return;
    const channel = supabase
      .channel(`messagerie-citizen-dos:${convId}`)
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
    if (!dossierId) return;
    setEnsuring(true);
    try {
      await ensureConversationForDossier(dossierId);
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

      await sendContextMessagerieMessage({
        conversationId: convId,
        authorId: userId,
        corps: draft.trim(),
        authorIsCitizen: true,
        pieceJointes: pieceJointes.length ? pieceJointes : undefined,
        dossierThread: {
          dossierId,
          creatorUserId,
          responsibleOrgId,
        },
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
    if (!window.confirm(t('citizen.preDeclaration.confirmDeleteMessage'))) return;
    try {
      await softDeleteOwnMessage(messageId);
      await refresh();
    } catch (e: any) {
      addNotification({ title: t('errors.generic'), message: e?.message || '', type: 'error' });
    }
  };

  if (!userId) return null;

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
        <div className={`${pdStyles.chatBox} ${pdStyles.chatBoxFlex}`}>
          {messages.length === 0 ? (
            <p className={pdStyles.subtitle} style={{ margin: '0.5rem 0', textAlign: 'center' }}>
              {t('citizen.preDeclaration.noMessages')}
            </p>
          ) : (
            messages.map((m) => {
              const mine = m.id_auteur === userId;
              const deleted = Boolean(m.deleted_at);
              const pjs = attachmentsByMessage[m.id] || [];
              const refs = referencesByMessage[m.id] || [];
              return (
                <div key={m.id} className={`${pdStyles.bubble} ${mine ? pdStyles.bubbleCitizen : pdStyles.bubbleAuthority}`}>
                  {deleted ? <em>{t('citizen.preDeclaration.messageDeleted')}</em> : m.corps}
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
                    {mine ? t('citizen.preDeclaration.you') : t('citizen.preDeclaration.authorityLabel')} ·{' '}
                    {new Date(m.created_at).toLocaleString()}
                    {mine && !deleted && (
                      <>
                        {' · '}
                        <button type="button" className={pdStyles.linkBtn} onClick={() => void onSoftDelete(m.id)}>
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

        <footer className={pdStyles.composerBar}>
          <div className={pdStyles.composerBarInner}>
            <div className={pdStyles.composerGrid}>
              <div className={pdStyles.composerMainCol}>
                <div className={pdStyles.fileRow}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className={pdStyles.fileInputHidden}
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    disabled={sending}
                    onChange={(e) => setPendingFiles(Array.from(e.target.files || []).slice(0, 3))}
                  />
                  <button type="button" className={pdStyles.filePickBtn} onClick={() => fileInputRef.current?.click()} disabled={sending}>
                    <Paperclip size={16} aria-hidden />
                    {t('citizen.preDeclaration.attachFiles')}
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
                  placeholder={t('citizen.preDeclaration.messagePlaceholder')}
                  disabled={sending}
                  rows={2}
                />
              </div>
              <button type="button" className={pdStyles.sendBtn} onClick={() => void onSend()} disabled={sending || !draft.trim()}>
                <Send size={18} aria-hidden />
                {t('citizen.preDeclaration.send')}
              </button>
            </div>
          </div>
        </footer>
      </section>
    </div>
  );
};
