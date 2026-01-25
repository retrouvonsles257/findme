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
import { 
  Shield, Users, Plus, Edit2, Trash2, X, Check, 
  Loader2, AlertCircle, Search
} from 'lucide-react';
import styles from './RolesPage.module.css';

interface Role {
  id: string;
  nom_role: string;
  description?: string;
  niveau_accreditation: number;
  created_at: string;
  _count?: { utilisateurs: number };
}

// Valeurs de l'ENUM nom_role dans la base de données
const NOM_ROLE_OPTIONS = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin_organisation', label: 'Admin Organisation' },
  { value: 'officier_police', label: 'Officier de Police' },
  { value: 'agent_gendarmerie', label: 'Agent de Gendarmerie' },
  { value: 'responsable_ong', label: 'Responsable ONG' },
  { value: 'operateur_saisie', label: 'Opérateur de Saisie' },
  { value: 'moderateur', label: 'Modérateur' },
  { value: 'citoyen_verifie', label: 'Citoyen Vérifié' },
  { value: 'citoyen_standard', label: 'Citoyen Standard' },
];

export const SuperAdminRolesPage: React.FC = () => {
  useI18n(); // For future i18n support
  
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    nom_role: '',
    description: '',
    niveau_accreditation: 1,
  });

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadRoles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await (supabase as any)
        .from('role')
        .select('*')
        .order('niveau_accreditation', { ascending: false });

      if (fetchError) throw fetchError;

      // Compter les utilisateurs par rôle
      const rolesWithCounts = await Promise.all(
        (data || []).map(async (role: Role) => {
          const { count } = await (supabase as any)
            .from('utilisateur_role')
            .select('id', { count: 'exact', head: true })
            .eq('id_role', role.id);
          return { ...role, _count: { utilisateurs: count || 0 } };
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

      if (modalMode === 'create') {
        const { error: insertError } = await (supabase as any)
          .from('role')
          .insert({
            nom_role: formData.nom_role,
            description: formData.description || null,
            niveau_accreditation: formData.niveau_accreditation,
          });

        if (insertError) throw insertError;
      } else if (modalMode === 'edit' && selectedRole) {
        const { error: updateError } = await (supabase as any)
          .from('role')
          .update({
            nom_role: formData.nom_role,
            description: formData.description || null,
            niveau_accreditation: formData.niveau_accreditation,
          })
          .eq('id', selectedRole.id);

        if (updateError) throw updateError;
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
        setError('Impossible de supprimer: des utilisateurs utilisent ce rôle');
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

  return (
    <SuperAdminLayout title="Gestion des Rôles" activeNav="roles">
      <div className={styles['sa-roles']}>
        {/* Header */}
        <div className={styles['sa-roles__header']}>
          <div className={styles['sa-roles__search']}>
            <Search size={18} />
            <input
              type="text"
              placeholder="Rechercher un rôle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className={styles['sa-roles__add-btn']} onClick={openCreateModal}>
            <Plus size={20} />
            Nouveau rôle
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className={styles['sa-roles__error']}>
            <AlertCircle size={20} />
            <span>{error}</span>
            <button onClick={() => setError(null)}><X size={16} /></button>
          </div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className={styles['sa-roles__loading']}>
            <Loader2 size={32} className={styles['sa-roles__spinner']} />
          </div>
        ) : (
          <div className={styles['sa-roles__grid']}>
            {filteredRoles.length === 0 ? (
              <div className={styles['sa-roles__empty']}>
                <Shield size={48} />
                <p>Aucun rôle</p>
              </div>
            ) : (
              filteredRoles.map((role) => (
                <div key={role.id} className={styles['sa-roles__card']}>
                  <div className={styles['sa-roles__card-header']}>
                    <div className={`${styles['sa-roles__card-icon']} ${styles[`sa-roles__card-icon--${getNiveauColor(role.niveau_accreditation)}`]}`}>
                      <Shield size={24} />
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
                      <p>Confirmer la suppression ?</p>
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
                <h2>{modalMode === 'create' ? 'Nouveau rôle' : 'Modifier rôle'}</h2>
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
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminRolesPage;
