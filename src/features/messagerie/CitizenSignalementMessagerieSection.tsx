/**
 * Fil messagerie signalement (citoyen auteur).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts';
import { useNotification } from '../../contexts';
import { useI18n } from '../../hooks';
import { supabase } from '../../config';
import { uploadFileToCloudinary } from '../../services/cloudinary';
import {
  ensureConversationForSignalement,
  getConversationBySignalementId,
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

export interface CitizenSignalementMessagerieSectionProps {
  signalementId: string;
  reporterUserId: string | null;
  responsibleOrgId: string | null;
}

export const CitizenSignalementMessagerieSection: React.FC<CitizenSignalementMessagerieSectionProps> = ({
  signalementId,
  reporterUserId,
  responsibleOrgId,
}) => {
  const { t } = useI18n();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const userId = user?.id;

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
    if (!signalementId || !userId) return;
    const c = await getConversationBySignalementId(signalementId);
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
  }, [signalementId, userId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!signalementId || !userId) return;
      setLoading(true);
      try {
        let c = await getConversationBySignalementId(signalementId);
        if (!c) {
          try {
            c = await ensureConversationForSignalement(signalementId);
          } catch {
            /* fil peut être créé plus tard par l’autorité */
          }
        }
        if (!cancelled) await refresh();
      } catch (e: unknown) {
        if (!cancelled) {
          addNotification({
            title: t('errors.generic'),
            message: (e as { message?: string })?.message || '',
            type: 'error',
            duration: 10000,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [signalementId, userId, refresh, addNotification, t]);

  useEffect(() => {
    if (!convId) return;
    const poll = window.setInterval(() => {
      void refresh();
    }, 8000);
    const channel = supabase
      .channel(`messagerie-citizen-sig:${convId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'message', filter: `id_conversation=eq.${convId}` },
        () => {
          void refresh();
        },
      )
      .subscribe();
    return () => {
      window.clearInterval(poll);
      void supabase.removeChannel(channel);
    };
  }, [convId, refresh]);

  const onEnsureThread = async () => {
    if (!signalementId) return;
    setEnsuring(true);
    try {
      await ensureConversationForSignalement(signalementId);
      await refresh();
      addNotification({ title: t('authority.messagerieContext.threadReady'), message: '', type: 'success' });
    } catch (e: unknown) {
      addNotification({
        title: t('errors.generic'),
        message: (e as { message?: string })?.message || '',
        type: 'error',
      });
    } finally {
      setEnsuring(false);
    }
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
        signalementThread: {
          signalementId,
          reporterUserId,
          responsibleOrgId,
        },
      });
      setDraft('');
      setPendingFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await refresh();
    } catch (e: unknown) {
      addNotification({
        title: t('errors.generic'),
        message: (e as { message?: string })?.message || '',
        type: 'error',
      });
    } finally {
      setSending(false);
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
              return (
                <div key={m.id} className={`${pdStyles.bubble} ${mine ? pdStyles.bubbleCitizen : pdStyles.bubbleAuthority}`}>
                  {deleted ? <em>{t('citizen.preDeclaration.messageDeleted')}</em> : m.corps}
                  {pjs.length > 0 && (
                    <ul className={pdStyles.attachmentList}>
                      {pjs.map((pj) => (
                        <li key={pj.id}>
                          <a href={pj.url_storage} target="_blank" rel="noopener noreferrer">
                            {pj.nom_fichier}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className={pdStyles.bubbleMeta}>
                    {mine ? t('citizen.preDeclaration.you') : t('citizen.preDeclaration.authorityLabel')} ·{' '}
                    {new Date(m.created_at).toLocaleString()}
                  </div>
                </div>
              );
            })
          )}
        </div>
        <footer className={pdStyles.composerBar}>
          <div className={pdStyles.composerBarInner}>
            <textarea
              className={pdStyles.composerTextarea}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t('citizen.preDeclaration.messagePlaceholder')}
              disabled={sending}
              rows={2}
            />
            <button type="button" className={pdStyles.sendBtn} onClick={() => void onSend()} disabled={sending || !draft.trim()}>
              <Send size={18} aria-hidden />
              {t('citizen.preDeclaration.send')}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
};
