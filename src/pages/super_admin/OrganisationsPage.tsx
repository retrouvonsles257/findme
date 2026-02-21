/**
 * =====================================================
 * RETROUVONSLES - Super Admin Organisations Page
 * Gestion des organisations avec CRUD complet
 * Connecté à Supabase
 * =====================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../../hooks';
import { supabase } from '../../config';
import { SuperAdminLayout } from './SuperAdminLayout';
import { AdminCardsGridSkeleton } from '../admin/skeletons';
import { 
  Building2, Users, MapPin, Plus, Edit2, Trash2, X, Check, 
  Loader2, AlertCircle, Search, Eye, ToggleLeft, ToggleRight, Download, CheckCircle,
  Settings, Shield, Save
} from 'lucide-react';
import styles from './OrganisationsPage.module.css';

interface Organisation {
  id: string;
  nom: string;
  type_organisation: string;
  pays: string;
  region?: string;
  ville?: string;
  adresse?: string;
  contact_officiel?: string;
  telephone?: string;
  email?: string;
  site_web?: string;
  statut_actif: boolean;
  created_at: string;
  updated_at?: string;
  _count?: { utilisateurs: number };
}

type TypeOrganisation = 'police' | 'gendarmerie' | 'ong_humanitaire' | 'croix_rouge' | 'protection_civile' | 'unicef' | 'gouvernement' | 'autre';

const typeOptions: TypeOrganisation[] = ['police', 'gendarmerie', 'ong_humanitaire', 'croix_rouge', 'protection_civile', 'unicef', 'gouvernement', 'autre'];

interface TypeOrganisationConfig {
  label: string;
  description?: string;
  certifications_requises: string[];
  actif: boolean;
}

interface OrganisationsGlobalConfig {
  types_organisations: Record<TypeOrganisation, TypeOrganisationConfig>;
  certifications_disponibles: string[];
}

const DEFAULT_ORGANISATIONS_CONFIG: OrganisationsGlobalConfig = {
  types_organisations: {
    police: {
      label: 'Police',
      description: 'Forces de police nationale',
      certifications_requises: ['Badge officiel', 'Accréditation ministérielle'],
      actif: true,
    },
    gendarmerie: {
      label: 'Gendarmerie',
      description: 'Forces de gendarmerie nationale',
      certifications_requises: ['Badge officiel', 'Accréditation ministérielle'],
      actif: true,
    },
    ong_humanitaire: {
      label: 'ONG Humanitaire',
      description: 'Organisation non gouvernementale humanitaire',
      certifications_requises: ['Statut ONG', 'Accréditation gouvernementale'],
      actif: true,
    },
    croix_rouge: {
      label: 'Croix-Rouge',
      description: 'Société nationale de la Croix-Rouge',
      certifications_requises: ['Accréditation Croix-Rouge internationale'],
      actif: true,
    },
    protection_civile: {
      label: 'Protection Civile',
      description: 'Organisme de protection civile',
      certifications_requises: ['Accréditation protection civile'],
      actif: true,
    },
    unicef: {
      label: 'UNICEF',
      description: 'Fonds des Nations unies pour l\'enfance',
      certifications_requises: ['Accréditation UNICEF'],
      actif: true,
    },
    gouvernement: {
      label: 'Gouvernement',
      description: 'Institution gouvernementale',
      certifications_requises: ['Accréditation gouvernementale'],
      actif: true,
    },
    autre: {
      label: 'Autre',
      description: 'Autre type d\'organisation',
      certifications_requises: [],
      actif: true,
    },
  },
  certifications_disponibles: [
    'Badge officiel',
    'Accréditation ministérielle',
    'Statut ONG',
    'Accréditation gouvernementale',
    'Accréditation Croix-Rouge internationale',
    'Accréditation protection civile',
    'Accréditation UNICEF',
    'Certificat d\'enregistrement',
    'Autorisation d\'exercice',
  ],
};

export const SuperAdminOrganisationsPage: React.FC = () => {
  const { t } = useI18n();
  
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedOrg, setSelectedOrg] = useState<Organisation | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state - TOUS les champs du modèle SQL
  const [formData, setFormData] = useState({
    nom: '',
    type_organisation: 'autre' as TypeOrganisation,
    pays: 'Cameroun',
    region: '',
    ville: '',
    adresse: '',
    contact_officiel: '',
    telephone: '',
    email: '',
    site_web: '',
    statut_actif: true,
  });

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Utilisateurs de l'organisation (modal vue)
  const [orgUsers, setOrgUsers] = useState<any[]>([]);
  const [loadingOrgUsers, setLoadingOrgUsers] = useState(false);
  
  // Configuration globale des types d'organisations
  const [showTypesConfig, setShowTypesConfig] = useState(false);
  const [orgsConfig, setOrgsConfig] = useState<OrganisationsGlobalConfig>(DEFAULT_ORGANISATIONS_CONFIG);
  const [originalOrgsConfig, setOriginalOrgsConfig] = useState<OrganisationsGlobalConfig>(DEFAULT_ORGANISATIONS_CONFIG);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Charger les organisations
  const loadOrganisations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await (supabase as any)
        .from('organisation')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Compter les utilisateurs par organisation
      const orgsWithCounts = await Promise.all(
        (data || []).map(async (org: Organisation) => {
          const { count } = await (supabase as any)
            .from('utilisateur')
            .select('id', { count: 'exact', head: true })
            .eq('id_organisation', org.id);
          return { ...org, _count: { utilisateurs: count || 0 } };
        })
      );

      setOrganisations(orgsWithCounts);
    } catch (err: any) {
      console.error('Erreur chargement organisations:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Charger la configuration globale des organisations
  const loadOrganisationsConfig = useCallback(async () => {
    try {
      const { data, error: fetchError } = await (supabase as any)
        .from('configuration_systeme')
        .select('*')
        .eq('categorie', 'organisations')
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (data && data.valeur) {
        const loadedConfig = { ...DEFAULT_ORGANISATIONS_CONFIG, ...data.valeur };
        // Fusionner les types d'organisations
        loadedConfig.types_organisations = {
          ...DEFAULT_ORGANISATIONS_CONFIG.types_organisations,
          ...(data.valeur.types_organisations || {}),
        };
        setOrgsConfig(loadedConfig);
        setOriginalOrgsConfig(loadedConfig);
      }
    } catch (err: any) {
      console.error('Erreur chargement config organisations:', err);
    }
  }, []);

  useEffect(() => {
    loadOrganisations();
    loadOrganisationsConfig();
  }, [loadOrganisations, loadOrganisationsConfig]);

  const loadOrgUsers = useCallback(async (orgId: string) => {
    setLoadingOrgUsers(true);
    try {
      const { data, error: fetchError } = await (supabase as any)
        .from('utilisateur')
        .select('id, nom, prenom, email, telephone, statut_compte, type_compte, photo_profil, derniere_connexion, created_at')
        .eq('id_organisation', orgId)
        .order('nom');
      if (fetchError) throw fetchError;
      setOrgUsers(data || []);
    } catch (e) {
      setOrgUsers([]);
    } finally {
      setLoadingOrgUsers(false);
    }
  }, []);

  useEffect(() => {
    if (showModal && modalMode === 'view' && selectedOrg?.id) loadOrgUsers(selectedOrg.id);
    else setOrgUsers([]);
  }, [showModal, modalMode, selectedOrg?.id, loadOrgUsers]);

  // Sauvegarder la configuration globale
  const handleSaveOrganisationsConfig = async () => {
    try {
      setIsSavingConfig(true);
      setError(null);
      setSuccess(null);

      const { error: upsertError } = await (supabase as any)
        .from('configuration_systeme')
        .upsert({
          categorie: 'organisations',
          cle: 'organisations_config',
          valeur: orgsConfig,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'categorie,cle' });

      if (upsertError) throw upsertError;

      setOriginalOrgsConfig(orgsConfig);
      setSuccess(t('super_admin.organisationsSaveSuccess'));
      setTimeout(() => setSuccess(null), 3000);
      setShowTypesConfig(false);
    } catch (err: any) {
      console.error('Erreur sauvegarde config organisations:', err);
      setError(err.message);
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Ajouter une certification disponible
  const addCertification = (cert: string) => {
    if (cert.trim() && !orgsConfig.certifications_disponibles.includes(cert.trim())) {
      setOrgsConfig({
        ...orgsConfig,
        certifications_disponibles: [...orgsConfig.certifications_disponibles, cert.trim()],
      });
    }
  };

  // Supprimer une certification disponible
  const removeCertification = (cert: string) => {
    setOrgsConfig({
      ...orgsConfig,
      certifications_disponibles: orgsConfig.certifications_disponibles.filter(c => c !== cert),
      types_organisations: Object.fromEntries(
        Object.entries(orgsConfig.types_organisations).map(([key, value]) => [
          key,
          {
            ...value,
            certifications_requises: value.certifications_requises.filter(c => c !== cert),
          },
        ])
      ) as Record<TypeOrganisation, TypeOrganisationConfig>,
    });
  };

  // Ajouter une certification à un type d'organisation
  const addCertificationToType = (type: TypeOrganisation, cert: string) => {
    const typeConfig = orgsConfig.types_organisations[type];
    if (!typeConfig.certifications_requises.includes(cert)) {
      setOrgsConfig({
        ...orgsConfig,
        types_organisations: {
          ...orgsConfig.types_organisations,
          [type]: {
            ...typeConfig,
            certifications_requises: [...typeConfig.certifications_requises, cert],
          },
        },
      });
    }
  };

  // Supprimer une certification d'un type d'organisation
  const removeCertificationFromType = (type: TypeOrganisation, cert: string) => {
    const typeConfig = orgsConfig.types_organisations[type];
    setOrgsConfig({
      ...orgsConfig,
      types_organisations: {
        ...orgsConfig.types_organisations,
        [type]: {
          ...typeConfig,
          certifications_requises: typeConfig.certifications_requises.filter(c => c !== cert),
        },
      },
    });
  };

  // Filtrer les organisations
  const filteredOrgs = organisations.filter(org =>
    org.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.type_organisation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (org.ville || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Ouvrir modal création
  const openCreateModal = () => {
    setFormData({
      nom: '',
      type_organisation: 'autre',
      pays: 'Cameroun',
      region: '',
      ville: '',
      adresse: '',
      contact_officiel: '',
      telephone: '',
      email: '',
      site_web: '',
      statut_actif: true,
    });
    setSelectedOrg(null);
    setModalMode('create');
    setShowModal(true);
  };

  // Ouvrir modal édition
  const openEditModal = (org: Organisation) => {
    setFormData({
      nom: org.nom,
      type_organisation: org.type_organisation as TypeOrganisation,
      pays: org.pays,
      region: org.region || '',
      ville: org.ville || '',
      adresse: org.adresse || '',
      contact_officiel: org.contact_officiel || '',
      telephone: org.telephone || '',
      email: org.email || '',
      site_web: org.site_web || '',
      statut_actif: org.statut_actif,
    });
    setSelectedOrg(org);
    setModalMode('edit');
    setShowModal(true);
  };

  // Ouvrir modal vue
  const openViewModal = (org: Organisation) => {
    setSelectedOrg(org);
    setModalMode('view');
    setShowModal(true);
  };

  // Sauvegarder organisation
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      if (modalMode === 'create') {
        const { error: insertError } = await (supabase as any)
          .from('organisation')
          .insert({
            nom: formData.nom,
            type_organisation: formData.type_organisation,
            pays: formData.pays,
            ville: formData.ville || null,
            region: formData.region || null,
            adresse: formData.adresse || null,
            telephone: formData.telephone || null,
            email: formData.email || null,
            site_web: formData.site_web || null,
            contact_officiel: formData.contact_officiel || null,
            statut_actif: formData.statut_actif,
          });

        if (insertError) throw insertError;
      } else if (modalMode === 'edit' && selectedOrg) {
        const { error: updateError } = await (supabase as any)
          .from('organisation')
          .update({
            nom: formData.nom,
            type_organisation: formData.type_organisation,
            pays: formData.pays,
            ville: formData.ville || null,
            region: formData.region || null,
            adresse: formData.adresse || null,
            telephone: formData.telephone || null,
            email: formData.email || null,
            site_web: formData.site_web || null,
            contact_officiel: formData.contact_officiel || null,
            statut_actif: formData.statut_actif,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedOrg.id);

        if (updateError) throw updateError;
      }

      setSuccess(modalMode === 'create' ? 'Organisation créée avec succès' : 'Organisation modifiée avec succès');
      setTimeout(() => setSuccess(null), 3000);
      setShowModal(false);
      loadOrganisations();
    } catch (err: any) {
      console.error('Erreur sauvegarde:', err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Supprimer organisation
  const handleDelete = async (id: string) => {
    try {
      const { error: deleteError } = await (supabase as any)
        .from('organisation')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setDeleteConfirm(null);
      loadOrganisations();
    } catch (err: any) {
      console.error('Erreur suppression:', err);
      setError(err.message);
    }
  };

  // Toggle statut actif
  const toggleStatus = async (org: Organisation) => {
    try {
      const { error: updateError } = await (supabase as any)
        .from('organisation')
        .update({ statut_actif: !org.statut_actif, updated_at: new Date().toISOString() })
        .eq('id', org.id);

      if (updateError) throw updateError;
      loadOrganisations();
    } catch (err: any) {
      console.error('Erreur toggle statut:', err);
      setError(err.message);
    }
  };

  const exportToCSV = async () => {
    try {
      setIsLoading(true);
      
      // Charger toutes les organisations
      const { data: allOrgs, error: fetchError } = await (supabase as any)
        .from('organisation')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Enrichir avec comptage utilisateurs
      const enrichedOrgs = await Promise.all(
        (allOrgs || []).map(async (org: Organisation) => {
          const { count } = await (supabase as any)
            .from('utilisateur')
            .select('id', { count: 'exact', head: true })
            .eq('id_organisation', org.id);
          return { ...org, _count: { utilisateurs: count || 0 } };
        })
      );

      // Filtrer par recherche si nécessaire
      const filtered = searchTerm
        ? enrichedOrgs.filter(org =>
            org.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
            org.email?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : enrichedOrgs;

      // Créer le CSV
      const headers = ['Nom', 'Type', 'Pays', 'Région', 'Ville', 'Email', 'Téléphone', 'Utilisateurs', 'Statut', 'Date création'];
      const rows = filtered.map(org => [
        org.nom,
        org.type_organisation,
        org.pays,
        org.region || '-',
        org.ville || '-',
        org.email || '-',
        org.telephone || '-',
        (org._count?.utilisateurs || 0).toString(),
        org.statut_actif ? 'Actif' : 'Inactif',
        new Date(org.created_at).toLocaleDateString('fr-FR'),
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
      link.setAttribute('download', `organisations_${new Date().toISOString().split('T')[0]}.csv`);
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

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      police: 'Police',
      gendarmerie: 'Gendarmerie',
      ong_humanitaire: 'ONG Humanitaire',
      croix_rouge: 'Croix-Rouge',
      protection_civile: 'Protection Civile',
      unicef: 'UNICEF',
      gouvernement: 'Gouvernement',
      autre: 'Autre',
    };
    return labels[type] || type;
  };

  return (
    <SuperAdminLayout title={t('super_admin.organisations')} activeNav="organisations">
      <div className={styles['sa-organisations']}>
        {/* Header */}
        <div className={styles['sa-organisations__header']}>
          <div className={styles['sa-organisations__search']}>
            <Search size={18} />
            <input
              type="text"
              placeholder={t('common.search') || 'Rechercher...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => setShowTypesConfig(true)} 
              style={{ 
                background: '#f1f5f9', 
                color: '#475569', 
                border: '1px solid #e2e8f0',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer'
              }}
            >
              <Settings size={18} />
              Types & Certifications
            </button>
            <button className={styles['sa-organisations__export-btn']} onClick={exportToCSV} disabled={isLoading}>
              <Download size={18} />
              Exporter CSV
            </button>
            <button className={styles['sa-organisations__add-btn']} onClick={openCreateModal}>
              <Plus size={20} />
              {t('common.add')}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className={styles['sa-organisations__error']}>
            <AlertCircle size={20} />
            <span>{error}</span>
            <button onClick={() => setError(null)}><X size={16} /></button>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className={styles['sa-organisations__success']} style={{ backgroundColor: '#10b981', color: 'white', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={20} />
            <span>{success}</span>
            <button onClick={() => setSuccess(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={16} /></button>
          </div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className={styles['sa-organisations__skeletonWrap']}>
            <AdminCardsGridSkeleton cardCount={8} />
          </div>
        ) : (
          <div className={styles['sa-organisations__grid']}>
            {filteredOrgs.length === 0 ? (
              <div className={styles['sa-organisations__empty']}>
                <Building2 size={48} />
                <p>{t('common.noData')}</p>
              </div>
            ) : (
              filteredOrgs.map((org) => (
                <div key={org.id} className={styles['sa-organisations__card']}>
                  <div className={styles['sa-organisations__card-header']}>
                    <div className={styles['sa-organisations__card-icon']}>
                      <Building2 size={24} />
                    </div>
                    <div className={`${styles['sa-organisations__card-status']} ${org.statut_actif ? styles['sa-organisations__card-status--active'] : styles['sa-organisations__card-status--inactive']}`}>
                      {org.statut_actif ? t('common.active') : t('common.inactive')}
                    </div>
                  </div>
                  <h3 className={styles['sa-organisations__card-title']}>{org.nom}</h3>
                  <span className={styles['sa-organisations__card-type']}>{getTypeLabel(org.type_organisation)}</span>
                  <div className={styles['sa-organisations__card-info']}>
                    <div className={styles['sa-organisations__info-item']}>
                      <MapPin size={16} />
                      <span>{org.ville || org.pays}</span>
                    </div>
                    <div className={styles['sa-organisations__info-item']}>
                      <Users size={16} />
                      <span>{org._count?.utilisateurs || 0} {t('common.users')}</span>
                    </div>
                  </div>
                  <div className={styles['sa-organisations__card-actions']}>
                    <button onClick={() => openViewModal(org)} title={t('common.view')}><Eye size={16} /></button>
                    <button onClick={() => openEditModal(org)} title={t('common.edit')}><Edit2 size={16} /></button>
                    <button onClick={() => toggleStatus(org)} title={org.statut_actif ? t('common.deactivate') : t('common.activate')}>
                      {org.statut_actif ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                    </button>
                    <button onClick={() => setDeleteConfirm(org.id)} className={styles['sa-organisations__btn-delete']} title={t('common.delete')}><Trash2 size={16} /></button>
                  </div>

                  {/* Delete Confirmation */}
                  {deleteConfirm === org.id && (
                    <div className={styles['sa-organisations__delete-confirm']}>
                      <p>{t('common.confirmDelete')}</p>
                      <div>
                        <button onClick={() => handleDelete(org.id)}><Check size={16} /></button>
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
          <div className={styles['sa-organisations__modal-overlay']} onClick={() => setShowModal(false)}>
            <div className={styles['sa-organisations__modal']} onClick={(e) => e.stopPropagation()}>
              <div className={styles['sa-organisations__modal-header']}>
                <h2>
                  {modalMode === 'create' && (t('super_admin.addOrganisation') || 'Nouvelle organisation')}
                  {modalMode === 'edit' && (t('super_admin.editOrganisation') || 'Modifier organisation')}
                  {modalMode === 'view' && selectedOrg?.nom}
                </h2>
                <button onClick={() => setShowModal(false)}><X size={20} /></button>
              </div>

              <div className={styles['sa-organisations__modal-body']}>
                {modalMode === 'view' && selectedOrg ? (
                  <div className={styles['sa-organisations__view-details']}>
                    <p><strong>Type:</strong> {getTypeLabel(selectedOrg.type_organisation)}</p>
                    <p><strong>Pays:</strong> {selectedOrg.pays}</p>
                    {selectedOrg.ville && <p><strong>Ville:</strong> {selectedOrg.ville}</p>}
                    {selectedOrg.region && <p><strong>Région:</strong> {selectedOrg.region}</p>}
                    {selectedOrg.adresse && <p><strong>Adresse:</strong> {selectedOrg.adresse}</p>}
                    {selectedOrg.telephone && <p><strong>Téléphone:</strong> {selectedOrg.telephone}</p>}
                    {selectedOrg.email && <p><strong>Email:</strong> {selectedOrg.email}</p>}
                    {selectedOrg.site_web && <p><strong>Site web:</strong> {selectedOrg.site_web}</p>}
                    {selectedOrg.contact_officiel && <p><strong>Contact officiel:</strong> {selectedOrg.contact_officiel}</p>}
                    <p><strong>Statut:</strong> {selectedOrg.statut_actif ? 'Actif' : 'Inactif'}</p>
                    <p><strong>Utilisateurs:</strong> {selectedOrg._count?.utilisateurs ?? 0}</p>
                    <div className={styles['sa-organisations__users-section']}>
                      <h4 className={styles['sa-organisations__users-title']}>
                        <Users size={18} />
                        Liste des utilisateurs ({selectedOrg._count?.utilisateurs ?? 0})
                      </h4>
                      {loadingOrgUsers ? (
                        <div className={styles['sa-organisations__users-loading']}>
                          <Loader2 size={20} className={styles['sa-organisations__spinner']} />
                          Chargement…
                        </div>
                      ) : orgUsers.length === 0 ? (
                        <p className={styles['sa-organisations__users-empty']}>Aucun utilisateur</p>
                      ) : (
                        <div className={styles['sa-organisations__users-list']}>
                          {orgUsers.map((u) => (
                            <div key={u.id} className={styles['sa-organisations__user-card']}>
                              <div className={styles['sa-organisations__user-main']}>
                                <span className={styles['sa-organisations__user-name']}>
                                  {u.prenom} {u.nom}
                                </span>
                                <span className={styles['sa-organisations__user-email']}>{u.email}</span>
                              </div>
                              <div className={styles['sa-organisations__user-meta']}>
                                {u.telephone && <span>Tél. {u.telephone}</span>}
                                <span className={styles['sa-organisations__user-badge']}>{u.statut_compte}</span>
                                <span className={styles['sa-organisations__user-badge']}>{u.type_compte}</span>
                                {u.derniere_connexion && (
                                  <span>Dernière connexion: {new Date(u.derniere_connexion).toLocaleString('fr-FR')}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
                {modalMode === 'view' && selectedOrg && (
                  <div className={styles['sa-organisations__modal-footer']}>
                    <button type="button" onClick={() => { setShowModal(false); openEditModal(selectedOrg); }}>
                      <Edit2 size={16} /> Modifier
                    </button>
                    <button type="button" onClick={() => setShowModal(false)}>Fermer</button>
                  </div>
                )}
                {modalMode !== 'view' && (
                  <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                    <div className={styles['sa-organisations__form-grid']}>
                      <div className={styles['sa-organisations__form-field']}>
                        <label>{t('common.name')} *</label>
                        <input type="text" value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} required />
                      </div>
                      <div className={styles['sa-organisations__form-field']}>
                        <label>{t('common.type')} *</label>
                        <select value={formData.type_organisation} onChange={(e) => setFormData({ ...formData, type_organisation: e.target.value as TypeOrganisation })}>
                          {typeOptions.map((type) => (<option key={type} value={type}>{getTypeLabel(type)}</option>))}
                        </select>
                      </div>
                      <div className={styles['sa-organisations__form-field']}>
                        <label>{t('common.country')}</label>
                        <input type="text" value={formData.pays} onChange={(e) => setFormData({ ...formData, pays: e.target.value })} />
                      </div>
                      <div className={styles['sa-organisations__form-field']}>
                        <label>{t('common.city')}</label>
                        <input type="text" value={formData.ville} onChange={(e) => setFormData({ ...formData, ville: e.target.value })} />
                      </div>
                      <div className={styles['sa-organisations__form-field']}>
                        <label>{t('common.region')}</label>
                        <input type="text" value={formData.region} onChange={(e) => setFormData({ ...formData, region: e.target.value })} />
                      </div>
                      <div className={styles['sa-organisations__form-field']}>
                        <label>{t('common.address')}</label>
                        <input type="text" value={formData.adresse} onChange={(e) => setFormData({ ...formData, adresse: e.target.value })} />
                      </div>
                      <div className={styles['sa-organisations__form-field']}>
                        <label>{t('common.phone')}</label>
                        <input type="tel" value={formData.telephone} onChange={(e) => setFormData({ ...formData, telephone: e.target.value })} />
                      </div>
                      <div className={styles['sa-organisations__form-field']}>
                        <label>{t('common.email')}</label>
                        <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                      </div>
                      <div className={styles['sa-organisations__form-field']}>
                        <label>{t('common.website')}</label>
                        <input type="url" value={formData.site_web} onChange={(e) => setFormData({ ...formData, site_web: e.target.value })} />
                      </div>
                      <div className={styles['sa-organisations__form-field']}>
                        <label className={styles['sa-organisations__checkbox-label']}>
                          <input type="checkbox" checked={formData.statut_actif} onChange={(e) => setFormData({ ...formData, statut_actif: e.target.checked })} />
                          {t('common.active')}
                        </label>
                      </div>
                    </div>
                    <div className={styles['sa-organisations__modal-footer']}>
                      <button type="button" onClick={() => setShowModal(false)}>{t('common.cancel')}</button>
                      <button type="submit" disabled={isSaving || !formData.nom}>
                        {isSaving ? <Loader2 size={16} className={styles['sa-organisations__spinner']} /> : <Check size={16} />}
                        {t('common.save')}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Configuration Types & Certifications */}
        {showTypesConfig && (
          <div className={styles['sa-organisations__modal-overlay']} onClick={() => setShowTypesConfig(false)}>
            <div className={styles['sa-organisations__modal']} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div className={styles['sa-organisations__modal-header']}>
                <h2>Gérer les types d'organisations et certifications</h2>
                <button onClick={() => setShowTypesConfig(false)}><X size={20} /></button>
              </div>
              
              <div className={styles['sa-organisations__modal-body']}>
                {/* Certifications disponibles */}
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Shield size={18} />
                    Certifications disponibles
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                    {orgsConfig.certifications_disponibles.map((cert) => (
                      <span 
                        key={cert}
                        style={{
                          background: '#e0e7ff',
                          color: '#4338ca',
                          padding: '0.375rem 0.75rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        {cert}
                        <button
                          onClick={() => removeCertification(cert)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#4338ca' }}
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      placeholder="Ajouter une certification..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addCertification((e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                      style={{ flex: 1, padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem' }}
                    />
                    <button
                      onClick={(e) => {
                        const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                        if (input?.value) {
                          addCertification(input.value);
                          input.value = '';
                        }
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#667eea',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer'
                      }}
                    >
                      Ajouter
                    </button>
                  </div>
                </div>

                {/* Types d'organisations */}
                <div>
                  <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Building2 size={18} />
                    Types d'organisations
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {typeOptions.map((type) => {
                      const typeConfig = orgsConfig.types_organisations[type];
                      return (
                        <div key={type} style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                            <div>
                              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{typeConfig.label}</h4>
                              {typeConfig.description && (
                                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>{typeConfig.description}</p>
                              )}
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={typeConfig.actif}
                                onChange={(e) => {
                                  setOrgsConfig({
                                    ...orgsConfig,
                                    types_organisations: {
                                      ...orgsConfig.types_organisations,
                                      [type]: { ...typeConfig, actif: e.target.checked },
                                    },
                                  });
                                }}
                              />
                              Actif
                            </label>
                          </div>
                          
                          <div>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', display: 'block' }}>
                              Certifications requises pour ce type :
                            </label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                              {typeConfig.certifications_requises.map((cert) => (
                                <span
                                  key={cert}
                                  style={{
                                    background: '#dbeafe',
                                    color: '#1e40af',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '0.25rem',
                                    fontSize: '0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                  }}
                                >
                                  {cert}
                                  <button
                                    onClick={() => removeCertificationFromType(type, cert)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#1e40af' }}
                                  >
                                    <X size={12} />
                                  </button>
                                </span>
                              ))}
                            </div>
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  addCertificationToType(type, e.target.value);
                                  e.target.value = '';
                                }
                              }}
                              style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem' }}
                            >
                              <option value="">Ajouter une certification...</option>
                              {orgsConfig.certifications_disponibles
                                .filter(cert => !typeConfig.certifications_requises.includes(cert))
                                .map((cert) => (
                                  <option key={cert} value={cert}>{cert}</option>
                                ))}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className={styles['sa-organisations__modal-footer']}>
                <button onClick={() => { setShowTypesConfig(false); setOrgsConfig(originalOrgsConfig); }}>Annuler</button>
                <button 
                  onClick={handleSaveOrganisationsConfig} 
                  disabled={isSavingConfig || JSON.stringify(orgsConfig) === JSON.stringify(originalOrgsConfig)}
                  className={styles['sa-organisations__btn-save']}
                >
                  {isSavingConfig ? <Loader2 size={16} className={styles['sa-organisations__spinner']} /> : <Save size={16} />}
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

export default SuperAdminOrganisationsPage;
