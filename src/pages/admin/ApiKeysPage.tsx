/**
 * =====================================================
 * RETROUVONSLES - Admin API Keys Page
 * Gestion des clés API de l'organisation
 * =====================================================
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, ArrowLeft, Plus, Copy, Trash2, Loader2, X } from 'lucide-react';
import { useAppSelector } from '../../store/types';
import { AdminOrganisationLayout } from './AdminOrganisationLayout';
import { Card, CardBody, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useI18n } from '../../hooks';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { NomRole } from '../../@types/enums.types';
import {
  listAdminApiKeys,
  createAdminApiKey,
  revokeAdminApiKey,
  type AdminApiKeyRow,
} from '../../features/admin-organisation/services';
import styles from './ApiKeysPage.module.css';

function generateApiKey(): { key: string; prefix: string } {
  const key = 'rvl_' + (typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().replace(/-/g, '').slice(0, 28)
    : Array.from({ length: 28 }, () => Math.random().toString(36)[2]).join(''));
  return { key, prefix: key.slice(0, 12) };
}

export const AdminOrganisationApiKeysPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const currentUser = useAppSelector(selectCurrentUser);
  const [loading, setLoading] = useState(true);
  const [keys, setKeys] = useState<AdminApiKeyRow[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<{ key: string; nom_cle: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const loadKeys = useCallback(async () => {
    const orgId = currentUser?.organisation_id;
    if (!orgId) return;
    try {
      setLoading(true);
      const list = await listAdminApiKeys(orgId);
      setKeys(list);
    } catch (e) {
      console.error('Erreur chargement clés API:', e);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.organisation_id]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== NomRole.ADMIN_ORGANISATION) {
      navigate('/auth/login');
      return;
    }
    loadKeys();
  }, [currentUser, navigate, loadKeys]);

  const handleCreateSubmit = async () => {
    const orgId = currentUser?.organisation_id;
    const name = newKeyName.trim();
    if (!orgId || !name) return;
    setSaving(true);
    try {
      const { key, prefix } = generateApiKey();
      await createAdminApiKey(orgId, name, prefix);
      setCreatedKey({ key, nom_cle: name });
      setNewKeyName('');
    } catch (e) {
      console.error('Erreur création clé:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCreatedKey(null);
    setNewKeyName('');
    loadKeys();
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
  };

  const handleRevoke = async (keyId: string) => {
    const orgId = currentUser?.organisation_id;
    if (!orgId || !window.confirm(t('admin.revokeApiKeyConfirm'))) return;
    setRevokingId(keyId);
    try {
      await revokeAdminApiKey(orgId, keyId);
      await loadKeys();
    } catch (e) {
      console.error('Erreur révocation:', e);
    } finally {
      setRevokingId(null);
    }
  };

  if (!currentUser || currentUser.role !== NomRole.ADMIN_ORGANISATION) {
    return null;
  }

  return (
    <AdminOrganisationLayout title={t('admin.apiKeys')} activeNav="parametres">
      <div className={styles.page}>
        <div className={styles.header}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => navigate('/admin/parametres')}
          >
            <ArrowLeft size={20} />
            {t('common.back')}
          </button>
        </div>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h1 className={styles.title}>
              <Key size={28} style={{ flexShrink: 0 }} />
              {t('admin.apiKeys')}
            </h1>
            <p className={styles.subtitle}>{t('admin.manageApiKeys')}</p>
            <Button variant="primary" onClick={() => setShowModal(true)}>
              <Plus size={18} />
              {t('admin.createApiKey')}
            </Button>
          </div>
          <CardBody>
            {loading ? (
              <div className={styles.loading}>
                <Loader2 size={32} className={styles.spinner} />
                <p>{t('common.loading')}</p>
              </div>
            ) : keys.length === 0 ? (
              <p className={styles.empty}>{t('admin.noApiKeys')}</p>
            ) : (
              <ul className={styles.list}>
                {keys.map(k => (
                  <li key={k.id} className={styles.listItem}>
                    <div className={styles.listItemMain}>
                      <span className={styles.listItemName}>{k.nom_cle}</span>
                      <code className={styles.listItemPrefix}>{k.prefix_cle}…</code>
                      <span className={styles.listItemDate}>
                        {new Date(k.created_at).toLocaleDateString()}
                      </span>
                      {k.revoked_at ? (
                        <Badge variant="secondary">{t('admin.revoked')}</Badge>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={!!revokingId}
                          onClick={() => handleRevoke(k.id)}
                        >
                          {revokingId === k.id ? <Loader2 size={16} className={styles.spinner} /> : <Trash2 size={16} />}
                          {t('admin.revoke')}
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </div>
      </div>

      {showModal && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{createdKey ? t('admin.apiKeyCreated') : t('admin.createApiKey')}</h2>
              <button type="button" className={styles.modalClose} onClick={handleCloseModal}>
                <X size={24} />
              </button>
            </div>
            <div className={styles.modalBody}>
              {createdKey ? (
                <>
                  <p className={styles.modalWarning}>{t('admin.apiKeyShowOnce')}</p>
                  <div className={styles.keyDisplay}>
                    <code>{createdKey.key}</code>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleCopyKey(createdKey.key)}
                    >
                      <Copy size={16} />
                      {t('common.copy')}
                    </Button>
                  </div>
                  <p className={styles.keyName}>{createdKey.nom_cle}</p>
                  <Button variant="primary" onClick={handleCloseModal}>
                    {t('common.close')}
                  </Button>
                </>
              ) : (
                <>
                  <label className={styles.label}>{t('admin.apiKeyName')}</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={newKeyName}
                    onChange={e => setNewKeyName(e.target.value)}
                    placeholder={t('admin.apiKeyNamePlaceholder')}
                  />
                  <div className={styles.modalActions}>
                    <Button variant="secondary" onClick={handleCloseModal}>
                      {t('admin.cancel')}
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleCreateSubmit}
                      disabled={saving || !newKeyName.trim()}
                    >
                      {saving ? t('admin.creating') : t('admin.create')}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminOrganisationLayout>
  );
};

export default AdminOrganisationApiKeysPage;
