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
import { 
  Building2, Users, MapPin, Plus, Edit2, Trash2, X, Check, 
  Loader2, AlertCircle, Search, Eye, ToggleLeft, ToggleRight 
} from 'lucide-react';
import styles from './OrganisationsPage.module.css';

interface Organisation {
  id: string;
  nom: string;
  type_organisation: string;
  pays: string;
  ville?: string;
  region?: string;
  adresse?: string;
  telephone?: string;
  email?: string;
  site_web?: string;
  description?: string;
  statut_actif: boolean;
  created_at: string;
  _count?: { utilisateurs: number };
}

type TypeOrganisation = 'police' | 'gendarmerie' | 'ong_humanitaire' | 'croix_rouge' | 'protection_civile' | 'unicef' | 'gouvernement' | 'autre';

const typeOptions: TypeOrganisation[] = ['police', 'gendarmerie', 'ong_humanitaire', 'croix_rouge', 'protection_civile', 'unicef', 'gouvernement', 'autre'];

export const SuperAdminOrganisationsPage: React.FC = () => {
  const { t } = useI18n();
  
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedOrg, setSelectedOrg] = useState<Organisation | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    nom: '',
    type_organisation: 'autre' as TypeOrganisation,
    pays: 'Cameroun',
    ville: '',
    region: '',
    adresse: '',
    telephone: '',
    email: '',
    site_web: '',
    description: '',
    statut_actif: true,
  });

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

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

  useEffect(() => {
    loadOrganisations();
  }, [loadOrganisations]);

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
      ville: '',
      region: '',
      adresse: '',
      telephone: '',
      email: '',
      site_web: '',
      description: '',
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
      ville: org.ville || '',
      region: org.region || '',
      adresse: org.adresse || '',
      telephone: org.telephone || '',
      email: org.email || '',
      site_web: org.site_web || '',
      description: org.description || '',
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
            description: formData.description || null,
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
            description: formData.description || null,
            statut_actif: formData.statut_actif,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedOrg.id);

        if (updateError) throw updateError;
      }

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
          <button className={styles['sa-organisations__add-btn']} onClick={openCreateModal}>
            <Plus size={20} />
            {t('common.add')}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className={styles['sa-organisations__error']}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className={styles['sa-organisations__loading']}>
            <Loader2 size={32} className={styles['sa-organisations__spinner']} />
          </div>
        ) : (
          <div className={styles['sa-organisations__grid']}>
            {filteredOrgs.length === 0 ? (
              <div className={styles['sa-organisations__empty']}>
                <Building2 size={48} />
                <p>{t('common.noData') || 'Aucune organisation'}</p>
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
                    {selectedOrg.description && <p><strong>Description:</strong> {selectedOrg.description}</p>}
                    <p><strong>Statut:</strong> {selectedOrg.statut_actif ? 'Actif' : 'Inactif'}</p>
                    <p><strong>Utilisateurs:</strong> {selectedOrg._count?.utilisateurs || 0}</p>
                  </div>
                ) : (
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
                      <div className={styles['sa-organisations__form-field']} style={{ gridColumn: '1 / -1' }}>
                        <label>{t('common.description')}</label>
                        <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
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
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminOrganisationsPage;
