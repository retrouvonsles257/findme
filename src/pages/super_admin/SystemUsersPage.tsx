/**
 * =====================================================
 * RETROUVONSLES - Super Admin System Users Page
 * Gestion des utilisateurs système avec CRUD complet
 * Connecté à Supabase
 * =====================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../../hooks';
import { supabase, resetPassword } from '../../config';
import { SuperAdminLayout } from './SuperAdminLayout';
import { 
  Users, Shield, Mail, Plus, Edit2, Trash2, X, Check, 
  Loader2, AlertCircle, Search, Eye, Building2, ToggleLeft, ToggleRight,
  Download, Key, Ban, Calendar
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
  prenom: string;
  email: string;
  telephone?: string;
  statut_compte: string;
  type_compte: string;
  photo_profil?: string;
  date_naissance?: string;
  adresse?: string;
  ville?: string;
  region?: string;
  pays?: string;
  numero_badge?: string;
  document_accreditation?: string;
  latitude_actuelle?: number;
  longitude_actuelle?: number;
  rayon_notification_km?: number;
  preferences_notification?: Record<string, any>;
  langue_preferee?: string;
  accepte_notifications?: boolean;
  accepte_geolocalisation?: boolean;
  score_fiabilite?: number;
  nombre_signalements_valides?: number;
  nombre_signalements_invalides?: number;
  derniere_connexion?: string;
  derniere_maj_localisation?: string;
  ip_derniere_connexion?: string;
  id_organisation?: string;
  organisation?: Organisation;
  roles?: Role[];
  created_at: string;
  updated_at?: string;
}

export const SuperAdminSystemUsersPage: React.FC = () => {
  const { t } = useI18n();
  
  const [users, setUsers] = useState<Utilisateur[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // États pour fonctionnalités avancées
  const [showRoleExpirationModal, setShowRoleExpirationModal] = useState(false);
  const [selectedUserForRoleExpiration, setSelectedUserForRoleExpiration] = useState<Utilisateur | null>(null);
  const [roleExpirationData, setRoleExpirationData] = useState<{ roleId: string; dateExpiration: string }[]>([]);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedUser, setSelectedUser] = useState<Utilisateur | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state - TOUS les champs du modèle SQL
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    statut_compte: 'en_attente_verification',
    type_compte: 'grand_public',
    photo_profil: '',
    date_naissance: '',
    adresse: '',
    ville: '',
    region: '',
    pays: 'Cameroun',
    numero_badge: '',
    document_accreditation: '',
    latitude_actuelle: '',
    longitude_actuelle: '',
    rayon_notification_km: 50,
    langue_preferee: 'fr',
    accepte_notifications: true,
    accepte_geolocalisation: false,
    id_organisation: '',
    selectedRoles: [] as string[],
  });

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Charger les données
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [usersResult, rolesResult, orgsResult] = await Promise.all([
        (supabase as any).from('utilisateur').select(`
          *,
          organisation:organisation(*)
        `).order('created_at', { ascending: false }),
        (supabase as any).from('role').select('*'),
        (supabase as any).from('organisation').select('id, nom').eq('statut_actif', true),
      ]);

      if (usersResult.error) throw usersResult.error;
      if (rolesResult.error) throw rolesResult.error;
      if (orgsResult.error) throw orgsResult.error;

      // Enrichir les utilisateurs avec leurs rôles (avec dates d'expiration)
      const enrichedUsers = await Promise.all(
        (usersResult.data || []).map(async (user: any) => {
          // Récupérer les rôles avec dates d'expiration
          const { data: userRoles } = await (supabase as any)
            .from('utilisateur_role')
            .select('id_role, date_attribution, date_expiration, attribue_par, commentaire, role:role(*)')
            .eq('id_utilisateur', user.id);
          
          return {
            ...user,
            roles: userRoles?.map((ur: any) => ({
              ...ur.role,
              date_attribution: ur.date_attribution,
              date_expiration: ur.date_expiration,
              attribue_par: ur.attribue_par,
              commentaire: ur.commentaire,
            })).filter((r: any) => r.id) || [],
            organisation: user.organisation || null,
            statut_actif: user.statut_compte === 'actif', // Compatibilité avec l'ancien code
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
      statut_compte: 'en_attente_verification',
      type_compte: 'grand_public',
      photo_profil: '',
      date_naissance: '',
      adresse: '',
      ville: '',
      region: '',
      pays: 'Cameroun',
      numero_badge: '',
      document_accreditation: '',
      latitude_actuelle: '',
      longitude_actuelle: '',
      rayon_notification_km: 50,
      langue_preferee: 'fr',
      accepte_notifications: true,
      accepte_geolocalisation: false,
      id_organisation: '',
      selectedRoles: [],
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
      statut_compte: user.statut_compte || 'en_attente_verification',
      type_compte: user.type_compte || 'grand_public',
      photo_profil: user.photo_profil || '',
      date_naissance: user.date_naissance ? new Date(user.date_naissance).toISOString().split('T')[0] : '',
      adresse: user.adresse || '',
      ville: user.ville || '',
      region: user.region || '',
      pays: user.pays || 'Cameroun',
      numero_badge: user.numero_badge || '',
      document_accreditation: user.document_accreditation || '',
      latitude_actuelle: user.latitude_actuelle?.toString() || '',
      longitude_actuelle: user.longitude_actuelle?.toString() || '',
      rayon_notification_km: user.rayon_notification_km || 50,
      langue_preferee: user.langue_preferee || 'fr',
      accepte_notifications: user.accepte_notifications ?? true,
      accepte_geolocalisation: user.accepte_geolocalisation ?? false,
      id_organisation: user.id_organisation || '',
      selectedRoles: user.roles?.map(r => r.id) || [],
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

      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (modalMode === 'create') {
        // Créer l'utilisateur avec TOUS les champs
        const userData: any = {
          nom: formData.nom,
          prenom: formData.prenom || null,
          email: formData.email,
          telephone: formData.telephone || null,
          statut_compte: formData.statut_compte,
          type_compte: formData.type_compte,
          photo_profil: formData.photo_profil || null,
          date_naissance: formData.date_naissance || null,
          adresse: formData.adresse || null,
          ville: formData.ville || null,
          region: formData.region || null,
          pays: formData.pays || 'Cameroun',
          numero_badge: formData.numero_badge || null,
          document_accreditation: formData.document_accreditation || null,
          latitude_actuelle: formData.latitude_actuelle ? parseFloat(formData.latitude_actuelle) : null,
          longitude_actuelle: formData.longitude_actuelle ? parseFloat(formData.longitude_actuelle) : null,
          rayon_notification_km: formData.rayon_notification_km || 50,
          langue_preferee: formData.langue_preferee || 'fr',
          accepte_notifications: formData.accepte_notifications,
          accepte_geolocalisation: formData.accepte_geolocalisation,
          id_organisation: formData.id_organisation || null,
        };

        const { data: newUser, error: insertError } = await (supabase as any)
          .from('utilisateur')
          .insert(userData)
          .select()
          .single();

        if (insertError) throw insertError;

        // Assigner les rôles avec attribution par l'utilisateur courant
        if (formData.selectedRoles.length > 0 && newUser) {
          const roleInserts = formData.selectedRoles.map(roleId => ({
            id_utilisateur: newUser.id,
            id_role: roleId,
            attribue_par: currentUser?.id || null,
          }));
          await (supabase as any).from('utilisateur_role').insert(roleInserts);
        }
      } else if (modalMode === 'edit' && selectedUser) {
        // Mettre à jour l'utilisateur avec TOUS les champs
        const userData: any = {
          nom: formData.nom,
          prenom: formData.prenom || null,
          email: formData.email,
          telephone: formData.telephone || null,
          statut_compte: formData.statut_compte,
          type_compte: formData.type_compte,
          photo_profil: formData.photo_profil || null,
          date_naissance: formData.date_naissance || null,
          adresse: formData.adresse || null,
          ville: formData.ville || null,
          region: formData.region || null,
          pays: formData.pays || 'Cameroun',
          numero_badge: formData.numero_badge || null,
          document_accreditation: formData.document_accreditation || null,
          latitude_actuelle: formData.latitude_actuelle ? parseFloat(formData.latitude_actuelle) : null,
          longitude_actuelle: formData.longitude_actuelle ? parseFloat(formData.longitude_actuelle) : null,
          rayon_notification_km: formData.rayon_notification_km || 50,
          langue_preferee: formData.langue_preferee || 'fr',
          accepte_notifications: formData.accepte_notifications,
          accepte_geolocalisation: formData.accepte_geolocalisation,
          id_organisation: formData.id_organisation || null,
          updated_at: new Date().toISOString(),
        };

        const { error: updateError } = await (supabase as any)
          .from('utilisateur')
          .update(userData)
          .eq('id', selectedUser.id);

        if (updateError) throw updateError;

        // Mettre à jour les rôles avec attribution par l'utilisateur courant
        await (supabase as any).from('utilisateur_role').delete().eq('id_utilisateur', selectedUser.id);
        if (formData.selectedRoles.length > 0) {
          const roleInserts = formData.selectedRoles.map(roleId => ({
            id_utilisateur: selectedUser.id,
            id_role: roleId,
            attribue_par: currentUser?.id || null,
          }));
          await (supabase as any).from('utilisateur_role').insert(roleInserts);
        }
      }

      setSuccess(modalMode === 'create' ? 'Utilisateur créé avec succès' : 'Utilisateur modifié avec succès');
      setTimeout(() => setSuccess(null), 3000);
      setShowModal(false);
      loadData();
    } catch (err: any) {
      console.error('Erreur sauvegarde:', err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Bloquer définitivement un utilisateur (selon doc NIVEAU 7)
  const handleBlockUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (!window.confirm(`Êtes-vous sûr de vouloir bloquer définitivement ${user.email} ? Cette action est irréversible.`)) {
      return;
    }

    try {
      setError(null);
      const { error: updateError } = await (supabase as any)
        .from('utilisateur')
        .update({
          statut_compte: 'bloque',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      setSuccess(`Utilisateur ${user.email} bloqué définitivement`);
      setTimeout(() => setSuccess(null), 3000);
      loadData();
    } catch (err: any) {
      console.error('Erreur blocage:', err);
      setError(err.message);
    }
  };

  // Gérer dates d'expiration des rôles (selon doc NIVEAU 7)
  const handleManageRoleExpiration = (user: Utilisateur) => {
    setSelectedUserForRoleExpiration(user);
    setRoleExpirationData(
      user.roles?.map(r => ({
        roleId: r.id,
        dateExpiration: (r as any).date_expiration ? new Date((r as any).date_expiration).toISOString().split('T')[0] : '',
      })) || []
    );
    setShowRoleExpirationModal(true);
  };

  const handleSaveRoleExpiration = async () => {
    if (!selectedUserForRoleExpiration) return;

    try {
      setError(null);
      // const { data: { user: currentUser } } = await supabase.auth.getUser();

      // Mettre à jour chaque rôle avec sa date d'expiration (utilisateur_role n'a pas updated_at)
      for (const roleData of roleExpirationData) {
        const { error: updateError } = await (supabase as any)
          .from('utilisateur_role')
          .update({
            date_expiration: roleData.dateExpiration || null,
          })
          .eq('id_utilisateur', selectedUserForRoleExpiration.id)
          .eq('id_role', roleData.roleId);

        if (updateError) throw updateError;
      }

      setSuccess('Dates d\'expiration des rôles mises à jour');
      setTimeout(() => setSuccess(null), 3000);
      setShowRoleExpirationModal(false);
      loadData();
    } catch (err: any) {
      console.error('Erreur mise à jour dates expiration:', err);
      setError(err.message);
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

  // Toggle statut compte (selon doc NIVEAU 7)
  const toggleStatus = async (user: Utilisateur) => {
    try {
      const newStatut = user.statut_compte === 'actif' ? 'desactive' : 'actif';
      const { error: updateError } = await (supabase as any)
        .from('utilisateur')
        .update({ 
          statut_compte: newStatut, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', user.id);

      if (updateError) throw updateError;
      setSuccess(`Statut de ${user.email} changé en ${newStatut}`);
      setTimeout(() => setSuccess(null), 3000);
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

  // Forcer réinitialisation mot de passe (envoi email de reset)
  const handleResetPassword = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (!window.confirm(`Envoyer un email de réinitialisation du mot de passe à ${user.email} ?`)) {
      return;
    }

    try {
      setError(null);
      const { error: resetError } = await resetPassword(user.email);
      if (resetError) throw resetError;

      setSuccess(`Email de réinitialisation envoyé à ${user.email}`);
      setTimeout(() => setSuccess(null), 5000);

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      await (supabase as any).from('journal_activite').insert({
        type_action: 'autre',
        action_detaillee: 'reinitialisation_mot_de_passe_forcee',
        description: `Réinitialisation forcée du mot de passe pour ${user.email}`,
        id_utilisateur: currentUser?.id || null,
      });
    } catch (err: any) {
      console.error('Erreur réinitialisation:', err);
      setError('Erreur lors de l\'envoi de l\'email: ' + (err as Error).message);
    }
  };

  const exportToCSV = async () => {
    try {
      setIsLoading(true);
      
      // Charger tous les utilisateurs
      const { data: allUsers, error: fetchError } = await (supabase as any)
        .from('utilisateur')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Enrichir avec rôles et organisations
      const enrichedUsers = await Promise.all(
        (allUsers || []).map(async (user: Utilisateur) => {
          const { data: userRoles } = await (supabase as any)
            .from('utilisateur_role')
            .select('id_role, role:role(*)')
            .eq('id_utilisateur', user.id);
          
          let organisation: Organisation | undefined;
          if (user.id_organisation) {
            const { data: org } = await (supabase as any)
              .from('organisation')
              .select('nom')
              .eq('id', user.id_organisation)
              .single();
            organisation = org;
          }
          
          return {
            ...user,
            roles: userRoles?.map((ur: any) => ur.role).filter(Boolean) || [],
            organisation,
          };
        })
      );

      // Créer le CSV
      const headers = ['Nom', 'Prénom', 'Email', 'Téléphone', 'Organisation', 'Rôles', 'Statut', 'Date création'];
      const rows = enrichedUsers.map(user => [
        user.nom,
        user.prenom || '',
        user.email,
        user.telephone || '',
        user.organisation?.nom || '-',
        user.roles?.map((r: Role) => r.nom).join('; ') || '-',
        user.statut_compte || 'Inactif',
        new Date(user.created_at).toLocaleDateString('fr-FR'),
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row: string[]) => row.map((cell: string | number) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      // Télécharger
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `utilisateurs_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      console.error('Erreur export CSV:', err);
      setError('Erreur lors de l\'export: ' + err.message);
    } finally {
      setIsLoading(false);
    }
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
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className={styles['sa-system-users__export-btn']} onClick={exportToCSV} disabled={isLoading}>
              <Download size={18} />
              Exporter CSV
            </button>
            <button className={styles['sa-system-users__add-btn']} onClick={openCreateModal}>
              <Plus size={20} />
              {t('common.add')}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className={styles['sa-system-users__error']}>
            <AlertCircle size={20} />
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)} aria-label="Fermer"><X size={16} /></button>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className={styles['sa-system-users__success']}>
            <Check size={20} />
            <span>{success}</span>
            <button type="button" onClick={() => setSuccess(null)} aria-label="Fermer"><X size={16} /></button>
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
                        <span className={`${styles['sa-system-users__badge']} ${user.statut_compte === 'actif' ? styles['sa-system-users__badge--active'] : styles['sa-system-users__badge--inactive']}`}>
                          {user.statut_compte === 'actif' ? 'Actif' : user.statut_compte === 'bloque' ? 'Bloqué' : user.statut_compte === 'suspendu' ? 'Suspendu' : 'Inactif'}
                        </span>
                      </td>
                      <td>
                        <div className={styles['sa-system-users__actions']}>
                          <button onClick={() => openViewModal(user)} title={t('common.view')}><Eye size={16} /></button>
                          <button onClick={() => openEditModal(user)} title={t('common.edit')}><Edit2 size={16} /></button>
                          <button onClick={() => handleResetPassword(user.id)} title="Réinitialiser mot de passe"><Key size={16} /></button>
                          <button onClick={() => toggleStatus(user)} title={user.statut_compte === 'actif' ? 'Désactiver' : 'Activer'}>
                            {user.statut_compte === 'actif' ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                          </button>
                          {user.statut_compte !== 'bloque' && (
                            <button onClick={() => handleBlockUser(user.id)} title="Bloquer définitivement" style={{ color: '#dc2626' }}>
                              <Ban size={16} />
                            </button>
                          )}
                          <button onClick={() => handleManageRoleExpiration(user)} title="Gérer dates expiration rôles">
                            <Calendar size={16} />
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
                <button type="button" onClick={() => setShowModal(false)} aria-label="Fermer"><X size={20} /></button>
              </div>

              <div className={styles['sa-system-users__modal-body']}>
                {modalMode === 'view' && selectedUser ? (
                  <>
                    <div className={styles['sa-system-users__view-details']}>
                      <p><strong>Nom:</strong> {selectedUser.prenom} {selectedUser.nom}</p>
                      <p><strong>Email:</strong> {selectedUser.email}</p>
                      {selectedUser.telephone && <p><strong>Téléphone:</strong> {selectedUser.telephone}</p>}
                      <p><strong>Organisation:</strong> {selectedUser.organisation?.nom || 'Aucune'}</p>
                      <p><strong>Rôles:</strong> {selectedUser.roles?.map(r => r.nom).join(', ') || 'Aucun'}</p>
                      <p><strong>Statut:</strong> {selectedUser.statut_compte}</p>
                      <p><strong>Créé le:</strong> {new Date(selectedUser.created_at).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div className={styles['sa-system-users__modal-footer']}>
                      <button type="button" onClick={() => { setShowModal(false); openEditModal(selectedUser); }}>
                        <Edit2 size={16} /> Modifier
                      </button>
                      <button type="button" onClick={() => setShowModal(false)}>Fermer</button>
                    </div>
                  </>
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
                        <label>Statut compte</label>
                        <select
                          value={formData.statut_compte}
                          onChange={(e) => setFormData({ ...formData, statut_compte: e.target.value })}
                        >
                          <option value="actif">Actif</option>
                          <option value="en_attente_verification">En attente vérification</option>
                          <option value="suspendu">Suspendu</option>
                          <option value="desactive">Désactivé</option>
                          <option value="bloque">Bloqué</option>
                        </select>
                      </div>
                      <div className={styles['sa-system-users__form-field']}>
                        <label>Type compte</label>
                        <select
                          value={formData.type_compte}
                          onChange={(e) => setFormData({ ...formData, type_compte: e.target.value })}
                        >
                          <option value="grand_public">Grand public</option>
                          <option value="autorite">Autorité</option>
                        </select>
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

        {/* Modal Gestion Dates Expiration Rôles */}
        {showRoleExpirationModal && selectedUserForRoleExpiration && (
          <div className={styles['sa-system-users__modal-overlay']} onClick={() => setShowRoleExpirationModal(false)}>
            <div className={styles['sa-system-users__modal']} onClick={(e) => e.stopPropagation()}>
              <div className={styles['sa-system-users__modal-header']}>
                <h2>Gérer dates d&apos;expiration des rôles — {selectedUserForRoleExpiration.email}</h2>
                <button type="button" onClick={() => setShowRoleExpirationModal(false)} aria-label="Fermer"><X size={20} /></button>
              </div>
              <div className={styles['sa-system-users__modal-body']}>
                {(!selectedUserForRoleExpiration.roles || selectedUserForRoleExpiration.roles.length === 0) ? (
                  <p className={styles['sa-system-users__role-exp-empty']}>
                    Aucun rôle assigné. Modifiez l&apos;utilisateur pour ajouter des rôles.
                  </p>
                ) : (
                  selectedUserForRoleExpiration.roles.map((role) => {
                    const roleData = roleExpirationData.find(rd => rd.roleId === role.id);
                    return (
                      <div key={role.id} className={styles['sa-system-users__role-exp-item']}>
                        <label className={styles['sa-system-users__role-exp-label']}>
                          {role.nom}
                          {(role as any).date_expiration && (
                            <span className={styles['sa-system-users__role-exp-hint']}>
                              (Expire le {new Date((role as any).date_expiration).toLocaleDateString('fr-FR')})
                            </span>
                          )}
                        </label>
                        <input
                          type="date"
                          value={roleData?.dateExpiration || ''}
                          onChange={(e) => {
                            setRoleExpirationData(prev => {
                              const existing = prev.find(rd => rd.roleId === role.id);
                              if (existing) {
                                return prev.map(rd => rd.roleId === role.id ? { ...rd, dateExpiration: e.target.value } : rd);
                              }
                              return [...prev, { roleId: role.id, dateExpiration: e.target.value }];
                            });
                          }}
                          className={styles['sa-system-users__role-exp-input']}
                        />
                        <small className={styles['sa-system-users__role-exp-help']}>
                          Laisser vide pour aucune expiration
                        </small>
                      </div>
                    );
                  })
                )}
              </div>
              <div className={styles['sa-system-users__modal-footer']}>
                <button type="button" onClick={() => setShowRoleExpirationModal(false)}>Annuler</button>
                <button type="button" onClick={handleSaveRoleExpiration} className={styles['sa-system-users__btn-save']}>
                  <Check size={16} />
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminSystemUsersPage;
