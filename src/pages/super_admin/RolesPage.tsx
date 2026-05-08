/**
 * =====================================================
 * RETROUVONSLES - Super Admin Roles Page
 * Gestion des rôles avec CRUD complet
 * Connecté à Supabase tables: role, utilisateur_role
 * =====================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../../hooks';
import { supabase } from '../../config';
import { SuperAdminLayout } from './SuperAdminLayout';
import { AdminCardsGridSkeleton } from 'components/skeletons';
import { 
  Shield, Users, Plus, Edit2, Trash2, X, Check, 
  Loader2, AlertCircle, Search, Eye, CheckCircle, Download
} from 'lucide-react';
import styles from './RolesPage.module.css';

interface Role {
  id: string;
  nom_role: string;
  description?: string;
  niveau_accreditation: number;
  permissions?: Record<string, any> | null;
  created_at: string;
  _count?: { utilisateurs: number };
}

// Rôles applicatifs (migration 20260423)
const NOM_ROLE_OPTIONS = [
  { value: 'citoyen', label: 'Citoyen' },
  { value: 'autorite', label: 'Autorité' },
  { value: 'admin_systeme', label: 'Administrateur système' },
];

// Badges (images) – réutilisation visuelle des niveaux historiques
const ROLE_BADGE_IMAGES: Record<string, string> = {
  citoyen: '/assets/images/niveau_0_citoyen_standard.png',
  autorite: '/assets/images/niveau_4_officier_police.png',
  admin_systeme: '/assets/images/niveau_7_super_admin.png',
};

export const SuperAdminRolesPage: React.FC = () => {
  const { t } = useI18n();

  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [viewingRole, setViewingRole] = useState<Role | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    nom_role: '',
    description: '',
    niveau_accreditation: 1,
    permissions: '',
  });

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Utilisateurs du rôle (modal vue)
  const [roleUsers, setRoleUsers] = useState<any[]>([]);
  const [loadingRoleUsers, setLoadingRoleUsers] = useState(false);

  const loadRoleUsers = useCallback(async (roleId: string) => {
    setLoadingRoleUsers(true);
    try {
      const { data: ur, error: urError } = await (supabase as any)
        .from('utilisateur_role')
        .select('id_utilisateur')
        .eq('id_role', roleId);
      if (urError) throw urError;
      const ids = (ur || []).map((r: any) => r.id_utilisateur).filter(Boolean);
      if (ids.length === 0) {
        setRoleUsers([]);
        return;
      }
      const { data: us, error: usError } = await (supabase as any)
        .from('utilisateur')
        .select('id, nom, prenom, email, telephone, statut_compte, type_compte, organisation:organisation(nom)')
        .in('id', ids)
        .order('nom');
      if (usError) throw usError;
      setRoleUsers(us || []);
    } catch {
      setRoleUsers([]);
    } finally {
      setLoadingRoleUsers(false);
    }
  }, []);

  useEffect(() => {
    if (viewingRole?.id) loadRoleUsers(viewingRole.id);
    else setRoleUsers([]);
  }, [viewingRole?.id, loadRoleUsers]);

  const loadRoles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await (supabase as any)
        .from('role')
        .select('*')
        .order('niveau_accreditation', { ascending: false });

      if (fetchError) throw fetchError;

      // Compter les utilisateurs par rôle (utilisateur_role n'a pas de colonne id, PK = id_utilisateur + id_role)
      const rolesWithCounts = await Promise.all(
        (data || []).map(async (role: Role) => {
          const { count } = await (supabase as any)
            .from('utilisateur_role')
            .select('id_utilisateur', { count: 'exact', head: true })
            .eq('id_role', role.id);
          return { ...role, _count: { utilisateurs: count ?? 0 } };
        })
      );

      setRoles(rolesWithCounts);
    } catch (err: any) {
      console.error('Erreur chargement rôles:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  // Filtrer les rôles
  const filteredRoles = roles.filter(role =>
    role.nom_role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (role.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Ouvrir modal création
  const openCreateModal = () => {
    setFormData({
      nom_role: '',
      description: '',
      niveau_accreditation: 1,
      permissions: '',
    });
    setSelectedRole(null);
    setModalMode('create');
    setShowModal(true);
  };

  // Ouvrir modal édition
  const openEditModal = (role: Role) => {
    setFormData({
      nom_role: role.nom_role,
      description: role.description || '',
      niveau_accreditation: role.niveau_accreditation,
      permissions: role.permissions ? JSON.stringify(role.permissions, null, 2) : '',
    });
    setSelectedRole(role);
    setModalMode('edit');
    setShowModal(true);
  };

  // Sauvegarder rôle
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      // Parser les permissions JSON
      let permissionsJson = null;
      if (formData.permissions.trim()) {
        try {
          permissionsJson = JSON.parse(formData.permissions);
        } catch (parseError) {
          setError(t('super_admin.rolesJsonInvalid'));
          return;
        }
      }

      const roleData: any = {
        nom_role: formData.nom_role,
        description: formData.description || null,
        niveau_accreditation: formData.niveau_accreditation,
      };

      if (permissionsJson !== null) {
        roleData.permissions = permissionsJson;
      }

      if (modalMode === 'create') {
        const { error: insertError } = await (supabase as any)
          .from('role')
          .insert(roleData);

        if (insertError) throw insertError;
        setSuccess(t('super_admin.rolesCreateSuccess'));
      } else if (modalMode === 'edit' && selectedRole) {
        const { error: updateError } = await (supabase as any)
          .from('role')
          .update(roleData)
          .eq('id', selectedRole.id);

        if (updateError) throw updateError;
        setSuccess(t('super_admin.rolesUpdateSuccess'));
      }

      setShowModal(false);
      loadRoles();
    } catch (err: any) {
      console.error('Erreur sauvegarde:', err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Supprimer rôle
  const handleDelete = async (id: string) => {
    try {
      // Vérifier si des utilisateurs utilisent ce rôle
      const { count } = await (supabase as any)
        .from('utilisateur_role')
        .select('id', { count: 'exact', head: true })
        .eq('id_role', id);

      if ((count || 0) > 0) {
        setError(t('super_admin.rolesDeleteErrorInUse'));
        setDeleteConfirm(null);
        return;
      }

      const { error: deleteError } = await (supabase as any)
        .from('role')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setDeleteConfirm(null);
      loadRoles();
    } catch (err: any) {
      console.error('Erreur suppression:', err);
      setError(err.message);
    }
  };

  const getNiveauLabel = (niveau: number) => {
    if (niveau >= 100) return 'Super Admin';
    if (niveau >= 80) return 'Admin';
    if (niveau >= 60) return 'Gestionnaire';
    if (niveau >= 40) return 'Opérateur';
    if (niveau >= 20) return 'Utilisateur';
    return 'Invité';
  };

  const getNiveauColor = (niveau: number) => {
    if (niveau >= 100) return 'purple';
    if (niveau >= 80) return 'red';
    if (niveau >= 60) return 'orange';
    if (niveau >= 40) return 'blue';
    if (niveau >= 20) return 'green';
    return 'gray';
  };

  const exportToCSV = async () => {
    try {
      setIsLoading(true);

      const { data: allRoles, error: fetchError } = await (supabase as any)
        .from('role')
        .select('*')
        .order('niveau_accreditation', { ascending: false });

      if (fetchError) throw fetchError;

      // Enrichir avec compteurs
      const enrichedRoles = await Promise.all(
        (allRoles || []).map(async (role: any) => {
          const { count } = await (supabase as any)
            .from('utilisateur_role')
            .select('id_utilisateur', { count: 'exact', head: true })
            .eq('id_role', role.id);
          return { ...role, nombre_utilisateurs: count ?? 0 };
        })
      );

      const headers = [
        'ID', 'Nom rôle', 'Description', 'Niveau accréditation', 'Permissions', 'Nombre utilisateurs', 'Date création'
      ];

      const rows = enrichedRoles.map((r: any) => [
        r.id,
        r.nom_role,
        r.description || '',
        r.niveau_accreditation,
        r.permissions ? JSON.stringify(r.permissions) : '',
        r.nombre_utilisateurs || 0,
        r.created_at ? new Date(r.created_at).toLocaleString('fr-FR') : '',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row: any[]) => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `roles_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (err: any) {
      console.error('Erreur export CSV:', err);
      setError(t('super_admin.rolesExportError', { message: err.message }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SuperAdminLayout title={t('super_admin.rolesTitle')} activeNav="roles">
      <div className={styles['sa-roles']}>
        {/* Header */}
        <div className={styles['sa-roles__header']}>
          <div className={styles['sa-roles__search']}>
            <Search size={18} />
            <input
              type="text"
              placeholder={t('super_admin.rolesSearchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={exportToCSV} disabled={isLoading} style={{
              background: '#f1f5f9',
              color: '#475569',
              border: '1px solid #e2e8f0',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer'
            }}>
              <Download size={18} />
              Exporter CSV
            </button>
            <button className={styles['sa-roles__add-btn']} onClick={openCreateModal}>
              <Plus size={20} />
              {t('super_admin.rolesNewRole')}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className={styles['sa-roles__error']}>
            <AlertCircle size={20} />
            <span>{error}</span>
            <button onClick={() => setError(null)}><X size={16} /></button>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className={styles['sa-roles__success']} style={{ 
            background: '#d4edda', 
            color: '#155724', 
            padding: '12px 16px', 
            borderRadius: '8px', 
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle size={20} />
            <span>{success}</span>
            <button onClick={() => setSuccess(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
          </div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className={styles['sa-roles__skeletonWrap']}>
            <AdminCardsGridSkeleton cardCount={9} />
          </div>
        ) : (
          <div className={styles['sa-roles__grid']}>
            {filteredRoles.length === 0 ? (
              <div className={styles['sa-roles__empty']}>
                <Shield size={48} />
                <p>{t('super_admin.rolesNoRole')}</p>
              </div>
            ) : (
              filteredRoles.map((role) => (
                <div key={role.id} className={styles['sa-roles__card']}>
                  <div className={styles['sa-roles__card-header']}>
                    <div className={`${styles['sa-roles__card-icon']} ${styles[`sa-roles__card-icon--${getNiveauColor(role.niveau_accreditation)}`]}`}>
                      {ROLE_BADGE_IMAGES[role.nom_role] ? (
                        <img src={ROLE_BADGE_IMAGES[role.nom_role]} alt="" className={styles['sa-roles__badge-img']} />
                      ) : (
                        <Shield size={24} />
                      )}
                    </div>
                    <span className={`${styles['sa-roles__niveau']} ${styles[`sa-roles__niveau--${getNiveauColor(role.niveau_accreditation)}`]}`}>
                      Niveau {role.niveau_accreditation}
                    </span>
                  </div>
                  <h3 className={styles['sa-roles__card-title']}>
                    {NOM_ROLE_OPTIONS.find(opt => opt.value === role.nom_role)?.label || role.nom_role}
                  </h3>
                  {role.description && (
                    <p className={styles['sa-roles__card-description']}>{role.description}</p>
                  )}
                  <div className={styles['sa-roles__card-info']}>
                    <div className={styles['sa-roles__info-item']}>
                      <Users size={16} />
                      <span>{role._count?.utilisateurs || 0} utilisateur(s)</span>
                    </div>
                    <div className={styles['sa-roles__info-item']}>
                      <Shield size={16} />
                      <span>{getNiveauLabel(role.niveau_accreditation)}</span>
                    </div>
                  </div>
                  <div className={styles['sa-roles__card-actions']}>
                    <button onClick={() => setViewingRole(role)} title="Voir détails"><Eye size={16} /></button>
                    <button onClick={() => openEditModal(role)} title="Modifier"><Edit2 size={16} /></button>
                    <button 
                      onClick={() => setDeleteConfirm(role.id)} 
                      className={styles['sa-roles__btn-delete']} 
                      title="Supprimer"
                      disabled={(role._count?.utilisateurs || 0) > 0}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {deleteConfirm === role.id && (
                    <div className={styles['sa-roles__delete-confirm']}>
                      <p>{t('super_admin.rolesConfirmDelete')}</p>
                      <div>
                        <button onClick={() => handleDelete(role.id)}><Check size={16} /></button>
                        <button onClick={() => setDeleteConfirm(null)}><X size={16} /></button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className={styles['sa-roles__modal-overlay']} onClick={() => setShowModal(false)}>
            <div className={styles['sa-roles__modal']} onClick={(e) => e.stopPropagation()}>
              <div className={styles['sa-roles__modal-header']}>
                <h2>{modalMode === 'create' ? t('super_admin.rolesNewRole') : t('super_admin.rolesEditRole')}</h2>
                <button onClick={() => setShowModal(false)}><X size={20} /></button>
              </div>

              <div className={styles['sa-roles__modal-body']}>
                <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                  <div className={styles['sa-roles__form-field']}>
                    <label>Nom du rôle *</label>
                    <select 
                      value={formData.nom_role} 
                      onChange={(e) => setFormData({ ...formData, nom_role: e.target.value })} 
                      required 
                    >
                      <option value="">Sélectionner un rôle...</option>
                      {NOM_ROLE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles['sa-roles__form-field']}>
                    <label>Description</label>
                    <textarea 
                      value={formData.description} 
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                      placeholder="Description des permissions et responsabilités..."
                      rows={3} 
                    />
                  </div>
                  <div className={styles['sa-roles__form-field']}>
                    <label>Niveau d'accréditation (1-100) *</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="100" 
                      value={formData.niveau_accreditation} 
                      onChange={(e) => setFormData({ ...formData, niveau_accreditation: parseInt(e.target.value) || 1 })} 
                      required 
                    />
                    <small className={styles['sa-roles__niveau-hint']}>
                      Actuel: {getNiveauLabel(formData.niveau_accreditation)} | 
                      1-19: Invité, 20-39: Utilisateur, 40-59: Opérateur, 60-79: Gestionnaire, 80-99: Admin, 100: Super Admin
                    </small>
                  </div>
                  <div className={styles['sa-roles__form-field']}>
                    <label>Permissions (JSON)</label>
                    <textarea 
                      value={formData.permissions} 
                      onChange={(e) => setFormData({ ...formData, permissions: e.target.value })} 
                      placeholder='{"can_view_public": true, "can_report": true, "can_create_dossier": false}'
                      rows={6}
                      style={{ fontFamily: 'monospace', fontSize: '12px' }}
                    />
                    <small style={{ color: '#666', fontSize: '12px' }}>
                      Format JSON valide requis. Exemple: {"{"}"can_view_public": true, "can_report": true{"}"}
                    </small>
                  </div>
                  <div className={styles['sa-roles__modal-footer']}>
                    <button type="button" onClick={() => setShowModal(false)}>Annuler</button>
                    <button type="submit" disabled={isSaving || !formData.nom_role}>
                      {isSaving ? <Loader2 size={16} className={styles['sa-roles__spinner']} /> : <Check size={16} />}
                      Enregistrer
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* View Role Details Modal */}
        {viewingRole && (
          <div className={styles['sa-roles__modal-overlay']} onClick={() => setViewingRole(null)}>
            <div className={styles['sa-roles__modal']} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
              <div className={styles['sa-roles__modal-header']}>
                <h2>Détails du rôle</h2>
                <button onClick={() => setViewingRole(null)}><X size={20} /></button>
              </div>

              <div className={styles['sa-roles__modal-body']}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className={styles['sa-roles__view-badge']}>
                    {ROLE_BADGE_IMAGES[viewingRole.nom_role] ? (
                      <img src={ROLE_BADGE_IMAGES[viewingRole.nom_role]} alt="" className={styles['sa-roles__badge-img']} />
                    ) : (
                      <Shield size={32} />
                    )}
                  </div>
                  <div>
                    <strong>Nom du rôle:</strong>
                    <p>{NOM_ROLE_OPTIONS.find(opt => opt.value === viewingRole.nom_role)?.label || viewingRole.nom_role}</p>
                  </div>

                  {viewingRole.description && (
                    <div>
                      <strong>Description:</strong>
                      <p>{viewingRole.description}</p>
                    </div>
                  )}

                  <div>
                    <strong>Niveau d'accréditation:</strong>
                    <p>{viewingRole.niveau_accreditation} - {getNiveauLabel(viewingRole.niveau_accreditation)}</p>
                  </div>

                  <div>
                    <strong>Nombre d&apos;utilisateurs:</strong>
                    <p>{viewingRole._count?.utilisateurs || 0}</p>
                  </div>

                  <div className={styles['sa-roles__users-section']}>
                    <h4 className={styles['sa-roles__users-title']}>
                      <Users size={18} />
                      Liste des utilisateurs ({viewingRole._count?.utilisateurs || 0})
                    </h4>
                    {loadingRoleUsers ? (
                      <div className={styles['sa-roles__users-loading']}>
                        <Loader2 size={20} className={styles['sa-roles__spinner']} />
                        Chargement…
                      </div>
                    ) : roleUsers.length === 0 ? (
                      <p className={styles['sa-roles__users-empty']}>Aucun utilisateur</p>
                    ) : (
                      <div className={styles['sa-roles__users-list']}>
                        {roleUsers.map((u) => (
                          <div key={u.id} className={styles['sa-roles__user-card']}>
                            <div className={styles['sa-roles__user-main']}>
                              <span className={styles['sa-roles__user-name']}>{u.prenom} {u.nom}</span>
                              <span className={styles['sa-roles__user-email']}>{u.email}</span>
                            </div>
                            <div className={styles['sa-roles__user-meta']}>
                              {u.telephone && <span>Tél. {u.telephone}</span>}
                              <span className={styles['sa-roles__user-badge']}>{u.statut_compte}</span>
                              <span className={styles['sa-roles__user-badge']}>{u.type_compte}</span>
                              {u.organisation?.nom && <span>Org. {u.organisation.nom}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <strong>Date de création:</strong>
                    <p>{new Date(viewingRole.created_at).toLocaleString('fr-FR')}</p>
                  </div>

                  {viewingRole.permissions && (
                    <div>
                      <strong>Permissions:</strong>
                      <pre style={{ 
                        background: '#f5f5f5', 
                        padding: '12px', 
                        borderRadius: '6px', 
                        overflow: 'auto',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        maxHeight: '300px'
                      }}>
                        {JSON.stringify(viewingRole.permissions, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles['sa-roles__modal-footer']}>
                <button type="button" onClick={() => setViewingRole(null)}>{t('common.close')}</button>
                <button type="button" onClick={() => { setViewingRole(null); openEditModal(viewingRole); }}>Modifier</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminRolesPage;
