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
  Loader2, AlertCircle, Search, Eye, MapPin
} from 'lucide-react';
import styles from './CampagnesPage.module.css';

interface Campagne {
  id: string;
  titre: string;
  description?: string;
  date_debut: string;
  date_fin?: string;
  type_campagne: string;
  zone_geographique?: string;
  statut: string;
  id_createur?: string;
  budget_estime?: number;
  objectif?: string;
  created_at: string;
  createur?: { nom: string; email: string };
}

type TypeCampagne = 'sensibilisation' | 'recherche_active' | 'prevention' | 'formation' | 'autre';
type StatutCampagne = 'planifiee' | 'en_cours' | 'terminee' | 'annulee';

export const SuperAdminCampagnesPage: React.FC = () => {
  useI18n(); // For future i18n support
  
  const [campagnes, setCampagnes] = useState<Campagne[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedCampagne, setSelectedCampagne] = useState<Campagne | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    date_debut: '',
    date_fin: '',
    type_campagne: 'sensibilisation' as TypeCampagne,
    zone_geographique: '',
    statut: 'planifiee' as StatutCampagne,
    budget_estime: 0,
    objectif: '',
  });

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadCampagnes = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await (supabase as any)
        .from('campagne_sensibilisation')
        .select('*')
        .order('date_debut', { ascending: false });

      if (fetchError) throw fetchError;

      // Enrichir avec les créateurs
      const enrichedCampagnes = await Promise.all(
        (data || []).map(async (campagne: Campagne) => {
          if (campagne.id_createur) {
            const { data: user } = await (supabase as any)
              .from('utilisateur')
              .select('nom, email')
              .eq('id', campagne.id_createur)
              .single();
            return { ...campagne, createur: user };
          }
          return campagne;
        })
      );

      setCampagnes(enrichedCampagnes);
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
    (c.zone_geographique || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Ouvrir modal création
  const openCreateModal = () => {
    setFormData({
      titre: '',
      description: '',
      date_debut: new Date().toISOString().split('T')[0],
      date_fin: '',
      type_campagne: 'sensibilisation',
      zone_geographique: '',
      statut: 'planifiee',
      budget_estime: 0,
      objectif: '',
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
      date_debut: campagne.date_debut.split('T')[0],
      date_fin: campagne.date_fin?.split('T')[0] || '',
      type_campagne: campagne.type_campagne as TypeCampagne,
      zone_geographique: campagne.zone_geographique || '',
      statut: campagne.statut as StatutCampagne,
      budget_estime: campagne.budget_estime || 0,
      objectif: campagne.objectif || '',
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

      if (modalMode === 'create') {
        const { error: insertError } = await (supabase as any)
          .from('campagne_sensibilisation')
          .insert({
            titre: formData.titre,
            description: formData.description || null,
            date_debut: formData.date_debut,
            date_fin: formData.date_fin || null,
            type_campagne: formData.type_campagne,
            zone_geographique: formData.zone_geographique || null,
            statut: formData.statut,
            budget_estime: formData.budget_estime || null,
            objectif: formData.objectif || null,
          });

        if (insertError) throw insertError;
      } else if (modalMode === 'edit' && selectedCampagne) {
        const { error: updateError } = await (supabase as any)
          .from('campagne_sensibilisation')
          .update({
            titre: formData.titre,
            description: formData.description || null,
            date_debut: formData.date_debut,
            date_fin: formData.date_fin || null,
            type_campagne: formData.type_campagne,
            zone_geographique: formData.zone_geographique || null,
            statut: formData.statut,
            budget_estime: formData.budget_estime || null,
            objectif: formData.objectif || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedCampagne.id);

        if (updateError) throw updateError;
      }

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
          <button className={styles['sa-campagnes__add-btn']} onClick={openCreateModal}>
            <Plus size={20} />
            Nouvelle campagne
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className={styles['sa-campagnes__error']}>
            <AlertCircle size={20} />
            <span>{error}</span>
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
                    <span className={`${styles['sa-campagnes__badge']} ${styles[`sa-campagnes__badge--${getStatutColor(campagne.statut)}`]}`}>
                      {getStatutLabel(campagne.statut)}
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
                    {campagne.zone_geographique && (
                      <div className={styles['sa-campagnes__info-item']}>
                        <MapPin size={16} />
                        <span>{campagne.zone_geographique}</span>
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
                  <div className={styles['sa-campagnes__view-details']}>
                    <p><strong>Type:</strong> {getTypeLabel(selectedCampagne.type_campagne)}</p>
                    <p><strong>Statut:</strong> {getStatutLabel(selectedCampagne.statut)}</p>
                    <p><strong>Date début:</strong> {new Date(selectedCampagne.date_debut).toLocaleDateString('fr-FR')}</p>
                    {selectedCampagne.date_fin && <p><strong>Date fin:</strong> {new Date(selectedCampagne.date_fin).toLocaleDateString('fr-FR')}</p>}
                    {selectedCampagne.zone_geographique && <p><strong>Zone:</strong> {selectedCampagne.zone_geographique}</p>}
                    {selectedCampagne.objectif && <p><strong>Objectif:</strong> {selectedCampagne.objectif}</p>}
                    {selectedCampagne.budget_estime && <p><strong>Budget:</strong> {selectedCampagne.budget_estime.toLocaleString()} XAF</p>}
                    {selectedCampagne.description && <p><strong>Description:</strong> {selectedCampagne.description}</p>}
                    {selectedCampagne.createur && <p><strong>Créateur:</strong> {selectedCampagne.createur.nom}</p>}
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
                        <select value={formData.statut} onChange={(e) => setFormData({ ...formData, statut: e.target.value as StatutCampagne })}>
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
                        <label>Zone géographique</label>
                        <input type="text" value={formData.zone_geographique} onChange={(e) => setFormData({ ...formData, zone_geographique: e.target.value })} placeholder="Ex: Yaoundé, Douala" />
                      </div>
                      <div className={styles['sa-campagnes__form-field']}>
                        <label>Budget estimé (XAF)</label>
                        <input type="number" value={formData.budget_estime} onChange={(e) => setFormData({ ...formData, budget_estime: parseInt(e.target.value) || 0 })} />
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
