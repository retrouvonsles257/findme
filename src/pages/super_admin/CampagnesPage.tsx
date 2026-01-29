/**
 * =====================================================
 * RETROUVONSLES - Super Admin Campagnes Page
 * Gestion des campagnes de sensibilisation avec CRUD
 * Connecté à Supabase table: campagne_sensibilisation
 * =====================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../../hooks';
import { supabase } from '../../config';
import { SuperAdminLayout } from './SuperAdminLayout';
import { 
  Megaphone, Calendar, Plus, Edit2, Trash2, X, Check, 
  Loader2, AlertCircle, Search, Eye, MapPin, CheckCircle, Download
} from 'lucide-react';
import styles from './CampagnesPage.module.css';

interface Campagne {
  id: string;
  titre: string;
  description?: string;
  objectif?: string;
  type_campagne: string;
  public_cible?: string;
  date_debut: string;
  date_fin?: string;
  zones_geographiques?: Record<string, any>; // JSONB
  canaux_diffusion?: Record<string, any>; // JSONB
  contenu_campagne?: Record<string, any>; // JSONB
  statut_campagne: string;
  nombre_personnes_touchees?: number;
  nombre_interactions?: number;
  budget_alloue?: number;
  budget_depense?: number;
  creee_par?: string;
  id_organisation?: string;
  created_at: string;
  createur?: { nom: string; email: string };
  organisation?: { nom: string };
}

type TypeCampagne = 'sensibilisation' | 'recherche_active' | 'prevention' | 'formation' | 'autre';
type StatutCampagne = 'planifiee' | 'en_cours' | 'terminee' | 'annulee';

export const SuperAdminCampagnesPage: React.FC = () => {
  useI18n(); // For future i18n support
  
  const [campagnes, setCampagnes] = useState<Campagne[]>([]);
  const [organisations, setOrganisations] = useState<{ id: string; nom: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedCampagne, setSelectedCampagne] = useState<Campagne | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state - TOUS les champs du modèle SQL
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    objectif: '',
    type_campagne: 'sensibilisation' as TypeCampagne,
    public_cible: '',
    date_debut: '',
    date_fin: '',
    zones_geographiques: '',
    canaux_diffusion: '',
    contenu_campagne: '',
    statut_campagne: 'planifiee' as StatutCampagne,
    nombre_personnes_touchees: 0,
    nombre_interactions: 0,
    budget_alloue: 0,
    budget_depense: 0,
    id_organisation: '',
  });

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadCampagnes = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [campagnesResult, orgsResult] = await Promise.all([
        (supabase as any)
          .from('campagne_sensibilisation')
          .select(`
            *,
            createur:utilisateur!campagne_sensibilisation_creee_par_fkey(nom, email),
            organisation:organisation(nom)
          `)
          .order('date_debut', { ascending: false }),
        (supabase as any).from('organisation').select('id, nom').eq('statut_actif', true),
      ]);

      if (campagnesResult.error) throw campagnesResult.error;
      if (orgsResult.error) throw orgsResult.error;

      // Les données sont déjà enrichies par Supabase avec les relations
      setCampagnes(campagnesResult.data || []);
      setOrganisations(orgsResult.data || []);
    } catch (err: any) {
      console.error('Erreur chargement campagnes:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCampagnes();
  }, [loadCampagnes]);

  // Filtrer les campagnes
  const filteredCampagnes = campagnes.filter(c =>
    c.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.public_cible || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Ouvrir modal création
  const openCreateModal = () => {
    setFormData({
      titre: '',
      description: '',
      objectif: '',
      type_campagne: 'sensibilisation',
      public_cible: '',
      date_debut: new Date().toISOString().split('T')[0],
      date_fin: '',
      zones_geographiques: '',
      canaux_diffusion: '',
      contenu_campagne: '',
      statut_campagne: 'planifiee',
      nombre_personnes_touchees: 0,
      nombre_interactions: 0,
      budget_alloue: 0,
      budget_depense: 0,
      id_organisation: '',
    });
    setSelectedCampagne(null);
    setModalMode('create');
    setShowModal(true);
  };

  // Ouvrir modal édition
  const openEditModal = (campagne: Campagne) => {
    setFormData({
      titre: campagne.titre,
      description: campagne.description || '',
      objectif: campagne.objectif || '',
      type_campagne: campagne.type_campagne as TypeCampagne,
      public_cible: campagne.public_cible || '',
      date_debut: campagne.date_debut.split('T')[0],
      date_fin: campagne.date_fin?.split('T')[0] || '',
      zones_geographiques: campagne.zones_geographiques ? JSON.stringify(campagne.zones_geographiques, null, 2) : '',
      canaux_diffusion: campagne.canaux_diffusion ? JSON.stringify(campagne.canaux_diffusion, null, 2) : '',
      contenu_campagne: campagne.contenu_campagne ? JSON.stringify(campagne.contenu_campagne, null, 2) : '',
      statut_campagne: campagne.statut_campagne as StatutCampagne,
      nombre_personnes_touchees: campagne.nombre_personnes_touchees || 0,
      nombre_interactions: campagne.nombre_interactions || 0,
      budget_alloue: campagne.budget_alloue || 0,
      budget_depense: campagne.budget_depense || 0,
      id_organisation: campagne.id_organisation || '',
    });
    setSelectedCampagne(campagne);
    setModalMode('edit');
    setShowModal(true);
  };

  // Ouvrir modal vue
  const openViewModal = (campagne: Campagne) => {
    setSelectedCampagne(campagne);
    setModalMode('view');
    setShowModal(true);
  };

  // Sauvegarder campagne
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();

      // Préparer les données avec TOUS les champs
      const campagneData: any = {
        titre: formData.titre,
        description: formData.description || null,
        objectif: formData.objectif || null,
        type_campagne: formData.type_campagne,
        public_cible: formData.public_cible || null,
        date_debut: formData.date_debut,
        date_fin: formData.date_fin || null,
        statut_campagne: formData.statut_campagne,
        nombre_personnes_touchees: formData.nombre_personnes_touchees || 0,
        nombre_interactions: formData.nombre_interactions || 0,
        budget_alloue: formData.budget_alloue || null,
        budget_depense: formData.budget_depense || null,
        id_organisation: formData.id_organisation || null,
      };

      // Parser les champs JSONB
      if (formData.zones_geographiques) {
        try {
          campagneData.zones_geographiques = JSON.parse(formData.zones_geographiques);
        } catch (e) {
          // Si JSON invalide, ignorer
        }
      }
      if (formData.canaux_diffusion) {
        try {
          campagneData.canaux_diffusion = JSON.parse(formData.canaux_diffusion);
        } catch (e) {
          // Si JSON invalide, ignorer
        }
      }
      if (formData.contenu_campagne) {
        try {
          campagneData.contenu_campagne = JSON.parse(formData.contenu_campagne);
        } catch (e) {
          // Si JSON invalide, ignorer
        }
      }

      if (modalMode === 'create') {
        campagneData.creee_par = user?.id || null;
        const { error: insertError } = await (supabase as any)
          .from('campagne_sensibilisation')
          .insert(campagneData);
        if (insertError) throw insertError;
      } else if (modalMode === 'edit' && selectedCampagne) {
        const { error: updateError } = await (supabase as any)
          .from('campagne_sensibilisation')
          .update(campagneData)
          .eq('id', selectedCampagne.id);
        if (updateError) throw updateError;
      }

      setSuccess(modalMode === 'create' ? 'Campagne créée avec succès' : 'Campagne modifiée avec succès');
      setTimeout(() => setSuccess(null), 3000);
      setShowModal(false);
      loadCampagnes();
    } catch (err: any) {
      console.error('Erreur sauvegarde:', err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Supprimer campagne
  const handleDelete = async (id: string) => {
    try {
      const { error: deleteError } = await (supabase as any)
        .from('campagne_sensibilisation')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setDeleteConfirm(null);
      loadCampagnes();
    } catch (err: any) {
      console.error('Erreur suppression:', err);
      setError(err.message);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      sensibilisation: 'Sensibilisation',
      recherche_active: 'Recherche Active',
      prevention: 'Prévention',
      formation: 'Formation',
      autre: 'Autre',
    };
    return labels[type] || type;
  };

  const getStatutLabel = (statut: string) => {
    const labels: Record<string, string> = {
      planifiee: 'Planifiée',
      en_cours: 'En cours',
      terminee: 'Terminée',
      annulee: 'Annulée',
    };
    return labels[statut] || statut;
  };

  const getStatutColor = (statut: string) => {
    const colors: Record<string, string> = {
      planifiee: 'info',
      en_cours: 'success',
      terminee: 'default',
      annulee: 'danger',
    };
    return colors[statut] || 'default';
  };

  const exportToCSV = async () => {
    try {
      setIsLoading(true);
      
      // Charger toutes les campagnes (sans filtres pour l'export complet)
      let query = (supabase as any)
        .from('campagne_sensibilisation')
        .select(`
          *,
          createur:utilisateur!campagne_sensibilisation_creee_par_fkey(nom, email),
          organisation:organisation(nom)
        `)
        .order('created_at', { ascending: false });

      const { data: allCampagnes, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      const headers = [
        'ID', 'Titre', 'Description', 'Objectif', 'Type campagne', 'Public cible',
        'Date début', 'Date fin', 'Zones géographiques', 'Canaux diffusion',
        'Contenu campagne', 'Statut', 'Nombre personnes touchées', 'Nombre interactions',
        'Budget alloué', 'Budget dépensé', 'Organisation', 'Créateur', 'Date création'
      ];
      
      const rows = (allCampagnes || []).map((c: any) => [
        c.id,
        c.titre,
        c.description || '',
        c.objectif || '',
        c.type_campagne,
        c.public_cible || '',
        c.date_debut ? new Date(c.date_debut).toLocaleString('fr-FR') : '',
        c.date_fin ? new Date(c.date_fin).toLocaleString('fr-FR') : '',
        c.zones_geographiques ? JSON.stringify(c.zones_geographiques) : '',
        c.canaux_diffusion ? JSON.stringify(c.canaux_diffusion) : '',
        c.contenu_campagne ? JSON.stringify(c.contenu_campagne) : '',
        c.statut_campagne,
        c.nombre_personnes_touchees || 0,
        c.nombre_interactions || 0,
        c.budget_alloue || '',
        c.budget_depense || '',
        c.organisation?.nom || '',
        c.createur ? `${c.createur.nom} (${c.createur.email})` : '',
        c.created_at ? new Date(c.created_at).toLocaleString('fr-FR') : '',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row: any[]) => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `campagnes_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (err: any) {
      console.error('Erreur export CSV:', err);
      setError('Erreur lors de l\'export: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SuperAdminLayout title="Campagnes de Sensibilisation" activeNav="campagnes">
      <div className={styles['sa-campagnes']}>
        {/* Header */}
        <div className={styles['sa-campagnes__header']}>
          <div className={styles['sa-campagnes__search']}>
            <Search size={18} />
            <input
              type="text"
              placeholder="Rechercher une campagne..."
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
            <button className={styles['sa-campagnes__add-btn']} onClick={openCreateModal}>
              <Plus size={20} />
              Nouvelle campagne
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className={styles['sa-campagnes__error']}>
            <AlertCircle size={20} />
            <span>{error}</span>
            <button onClick={() => setError(null)}><X size={16} /></button>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className={styles['sa-campagnes__success']} style={{ backgroundColor: '#10b981', color: 'white', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={20} />
            <span>{success}</span>
            <button onClick={() => setSuccess(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={16} /></button>
          </div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className={styles['sa-campagnes__loading']}>
            <Loader2 size={32} className={styles['sa-campagnes__spinner']} />
          </div>
        ) : (
          <div className={styles['sa-campagnes__grid']}>
            {filteredCampagnes.length === 0 ? (
              <div className={styles['sa-campagnes__empty']}>
                <Megaphone size={48} />
                <p>Aucune campagne</p>
              </div>
            ) : (
              filteredCampagnes.map((campagne) => (
                <div key={campagne.id} className={styles['sa-campagnes__card']}>
                  <div className={styles['sa-campagnes__card-header']}>
                    <div className={styles['sa-campagnes__card-icon']}>
                      <Megaphone size={24} />
                    </div>
                    <span className={`${styles['sa-campagnes__badge']} ${styles[`sa-campagnes__badge--${getStatutColor(campagne.statut_campagne)}`]}`}>
                      {getStatutLabel(campagne.statut_campagne)}
                    </span>
                  </div>
                  <h3 className={styles['sa-campagnes__card-title']}>{campagne.titre}</h3>
                  <span className={styles['sa-campagnes__card-type']}>{getTypeLabel(campagne.type_campagne)}</span>
                  <div className={styles['sa-campagnes__card-info']}>
                    <div className={styles['sa-campagnes__info-item']}>
                      <Calendar size={16} />
                      <span>{new Date(campagne.date_debut).toLocaleDateString('fr-FR')}</span>
                      {campagne.date_fin && <span> - {new Date(campagne.date_fin).toLocaleDateString('fr-FR')}</span>}
                    </div>
                    {campagne.public_cible && (
                      <div className={styles['sa-campagnes__info-item']}>
                        <MapPin size={16} />
                        <span>{campagne.public_cible}</span>
                      </div>
                    )}
                  </div>
                  <div className={styles['sa-campagnes__card-actions']}>
                    <button onClick={() => openViewModal(campagne)} title="Voir"><Eye size={16} /></button>
                    <button onClick={() => openEditModal(campagne)} title="Modifier"><Edit2 size={16} /></button>
                    <button onClick={() => setDeleteConfirm(campagne.id)} className={styles['sa-campagnes__btn-delete']} title="Supprimer"><Trash2 size={16} /></button>
                  </div>

                  {deleteConfirm === campagne.id && (
                    <div className={styles['sa-campagnes__delete-confirm']}>
                      <p>Confirmer la suppression ?</p>
                      <div>
                        <button onClick={() => handleDelete(campagne.id)}><Check size={16} /></button>
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
          <div className={styles['sa-campagnes__modal-overlay']} onClick={() => setShowModal(false)}>
            <div className={styles['sa-campagnes__modal']} onClick={(e) => e.stopPropagation()}>
              <div className={styles['sa-campagnes__modal-header']}>
                <h2>
                  {modalMode === 'create' && 'Nouvelle campagne'}
                  {modalMode === 'edit' && 'Modifier campagne'}
                  {modalMode === 'view' && selectedCampagne?.titre}
                </h2>
                <button onClick={() => setShowModal(false)}><X size={20} /></button>
              </div>

              <div className={styles['sa-campagnes__modal-body']}>
                {modalMode === 'view' && selectedCampagne ? (
                  <div className={styles['sa-campagnes__view-details']} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                    <div><label>Type:</label><span>{getTypeLabel(selectedCampagne.type_campagne)}</span></div>
                    <div><label>Statut:</label><span>{getStatutLabel(selectedCampagne.statut_campagne)}</span></div>
                    <div><label>Date début:</label><span>{new Date(selectedCampagne.date_debut).toLocaleDateString('fr-FR')}</span></div>
                    {selectedCampagne.date_fin && <div><label>Date fin:</label><span>{new Date(selectedCampagne.date_fin).toLocaleDateString('fr-FR')}</span></div>}
                    {selectedCampagne.public_cible && <div><label>Public cible:</label><span>{selectedCampagne.public_cible}</span></div>}
                    {selectedCampagne.organisation && <div><label>Organisation:</label><span>{selectedCampagne.organisation.nom}</span></div>}
                    {selectedCampagne.budget_alloue && <div><label>Budget alloué:</label><span>{selectedCampagne.budget_alloue.toLocaleString()} XAF</span></div>}
                    {selectedCampagne.budget_depense && <div><label>Budget dépensé:</label><span>{selectedCampagne.budget_depense.toLocaleString()} XAF</span></div>}
                    {selectedCampagne.nombre_personnes_touchees !== undefined && <div><label>Personnes touchées:</label><span>{selectedCampagne.nombre_personnes_touchees}</span></div>}
                    {selectedCampagne.nombre_interactions !== undefined && <div><label>Interactions:</label><span>{selectedCampagne.nombre_interactions}</span></div>}
                    {selectedCampagne.objectif && <div style={{ gridColumn: '1 / -1' }}><label>Objectif:</label><span>{selectedCampagne.objectif}</span></div>}
                    {selectedCampagne.description && <div style={{ gridColumn: '1 / -1' }}><label>Description:</label><span>{selectedCampagne.description}</span></div>}
                    {selectedCampagne.zones_geographiques && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label>Zones géographiques:</label>
                        <pre style={{ fontSize: '0.875rem', padding: '0.75rem', background: '#f1f5f9', borderRadius: '0.5rem', overflow: 'auto', maxHeight: '150px' }}>
                          {JSON.stringify(selectedCampagne.zones_geographiques, null, 2)}
                        </pre>
                      </div>
                    )}
                    {selectedCampagne.canaux_diffusion && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label>Canaux de diffusion:</label>
                        <pre style={{ fontSize: '0.875rem', padding: '0.75rem', background: '#f1f5f9', borderRadius: '0.5rem', overflow: 'auto', maxHeight: '150px' }}>
                          {JSON.stringify(selectedCampagne.canaux_diffusion, null, 2)}
                        </pre>
                      </div>
                    )}
                    {selectedCampagne.contenu_campagne && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label>Contenu campagne:</label>
                        <pre style={{ fontSize: '0.875rem', padding: '0.75rem', background: '#f1f5f9', borderRadius: '0.5rem', overflow: 'auto', maxHeight: '150px' }}>
                          {JSON.stringify(selectedCampagne.contenu_campagne, null, 2)}
                        </pre>
                      </div>
                    )}
                    {selectedCampagne.createur && <div><label>Créateur:</label><span>{selectedCampagne.createur.nom} ({selectedCampagne.createur.email})</span></div>}
                  </div>
                ) : (
                  <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                    <div className={styles['sa-campagnes__form-grid']}>
                      <div className={styles['sa-campagnes__form-field']} style={{ gridColumn: '1 / -1' }}>
                        <label>Titre *</label>
                        <input type="text" value={formData.titre} onChange={(e) => setFormData({ ...formData, titre: e.target.value })} required />
                      </div>
                      <div className={styles['sa-campagnes__form-field']}>
                        <label>Type *</label>
                        <select value={formData.type_campagne} onChange={(e) => setFormData({ ...formData, type_campagne: e.target.value as TypeCampagne })}>
                          <option value="sensibilisation">Sensibilisation</option>
                          <option value="recherche_active">Recherche Active</option>
                          <option value="prevention">Prévention</option>
                          <option value="formation">Formation</option>
                          <option value="autre">Autre</option>
                        </select>
                      </div>
                      <div className={styles['sa-campagnes__form-field']}>
                        <label>Statut *</label>
                        <select value={formData.statut_campagne} onChange={(e) => setFormData({ ...formData, statut_campagne: e.target.value as StatutCampagne })}>
                          <option value="planifiee">Planifiée</option>
                          <option value="en_cours">En cours</option>
                          <option value="terminee">Terminée</option>
                          <option value="annulee">Annulée</option>
                        </select>
                      </div>
                      <div className={styles['sa-campagnes__form-field']}>
                        <label>Date début *</label>
                        <input type="date" value={formData.date_debut} onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })} required />
                      </div>
                      <div className={styles['sa-campagnes__form-field']}>
                        <label>Date fin</label>
                        <input type="date" value={formData.date_fin} onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })} />
                      </div>
                      <div className={styles['sa-campagnes__form-field']}>
                        <label>Public cible</label>
                        <input type="text" value={formData.public_cible} onChange={(e) => setFormData({ ...formData, public_cible: e.target.value })} placeholder="Ex: Jeunes, Parents, etc." />
                      </div>
                      <div className={styles['sa-campagnes__form-field']}>
                        <label>Budget alloué (XAF)</label>
                        <input type="number" value={formData.budget_alloue} onChange={(e) => setFormData({ ...formData, budget_alloue: parseFloat(e.target.value) || 0 })} />
                      </div>
                      <div className={styles['sa-campagnes__form-field']}>
                        <label>Budget dépensé (XAF)</label>
                        <input type="number" value={formData.budget_depense} onChange={(e) => setFormData({ ...formData, budget_depense: parseFloat(e.target.value) || 0 })} />
                      </div>
                      <div className={styles['sa-campagnes__form-field']}>
                        <label>Organisation</label>
                        <select value={formData.id_organisation} onChange={(e) => setFormData({ ...formData, id_organisation: e.target.value })}>
                          <option value="">Aucune</option>
                          {organisations.map(org => (
                            <option key={org.id} value={org.id}>{org.nom}</option>
                          ))}
                        </select>
                      </div>
                      <div className={styles['sa-campagnes__form-field']} style={{ gridColumn: '1 / -1' }}>
                        <label>Zones géographiques (JSON)</label>
                        <textarea value={formData.zones_geographiques} onChange={(e) => setFormData({ ...formData, zones_geographiques: e.target.value })} rows={3} placeholder='{"regions": ["Centre", "Littoral"]}' />
                      </div>
                      <div className={styles['sa-campagnes__form-field']} style={{ gridColumn: '1 / -1' }}>
                        <label>Canaux de diffusion (JSON)</label>
                        <textarea value={formData.canaux_diffusion} onChange={(e) => setFormData({ ...formData, canaux_diffusion: e.target.value })} rows={3} placeholder='{"canaux": ["web", "mobile"]}' />
                      </div>
                      <div className={styles['sa-campagnes__form-field']} style={{ gridColumn: '1 / -1' }}>
                        <label>Contenu campagne (JSON)</label>
                        <textarea value={formData.contenu_campagne} onChange={(e) => setFormData({ ...formData, contenu_campagne: e.target.value })} rows={3} placeholder='{"messages": ["Message 1", "Message 2"]}' />
                      </div>
                      <div className={styles['sa-campagnes__form-field']} style={{ gridColumn: '1 / -1' }}>
                        <label>Objectif</label>
                        <input type="text" value={formData.objectif} onChange={(e) => setFormData({ ...formData, objectif: e.target.value })} />
                      </div>
                      <div className={styles['sa-campagnes__form-field']} style={{ gridColumn: '1 / -1' }}>
                        <label>Description</label>
                        <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
                      </div>
                    </div>
                    <div className={styles['sa-campagnes__modal-footer']}>
                      <button type="button" onClick={() => setShowModal(false)}>Annuler</button>
                      <button type="submit" disabled={isSaving || !formData.titre}>
                        {isSaving ? <Loader2 size={16} className={styles['sa-campagnes__spinner']} /> : <Check size={16} />}
                        Enregistrer
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

export default SuperAdminCampagnesPage;
