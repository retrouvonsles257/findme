/**
 * Contacts d'urgence SOS (e-mails)
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../hooks';
import { useNotification } from '../../contexts';
import { CitizenLayout } from './CitizenLayout';
import { listMyContacts, addContact, deleteContact, requestContactVerificationToken, sendSosContactVerificationEmail, type ContactUrgenceRow } from '../../features/sos/sosApi';
import { PUBLIC_ROUTES } from '../../routes/routes.config';
import { Loader2 } from 'lucide-react';
import styles from './PreDeclarationCommon.module.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const CitizenSosContactsPage: React.FC = () => {
  const { t } = useI18n();
  const { addNotification } = useNotification();
  const [rows, setRows] = useState<ContactUrgenceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [relation, setRelation] = useState('');
  const [verifyBusyId, setVerifyBusyId] = useState<string | null>(null);
  const [emailBusyId, setEmailBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await listMyContacts());
    } catch (e: any) {
      addNotification({ title: t('errors.generic'), message: e?.message || '', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [addNotification, t]);

  useEffect(() => {
    load();
  }, [load]);

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim() || !email.trim()) return;
    if (!EMAIL_RE.test(email.trim())) {
      addNotification({ title: t('errors.invalid_input'), message: t('citizen.sos.contactEmail'), type: 'warning' });
      return;
    }
    try {
      await addContact({ nom, email, relation });
      setNom('');
      setEmail('');
      setRelation('');
      await load();
      addNotification({ title: t('common.ok'), message: '', type: 'success' });
    } catch (err: any) {
      addNotification({ title: t('errors.generic'), message: err?.message || '', type: 'error' });
    }
  };

  const onCopyVerifyLink = async (contactId: string) => {
    setVerifyBusyId(contactId);
    try {
      const tok = await requestContactVerificationToken(contactId);
      const url = `${window.location.origin}${PUBLIC_ROUTES.SOS_CONTACT_VERIFY}?token=${encodeURIComponent(tok)}`;
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        // navigateur sans presse-papiers
      }
      addNotification({
        title: t('citizen.sos.verifyLinkCopied'),
        message: url,
        type: 'success',
      });
    } catch (err: any) {
      addNotification({ title: t('errors.generic'), message: err?.message || '', type: 'error' });
    } finally {
      setVerifyBusyId(null);
    }
  };

  const onSendVerifyEmail = async (contactId: string) => {
    setEmailBusyId(contactId);
    try {
      const res = await sendSosContactVerificationEmail(contactId);
      if (res.ok && res.email_sent) {
        addNotification({ title: t('common.ok'), message: t('citizen.sos.verifyEmailSent'), type: 'success' });
        await load();
      } else if (res.token_saved) {
        addNotification({
          title: t('citizen.sos.verifyEmailPartial'),
          message: res.error || '',
          type: 'warning',
        });
        await load();
      } else {
        addNotification({ title: t('errors.generic'), message: res.error || '', type: 'error' });
      }
    } catch (err: any) {
      addNotification({ title: t('errors.generic'), message: err?.message || '', type: 'error' });
    } finally {
      setEmailBusyId(null);
    }
  };

  const onDelete = async (id: string) => {
    if (!window.confirm(t('citizen.sos.confirmDeleteContact'))) return;
    try {
      await deleteContact(id);
      await load();
    } catch (err: any) {
      addNotification({ title: t('errors.generic'), message: err?.message || '', type: 'error' });
    }
  };

  return (
    <CitizenLayout activeNav="sos" contentVariant="flush">
      <div className={styles.pageBleed}>
        <header className={styles.pageHeaderCard}>
          <div className={styles.headerRow}>
            <div>
              <h1 className={styles.title}>{t('citizen.sos.contactsTitle')}</h1>
              <p className={styles.subtitle}>{t('citizen.sos.contactsSubtitle')}</p>
            </div>
            <Link to="/citizen/sos" className={styles.secondaryBtn}>
              {t('common.back')}
            </Link>
          </div>
        </header>

        <section className={styles.sectionCard}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>{t('citizen.sos.formSectionTitle')}</h2>
          </div>
          <p className={styles.subtitle} style={{ marginTop: 0 }}>
            {t('citizen.sos.verifyLinkHelp')}
          </p>
          <form className={`${styles.form} ${styles.formPlain}`} onSubmit={onAdd}>
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label>{t('citizen.sos.contactNom')}</label>
                <input value={nom} onChange={(e) => setNom(e.target.value)} required />
              </div>
              <div className={styles.field}>
                <label>{t('citizen.sos.contactEmail')}</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>
            <div className={styles.field}>
              <label>{t('citizen.sos.contactRelation')}</label>
              <input value={relation} onChange={(e) => setRelation(e.target.value)} />
            </div>
            <button type="submit" className={styles.primaryBtn}>
              {t('citizen.sos.addContact')}
            </button>
          </form>
        </section>

        <section className={styles.sectionCard}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>{t('citizen.sos.contactsListTitle')}</h2>
          </div>
          {loading ? (
            <div className={styles.loadingState}>
              <Loader2 className={styles.loadingSpinner} size={22} aria-hidden />
              {t('common.loading')}
            </div>
          ) : rows.length === 0 ? (
            <p className={styles.emptyState}>{t('citizen.sos.noContacts')}</p>
          ) : (
            <div className={styles.cardList}>
              {rows.map((r) => (
                <div key={r.id} className={styles.card} style={{ cursor: 'default' }}>
                  <p className={styles.cardTitle}>{r.nom}</p>
                  <p className={styles.cardMeta}>{r.email}</p>
                  <p className={styles.cardMeta}>
                    <span className={r.email_verifie ? styles.statBadgeDone : styles.statBadge}>
                      {r.email_verifie ? t('citizen.sos.emailVerified') : t('citizen.sos.emailNotVerified')}
                    </span>
                  </p>
                  {r.relation && <p className={styles.cardMeta}>{r.relation}</p>}
                  <div className={styles.cardActions}>
                    <button
                      type="button"
                      className={styles.primaryBtn}
                      onClick={() => void onSendVerifyEmail(r.id)}
                      disabled={emailBusyId === r.id || verifyBusyId === r.id}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                    >
                      {emailBusyId === r.id ? (
                        <>
                          <Loader2 size={16} className={styles.loadingSpinner} aria-hidden />
                          {t('common.loading')}
                        </>
                      ) : (
                        t('citizen.sos.sendVerifyEmail')
                      )}
                    </button>
                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      onClick={() => void onCopyVerifyLink(r.id)}
                      disabled={verifyBusyId === r.id || emailBusyId === r.id}
                    >
                      {t('citizen.sos.verifyLinkButton')}
                    </button>
                    <button type="button" className={`${styles.secondaryBtn} ${styles.dangerBtn}`} onClick={() => onDelete(r.id)}>
                      {t('citizen.sos.deleteContact')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </CitizenLayout>
  );
};
