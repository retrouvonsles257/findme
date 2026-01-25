/**
 * =====================================================
 * RETROUVONSLES - Super Admin System Users Page
 * Gestion des utilisateurs système avec CRUD complet
 * Connecté à Supabase
 * =====================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../../hooks';
import { supabase } from '../../config';
import { SuperAdminLayout } from './SuperAdminLayout';
import { 
  Users, Shield, Mail, Plus, Edit2, Trash2, X, Check, 
  Loader2, AlertCircle, Search, Eye, Building2, ToggleLeft, ToggleRight 
} from 'lucide-react';
import styles from './SystemUsersPage.module.css';

interface Role {
  id: string;
  nom: string;
  description?: string;
}

interface Organisation {
  id: string;
  nom: string;
}

interface Utilisateur {
  id: string;
  nom: string;
  prenom?: string;
  email: string;
  telephone?: string;
  id_organisation?: string;
  organisation?: Organisation;
  roles?: Role[];
  statut_actif: boolean;
  date_verification_email?: string;
  created_at: string;
}

export const SuperAdminSystemUsersPage: React.FC = () => {
  const { t } = useI18n();
  
  const [users, setUsers] = useState<Utilisateur[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedUser, setSelectedUser] = useState<Utilisateur | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    id_organisation: '',
    selectedRoles: [] as string[],
    statut_actif: true,
  });

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Charger les données
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [usersResult, rolesResult, orgsResult] = await Promise.all([
        (supabase as any).from('utilisateur').select('*').order('created_at', { ascending: false }),
        (supabase as any).from('role').select('*'),
        (supabase as any).from('organisation').select('id, nom').eq('statut_actif', true),
      ]);

      if (usersResult.error) throw usersResult.error;
      if (rolesResult.error) throw rolesResult.error;
      if (orgsResult.error) throw orgsResult.error;

      // Enrichir les utilisateurs avec leurs rôles et organisations
      const enrichedUsers = await Promise.all(
        (usersResult.data || []).map(async (user: Utilisateur) => {
          // Récupérer les rôles
          const { data: userRoles } = await (supabase as any)
            .from('utilisateur_role')
            .select('id_role, role:role(*)')
            .eq('id_utilisateur', user.id);
          
          // Récupérer l'organisation
          let organisation: Organisation | undefined;
          if (user.id_organisation) {
            const { data: org } = await (supabase as any)
              .from('organisation')
              .select('id, nom')
              .eq('id', user.id_organisation)
              .single();
            organisation = org;
          }
          
          return {
            ...user,
            roles: userRoles?.map((ur: any) => ur.role) || [],
            organisation,
          };
        })
      );

      setUsers(enrichedUsers);
      setRoles(rolesResult.data || []);
      setOrganisations(orgsResult.data || []);
    } catch (err: any) {
      console.error('Erreur chargement utilisateurs:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtrer les utilisateurs
  const filteredUsers = users.filter(user =>
    user.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.prenom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Ouvrir modal création
  const openCreateModal = () => {
    setFormData({
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      id_organisation: '',
      selectedRoles: [],
      statut_actif: true,
    });
    setSelectedUser(null);
    setModalMode('create');
    setShowModal(true);
  };

  // Ouvrir modal édition
  const openEditModal = (user: Utilisateur) => {
    setFormData({
      nom: user.nom,
      prenom: user.prenom || '',
      email: user.email,
      telephone: user.telephone || '',
      id_organisation: user.id_organisation || '',
      selectedRoles: user.roles?.map(r => r.id) || [],
      statut_actif: user.statut_actif,
    });
    setSelectedUser(user);
    setModalMode('edit');
    setShowModal(true);
  };

  // Ouvrir modal vue
  const openViewModal = (user: Utilisateur) => {
    setSelectedUser(user);
    setModalMode('view');
    setShowModal(true);
  };

  // Sauvegarder utilisateur
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      if (modalMode === 'create') {
        // Créer l'utilisateur
        const { data: newUser, error: insertError } = await (supabase as any)
          .from('utilisateur')
          .insert({
            nom: formData.nom,
            prenom: formData.prenom || null,
            email: formData.email,
            telephone: formData.telephone || null,
            id_organisation: formData.id_organisation || null,
            statut_actif: formData.statut_actif,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Assigner les rôles
        if (formData.selectedRoles.length > 0 && newUser) {
          const roleInserts = formData.selectedRoles.map(roleId => ({
            id_utilisateur: newUser.id,
            id_role: roleId,
          }));
          await (supabase as any).from('utilisateur_role').insert(roleInserts);
        }
      } else if (modalMode === 'edit' && selectedUser) {
        // Mettre à jour l'utilisateur
        const { error: updateError } = await (supabase as any)
          .from('utilisateur')
          .update({
            nom: formData.nom,
            prenom: formData.prenom || null,
            email: formData.email,
            telephone: formData.telephone || null,
            id_organisation: formData.id_organisation || null,
            statut_actif: formData.statut_actif,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedUser.id);

        if (updateError) throw updateError;

        // Mettre à jour les rôles
        await (supabase as any).from('utilisateur_role').delete().eq('id_utilisateur', selectedUser.id);
        if (formData.selectedRoles.length > 0) {
          const roleInserts = formData.selectedRoles.map(roleId => ({
            id_utilisateur: selectedUser.id,
            id_role: roleId,
          }));
          await (supabase as any).from('utilisateur_role').insert(roleInserts);
        }
      }

      setShowModal(false);
      loadData();
    } catch (err: any) {
      console.error('Erreur sauvegarde:', err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Supprimer utilisateur
  const handleDelete = async (id: string) => {
    try {
      // Supprimer d'abord les rôles liés
      await (supabase as any).from('utilisateur_role').delete().eq('id_utilisateur', id);
      
      // Puis supprimer l'utilisateur
      const { error: deleteError } = await (supabase as any)
        .from('utilisateur')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setDeleteConfirm(null);
      loadData();
    } catch (err: any) {
      console.error('Erreur suppression:', err);
      setError(err.message);
    }
  };

  // Toggle statut actif
  const toggleStatus = async (user: Utilisateur) => {
    try {
      const { error: updateError } = await (supabase as any)
        .from('utilisateur')
        .update({ statut_actif: !user.statut_actif, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (updateError) throw updateError;
      loadData();
    } catch (err: any) {
      console.error('Erreur toggle statut:', err);
      setError(err.message);
    }
  };

  const toggleRole = (roleId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedRoles: prev.selectedRoles.includes(roleId)
        ? prev.selectedRoles.filter(id => id !== roleId)
        : [...prev.selectedRoles, roleId]
    }));
  };

  return (
    <SuperAdminLayout title={t('super_admin.systemUsersTitle')} activeNav="system-users">
      <div className={styles['sa-system-users']}>
        {/* Header */}
        <div className={styles['sa-system-users__header']}>
          <div className={styles['sa-system-users__search']}>
            <Search size={18} />
            <input
              type="text"
              placeholder={t('common.search') || 'Rechercher...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className={styles['sa-system-users__add-btn']} onClick={openCreateModal}>
            <Plus size={20} />
            {t('common.add')}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className={styles['sa-system-users__error']}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className={styles['sa-system-users__loading']}>
            <Loader2 size={32} className={styles['sa-system-users__spinner']} />
          </div>
        ) : (
          <div className={styles['sa-system-users__table-wrapper']}>
            {filteredUsers.length === 0 ? (
              <div className={styles['sa-system-users__empty']}>
                <Users size={48} />
                <p>{t('common.noData') || 'Aucun utilisateur'}</p>
              </div>
            ) : (
              <table className={styles['sa-system-users__table']}>
                <thead>
                  <tr>
                    <th><Users size={16} /> {t('common.name')}</th>
                    <th><Mail size={16} /> {t('common.email')}</th>
                    <th><Building2 size={16} /> Organisation</th>
                    <th><Shield size={16} /> {t('common.role')}</th>
                    <th>{t('common.status')}</th>
                    <th>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>{user.prenom} {user.nom}</td>
                      <td>{user.email}</td>
                      <td>{user.organisation?.nom || '-'}</td>
                      <td>
                        <div className={styles['sa-system-users__roles']}>
                          {user.roles?.map(role => (
                            <span key={role.id} className={styles['sa-system-users__role-badge']}>
                              {role.nom}
                            </span>
                          ))}
                          {(!user.roles || user.roles.length === 0) && '-'}
                        </div>
                      </td>
                      <td>
                        <span className={`${styles['sa-system-users__badge']} ${user.statut_actif ? styles['sa-system-users__badge--active'] : styles['sa-system-users__badge--inactive']}`}>
                          {user.statut_actif ? t('common.active') : t('common.inactive')}
                        </span>
                      </td>
                      <td>
                        <div className={styles['sa-system-users__actions']}>
                          <button onClick={() => openViewModal(user)} title={t('common.view')}><Eye size={16} /></button>
                          <button onClick={() => openEditModal(user)} title={t('common.edit')}><Edit2 size={16} /></button>
                          <button onClick={() => toggleStatus(user)} title={user.statut_actif ? t('common.deactivate') : t('common.activate')}>
                            {user.statut_actif ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                          </button>
                          <button onClick={() => setDeleteConfirm(user.id)} className={styles['sa-system-users__btn-delete']} title={t('common.delete')}><Trash2 size={16} /></button>
                        </div>

                        {/* Delete Confirmation */}
                        {deleteConfirm === user.id && (
                          <div className={styles['sa-system-users__delete-confirm']}>
                            <p>{t('common.confirmDelete')}</p>
                            <div>
                              <button onClick={() => handleDelete(user.id)}><Check size={16} /></button>
                              <button onClick={() => setDeleteConfirm(null)}><X size={16} /></button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className={styles['sa-system-users__modal-overlay']} onClick={() => setShowModal(false)}>
            <div className={styles['sa-system-users__modal']} onClick={(e) => e.stopPropagation()}>
              <div className={styles['sa-system-users__modal-header']}>
                <h2>
                  {modalMode === 'create' && (t('super_admin.addUser') || 'Nouvel utilisateur')}
                  {modalMode === 'edit' && (t('super_admin.editUser') || 'Modifier utilisateur')}
                  {modalMode === 'view' && `${selectedUser?.prenom} ${selectedUser?.nom}`}
                </h2>
                <button onClick={() => setShowModal(false)}><X size={20} /></button>
              </div>

              <div className={styles['sa-system-users__modal-body']}>
                {modalMode === 'view' && selectedUser ? (
                  <div className={styles['sa-system-users__view-details']}>
                    <p><strong>Nom:</strong> {selectedUser.prenom} {selectedUser.nom}</p>
                    <p><strong>Email:</strong> {selectedUser.email}</p>
                    {selectedUser.telephone && <p><strong>Téléphone:</strong> {selectedUser.telephone}</p>}
                    <p><strong>Organisation:</strong> {selectedUser.organisation?.nom || 'Aucune'}</p>
                    <p><strong>Rôles:</strong> {selectedUser.roles?.map(r => r.nom).join(', ') || 'Aucun'}</p>
                    <p><strong>Statut:</strong> {selectedUser.statut_actif ? 'Actif' : 'Inactif'}</p>
                    <p><strong>Email vérifié:</strong> {selectedUser.date_verification_email ? 'Oui' : 'Non'}</p>
                    <p><strong>Créé le:</strong> {new Date(selectedUser.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                ) : (
                  <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                    <div className={styles['sa-system-users__form-grid']}>
                      <div className={styles['sa-system-users__form-field']}>
                        <label>{t('common.firstName')}</label>
                        <input type="text" value={formData.prenom} onChange={(e) => setFormData({ ...formData, prenom: e.target.value })} />
                      </div>
                      <div className={styles['sa-system-users__form-field']}>
                        <label>{t('common.lastName')} *</label>
                        <input type="text" value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} required />
                      </div>
                      <div className={styles['sa-system-users__form-field']}>
                        <label>{t('common.email')} *</label>
                        <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                      </div>
                      <div className={styles['sa-system-users__form-field']}>
                        <label>{t('common.phone')}</label>
                        <input type="tel" value={formData.telephone} onChange={(e) => setFormData({ ...formData, telephone: e.target.value })} />
                      </div>
                      <div className={styles['sa-system-users__form-field']}>
                        <label>Organisation</label>
                        <select value={formData.id_organisation} onChange={(e) => setFormData({ ...formData, id_organisation: e.target.value })}>
                          <option value="">-- Aucune --</option>
                          {organisations.map((org) => (<option key={org.id} value={org.id}>{org.nom}</option>))}
                        </select>
                      </div>
                      <div className={styles['sa-system-users__form-field']}>
                        <label className={styles['sa-system-users__checkbox-label']}>
                          <input type="checkbox" checked={formData.statut_actif} onChange={(e) => setFormData({ ...formData, statut_actif: e.target.checked })} />
                          {t('common.active')}
                        </label>
                      </div>
                      <div className={styles['sa-system-users__form-field']} style={{ gridColumn: '1 / -1' }}>
                        <label>{t('common.roles')}</label>
                        <div className={styles['sa-system-users__roles-list']}>
                          {roles.map((role) => (
                            <label key={role.id} className={styles['sa-system-users__role-checkbox']}>
                              <input
                                type="checkbox"
                                checked={formData.selectedRoles.includes(role.id)}
                                onChange={() => toggleRole(role.id)}
                              />
                              <span>{role.nom}</span>
                              {role.description && <small>{role.description}</small>}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className={styles['sa-system-users__modal-footer']}>
                      <button type="button" onClick={() => setShowModal(false)}>{t('common.cancel')}</button>
                      <button type="submit" disabled={isSaving || !formData.nom || !formData.email}>
                        {isSaving ? <Loader2 size={16} className={styles['sa-system-users__spinner']} /> : <Check size={16} />}
                        {t('common.save')}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminSystemUsersPage;
