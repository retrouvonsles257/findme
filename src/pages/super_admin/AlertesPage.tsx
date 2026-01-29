/**
 * =====================================================
 * RETROUVONSLES - Super Admin Alertes Page
 * Gestion complète des alertes (CRUD)
 * Connecté à Supabase table: alerte, dossier_disparition
 * =====================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../../hooks';
import { supabase } from '../../config';
import { SuperAdminLayout } from './SuperAdminLayout';
import { 
  Bell, Plus, Edit2, Trash2, X, Minus, Check,
  Loader2, AlertCircle, Search, Eye, Calendar,
  ChevronLeft, ChevronRight, Settings, Save, Download
} from 'lucide-react';
import styles from './AlertesPage.module.css';

interface Dossier {
  id: string;
  numero_dossier: string;
  id_personne?: string;
  personne?: { nom: string; prenom?: string };
}

interface Alerte {
  id: string;
  numero_alerte?: string;
  titre: string;
  message: string;
  message_court?: string;
  type_alerte: string;
  latitude_centre?: number;
  longitude_centre?: number;
  point_centre?: any; // GEOGRAPHY(POINT)
  rayon_km: number;
  zones_specifiques?: Record<string, any>; // JSONB
  date_diffusion: string;
  date_expiration?: string;
  canaux_diffusion?: Record<string, any>; // JSONB
  statut_alerte: string;
  niveau_urgence_min?: number;
  types_utilisateurs?: Record<string, any>; // JSONB
  nombre_destinataires?: number;
  nombre_envois_reussis?: number;
  nombre_vues?: number;
  nombre_partages?: number;
  nombre_signalements_generes?: number;
  validee?: boolean;
  id_utilisateur_validateur?: string;
  date_validation?: string;
  commentaire_validation?: string;
  id_dossier?: string;
  id_utilisateur_createur?: string;
  created_at: string;
  updated_at?: string;
  dossier?: Dossier;
  createur?: { nom: string; email: string };
  validateur?: { nom: string; email: string };
}

type TypeAlerte = 'amber_alert' | 'disparition_enfant' | 'disparition_adulte_vulnerable' | 'disparition_standard' | 'mise_a_jour' | 'personne_retrouvee';
type StatutAlerte = 'brouillon' | 'programmee' | 'en_cours' | 'terminee' | 'annulee';

const ITEMS_PER_PAGE = 15;

interface AlerteGlobalConfig {
  rayon_diffusion_defaut_amber_alert: number;
  rayon_diffusion_defaut_disparition_enfant: number;
  rayon_diffusion_defaut_disparition_adulte_vulnerable: number;
  rayon_diffusion_defaut_disparition_standard: number;
  rayon_diffusion_defaut_mise_a_jour: number;
  rayon_diffusion_defaut_personne_retrouvee: number;
  validation_obligatoire: boolean;
  delai_expiration_defaut_heures: number;
  canaux_diffusion_defaut: {
    push: boolean;
    email: boolean;
    sms: boolean;
    in_app: boolean;
  };
}

const DEFAULT_ALERTE_CONFIG: AlerteGlobalConfig = {
  rayon_diffusion_defaut_amber_alert: 200,
  rayon_diffusion_defaut_disparition_enfant: 150,
  rayon_diffusion_defaut_disparition_adulte_vulnerable: 100,
  rayon_diffusion_defaut_disparition_standard: 50,
  rayon_diffusion_defaut_mise_a_jour: 30,
  rayon_diffusion_defaut_personne_retrouvee: 20,
  validation_obligatoire: true,
  delai_expiration_defaut_heures: 72,
  canaux_diffusion_defaut: {
    push: true,
    email: true,
    sms: false,
    in_app: true,
  },
};

const SuperAdminAlertesPage: React.FC = () => {
  useI18n(); // For future i18n support
  
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedAlerte, setSelectedAlerte] = useState<Alerte | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  
  // Configuration globale
  const [showGlobalConfig, setShowGlobalConfig] = useState(false);
  const [globalConfig, setGlobalConfig] = useState<AlerteGlobalConfig>(DEFAULT_ALERTE_CONFIG);
  const [originalGlobalConfig, setOriginalGlobalConfig] = useState<AlerteGlobalConfig>(DEFAULT_ALERTE_CONFIG);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  
  // Form state - TOUS les champs du modèle SQL
  const [formData, setFormData] = useState({
    titre: '',
    message: '',
    message_court: '',
    type_alerte: 'disparition_standard' as TypeAlerte,
    latitude_centre: '',
    longitude_centre: '',
    rayon_km: 50,
    zones_specifiques: '',
    date_diffusion: '',
    date_expiration: '',
    canaux_diffusion: '',
    statut_alerte: 'brouillon' as StatutAlerte,
    niveau_urgence_min: 1,
    types_utilisateurs: '',
    id_dossier: '',
    validee: false,
    commentaire_validation: '',
  });

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Charger les données
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Charger dossiers actifs
      const { data: dossiersData } = await (supabase as any)
        .from('dossier_disparition')
        .select('id, numero_dossier, id_personne')
        .eq('statut_dossier', 'en_cours')
        .limit(500);

      if (dossiersData) {
        const enrichedDossiers = await Promise.all(
          dossiersData.map(async (d: Dossier) => {
            if (d.id_personne) {
              const { data: personne } = await (supabase as any)
                .from('personne')
                .select('nom, prenom')
                .eq('id', d.id_personne)
                .single();
              return { ...d, personne };
            }
            return d;
          })
        );
        setDossiers(enrichedDossiers);
      }

      // Compter avec filtres
      let countQuery = (supabase as any).from('alerte').select('id', { count: 'exact', head: true });
      if (filterStatut) countQuery = countQuery.eq('statut_alerte', filterStatut);
      if (filterType) countQuery = countQuery.eq('type_alerte', filterType);
      if (searchTerm) {
        countQuery = countQuery.or(`titre.ilike.%${searchTerm}%,message.ilike.%${searchTerm}%`);
      }
      
      const { count } = await countQuery;
      setTotalCount(count || 0);

      // Charger les alertes avec pagination - RÉCUPÉRER TOUS LES CHAMPS
      const offset = (currentPage - 1) * ITEMS_PER_PAGE;
      let query = (supabase as any)
        .from('alerte')
        .select(`
          *,
          dossier:dossier_disparition(*),
          createur:utilisateur!alerte_id_utilisateur_createur_fkey(nom, email),
          validateur:utilisateur!alerte_id_utilisateur_validateur_fkey(nom, email)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1);

      if (filterStatut) query = query.eq('statut_alerte', filterStatut);
      if (filterType) query = query.eq('type_alerte', filterType);
      if (searchTerm) {
        query = query.or(`titre.ilike.%${searchTerm}%,message.ilike.%${searchTerm}%`);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      // Les données sont déjà enrichies par Supabase avec les relations
      // Enrichir avec personne du dossier si nécessaire
      const enrichedAlertes = await Promise.all(
        (data || []).map(async (alerte: any) => {
          let dossier = alerte.dossier;
          
          // Enrichir le dossier avec la personne si disponible
          if (dossier?.id_personne) {
            const { data: personne } = await (supabase as any)
              .from('personne')
              .select('nom, prenom')
              .eq('id', dossier.id_personne)
              .single();
            dossier = { ...dossier, personne };
          }
          
          return {
            ...alerte,
            dossier: dossier || null,
            createur: alerte.createur || null,
            validateur: alerte.validateur || null,
          };
        })
      );

      setAlertes(enrichedAlertes);
    } catch (err: any) {
      console.error('Erreur chargement alertes:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filterStatut, filterType, searchTerm]);

  // Charger la configuration globale
  const loadGlobalConfig = useCallback(async () => {
    try {
      const { data, error: fetchError } = await (supabase as any)
        .from('configuration_systeme')
        .select('*')
        .eq('categorie', 'alertes')
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (data && data.valeur) {
        const loadedConfig = { ...DEFAULT_ALERTE_CONFIG, ...data.valeur };
        setGlobalConfig(loadedConfig);
        setOriginalGlobalConfig(loadedConfig);
      }
    } catch (err: any) {
      console.error('Erreur chargement config alertes:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadGlobalConfig();
  }, [loadData, loadGlobalConfig]);

  // Sauvegarder la configuration globale
  const handleSaveGlobalConfig = async () => {
    try {
      setIsSavingConfig(true);
      setError(null);
      setSuccess(null);

      const { error: upsertError } = await (supabase as any)
        .from('configuration_systeme')
        .upsert({
          categorie: 'alertes',
          cle: 'alertes_config',
          valeur: globalConfig,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'categorie,cle' });

      if (upsertError) throw upsertError;

      setOriginalGlobalConfig(globalConfig);
      setSuccess('Configuration globale des alertes sauvegardée avec succès');
      setTimeout(() => setSuccess(null), 3000);
      setShowGlobalConfig(false);
    } catch (err: any) {
      console.error('Erreur sauvegarde config alertes:', err);
      setError(err.message);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const openCreateModal = () => {
    // Utiliser les valeurs par défaut de la configuration globale
    const defaultRayon = globalConfig.rayon_diffusion_defaut_disparition_standard;
    const defaultCanaux = JSON.stringify(globalConfig.canaux_diffusion_defaut);
    
    setFormData({
      titre: '',
      message: '',
      message_court: '',
      type_alerte: 'disparition_standard',
      latitude_centre: '',
      longitude_centre: '',
      rayon_km: defaultRayon,
      zones_specifiques: '',
      date_diffusion: new Date().toISOString().split('T')[0],
      date_expiration: globalConfig.delai_expiration_defaut_heures 
        ? new Date(Date.now() + globalConfig.delai_expiration_defaut_heures * 60 * 60 * 1000).toISOString().split('T')[0]
        : '',
      canaux_diffusion: defaultCanaux,
      statut_alerte: 'brouillon',
      niveau_urgence_min: 1,
      types_utilisateurs: '',
      id_dossier: '',
      validee: !globalConfig.validation_obligatoire, // Si validation obligatoire, commencer à false
      commentaire_validation: '',
    });
    setModalMode('create');
    setSelectedAlerte(null);
    setShowModal(true);
  };

  const openEditModal = (alerte: Alerte) => {
    setFormData({
      titre: alerte.titre,
      message: alerte.message,
      message_court: alerte.message_court || '',
      type_alerte: alerte.type_alerte as TypeAlerte,
      latitude_centre: alerte.latitude_centre?.toString() || '',
      longitude_centre: alerte.longitude_centre?.toString() || '',
      rayon_km: alerte.rayon_km || 50,
      zones_specifiques: alerte.zones_specifiques ? JSON.stringify(alerte.zones_specifiques, null, 2) : '',
      date_diffusion: alerte.date_diffusion ? new Date(alerte.date_diffusion).toISOString().split('T')[0] : '',
      date_expiration: alerte.date_expiration ? new Date(alerte.date_expiration).toISOString().split('T')[0] : '',
      canaux_diffusion: alerte.canaux_diffusion ? JSON.stringify(alerte.canaux_diffusion, null, 2) : '',
      statut_alerte: alerte.statut_alerte as StatutAlerte,
      niveau_urgence_min: alerte.niveau_urgence_min || 1,
      types_utilisateurs: alerte.types_utilisateurs ? JSON.stringify(alerte.types_utilisateurs, null, 2) : '',
      id_dossier: alerte.id_dossier || '',
      validee: alerte.validee || false,
      commentaire_validation: alerte.commentaire_validation || '',
    });
    setModalMode('edit');
    setSelectedAlerte(alerte);
    setShowModal(true);
  };

  const openViewModal = (alerte: Alerte) => {
    setSelectedAlerte(alerte);
    setModalMode('view');
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();

      // Préparer les données avec TOUS les champs
      const alerteData: any = {
        titre: formData.titre,
        message: formData.message,
        message_court: formData.message_court || null,
        type_alerte: formData.type_alerte,
        rayon_km: formData.rayon_km,
        date_diffusion: formData.date_diffusion,
        date_expiration: formData.date_expiration || null,
        statut_alerte: formData.statut_alerte,
        niveau_urgence_min: formData.niveau_urgence_min || 1,
        id_dossier: formData.id_dossier || null,
        validee: formData.validee,
        commentaire_validation: formData.commentaire_validation || null,
      };

      // Ajouter coordonnées si fournies
      if (formData.latitude_centre && formData.longitude_centre) {
        alerteData.latitude_centre = parseFloat(formData.latitude_centre);
        alerteData.longitude_centre = parseFloat(formData.longitude_centre);
      }

      // Parser les champs JSONB
      if (formData.zones_specifiques) {
        try {
          alerteData.zones_specifiques = JSON.parse(formData.zones_specifiques);
        } catch (e) {
          // Si JSON invalide, ignorer
        }
      }
      if (formData.canaux_diffusion) {
        try {
          alerteData.canaux_diffusion = JSON.parse(formData.canaux_diffusion);
        } catch (e) {
          // Si JSON invalide, ignorer
        }
      }
      if (formData.types_utilisateurs) {
        try {
          alerteData.types_utilisateurs = JSON.parse(formData.types_utilisateurs);
        } catch (e) {
          // Si JSON invalide, ignorer
        }
      }

      if (modalMode === 'create') {
        alerteData.id_utilisateur_createur = user?.id || null;
      }

      if (modalMode === 'create') {
        const { error: insertError } = await (supabase as any)
          .from('alerte')
          .insert(alerteData);
        if (insertError) throw insertError;
      } else if (modalMode === 'edit' && selectedAlerte) {
        alerteData.updated_at = new Date().toISOString();
        const { error: updateError } = await (supabase as any)
          .from('alerte')
          .update(alerteData)
          .eq('id', selectedAlerte.id);
        if (updateError) throw updateError;
      }

      setSuccess(modalMode === 'create' ? 'Alerte créée avec succès' : 'Alerte modifiée avec succès');
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

  const handleDelete = async (id: string) => {
    try {
      const { error: deleteError } = await (supabase as any)
        .from('alerte')
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

  const handleCancel = async (id: string) => {
    try {
      const { error: updateError } = await (supabase as any)
        .from('alerte')
        .update({
          statut_alerte: 'annulee',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;
      loadData();
    } catch (err: any) {
      console.error('Erreur annulation:', err);
      setError(err.message);
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const exportToCSV = async () => {
    try {
      setIsLoading(true);
      
      // Charger TOUTES les alertes avec les filtres actuels (sans pagination)
      let query = (supabase as any)
        .from('alerte')
        .select(`
          *,
          dossier:dossier_disparition(numero_dossier),
          createur:utilisateur!alerte_id_utilisateur_createur_fkey(nom, email),
          validateur:utilisateur!alerte_id_utilisateur_validateur_fkey(nom, email)
        `)
        .order('created_at', { ascending: false });

      if (filterStatut) query = query.eq('statut_alerte', filterStatut);
      if (filterType) query = query.eq('type_alerte', filterType);
      if (searchTerm) {
        query = query.or(`titre.ilike.%${searchTerm}%,message.ilike.%${searchTerm}%`);
      }

      const { data: allAlertes, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      // Enrichir avec personne du dossier
      const enrichedAlertes = await Promise.all(
        (allAlertes || []).map(async (alerte: any) => {
          let dossier = alerte.dossier;
          if (dossier?.id_personne) {
            const { data: personne } = await (supabase as any)
              .from('personne')
              .select('nom, prenom')
              .eq('id', dossier.id_personne)
              .single();
            dossier = { ...dossier, personne };
          }
          return { ...alerte, dossier: dossier || null };
        })
      );

      // Créer le CSV avec TOUS les champs
      const headers = [
        'ID', 'Numéro alerte', 'Titre', 'Message', 'Message court', 'Type alerte', 
        'Latitude centre', 'Longitude centre', 'Rayon (km)', 'Zones spécifiques',
        'Date diffusion', 'Date expiration', 'Canaux diffusion', 'Statut alerte',
        'Niveau urgence min', 'Types utilisateurs', 'Nombre destinataires',
        'Nombre envois réussis', 'Nombre vues', 'Nombre partages',
        'Nombre signalements générés', 'Validée', 'Validateur', 'Date validation',
        'Commentaire validation', 'Dossier', 'Personne dossier', 'Créateur',
        'Date création', 'Date modification'
      ];
      
      const rows = enrichedAlertes.map((a: any) => [
        a.id,
        a.numero_alerte || '',
        a.titre,
        a.message,
        a.message_court || '',
        a.type_alerte,
        a.latitude_centre || '',
        a.longitude_centre || '',
        a.rayon_km || '',
        a.zones_specifiques ? JSON.stringify(a.zones_specifiques) : '',
        a.date_diffusion ? new Date(a.date_diffusion).toLocaleString('fr-FR') : '',
        a.date_expiration ? new Date(a.date_expiration).toLocaleString('fr-FR') : '',
        a.canaux_diffusion ? JSON.stringify(a.canaux_diffusion) : '',
        a.statut_alerte,
        a.niveau_urgence_min || '',
        a.types_utilisateurs ? JSON.stringify(a.types_utilisateurs) : '',
        a.nombre_destinataires || 0,
        a.nombre_envois_reussis || 0,
        a.nombre_vues || 0,
        a.nombre_partages || 0,
        a.nombre_signalements_generes || 0,
        a.validee ? 'Oui' : 'Non',
        a.validateur ? `${a.validateur.nom} (${a.validateur.email})` : '',
        a.date_validation ? new Date(a.date_validation).toLocaleString('fr-FR') : '',
        a.commentaire_validation || '',
        a.dossier?.numero_dossier || '',
        a.dossier?.personne ? `${a.dossier.personne.prenom || ''} ${a.dossier.personne.nom}`.trim() : '',
        a.createur ? `${a.createur.nom} (${a.createur.email})` : '',
        a.created_at ? new Date(a.created_at).toLocaleString('fr-FR') : '',
        a.updated_at ? new Date(a.updated_at).toLocaleString('fr-FR') : '',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row: any[]) => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `alertes_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (err: any) {
      console.error('Erreur export CSV:', err);
      setError('Erreur lors de l\'export: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatutColor = (statut: string) => {
    const colors: Record<string, string> = {
      brouillon: 'default',
      programmee: 'info',
      en_cours: 'warning',
      terminee: 'success',
      annulee: 'danger',
    };
    return colors[statut] || 'default';
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      amber_alert: 'Alerte Amber',
      disparition_enfant: 'Disparition enfant',
      disparition_adulte_vulnerable: 'Disparition adulte vulnérable',
      disparition_standard: 'Disparition standard',
      mise_a_jour: 'Mise à jour',
      personne_retrouvee: 'Personne retrouvée',
    };
    return labels[type] || type;
  };

  const roundStep = (v: number, s: number) => (s >= 1 ? Math.round(v) : Math.round(v * 100) / 100);
  const Stepper = (
    { value, onChange, min, max, step = 1 }: 
    { value: number; onChange: (v: number) => void; min: number; max: number; step?: number }
  ) => (
    <div className={styles['sa-alertes__stepper']}>
      <button type="button" className={styles['sa-alertes__stepper-btn']} onClick={() => onChange(roundStep(Math.max(min, value - step), step))} disabled={value <= min} aria-label="Diminuer">
        <Minus size={14} />
      </button>
      <input type="number" value={value} onChange={(e) => onChange(roundStep(Math.min(max, Math.max(min, parseFloat(e.target.value) || min)), step))} min={min} max={max} step={step} className={styles['sa-alertes__stepper-input']} />
      <button type="button" className={styles['sa-alertes__stepper-btn']} onClick={() => onChange(roundStep(Math.min(max, value + step), step))} disabled={value >= max} aria-label="Augmenter">
        <Plus size={14} />
      </button>
    </div>
  );

  return (
    <SuperAdminLayout title="Gestion des Alertes" activeNav="alertes">
      <div className={styles['sa-alertes']}>
        {/* Header avec bouton créer */}
        <div className={styles['sa-alertes__header']}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>Gestion des Alertes</h2>
            <p style={{ margin: '0.5rem 0 0 0', color: '#64748b' }}>Créez, modifiez et gérez toutes les alertes système</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => setShowGlobalConfig(true)} className={styles['sa-alertes__btn-config']} style={{ 
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
              <Settings size={18} />
              Configuration globale
            </button>
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
            <button onClick={openCreateModal} className={styles['sa-alertes__btn-create']}>
              <Plus size={20} />
              Créer une alerte
            </button>
          </div>
        </div>

        {/* Filtres */}
        <div className={styles['sa-alertes__filters']}>
          <div className={styles['sa-alertes__search']}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Rechercher par titre ou message..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <select value={filterStatut} onChange={(e) => { setFilterStatut(e.target.value); setCurrentPage(1); }}>
            <option value="">Tous les statuts</option>
            <option value="brouillon">Brouillon</option>
            <option value="programmee">Programmée</option>
            <option value="en_cours">En cours</option>
            <option value="terminee">Terminée</option>
            <option value="annulee">Annulée</option>
          </select>
          <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}>
            <option value="">Tous les types</option>
            <option value="amber_alert">Alerte Amber</option>
            <option value="disparition_enfant">Disparition enfant</option>
            <option value="disparition_adulte_vulnerable">Disparition adulte vulnérable</option>
            <option value="disparition_standard">Disparition standard</option>
            <option value="mise_a_jour">Mise à jour</option>
            <option value="personne_retrouvee">Personne retrouvée</option>
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className={styles['sa-alertes__error']}>
            <AlertCircle size={20} />
            <span>{error}</span>
            <button onClick={() => setError(null)}><X size={16} /></button>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className={styles['sa-alertes__success']} style={{ backgroundColor: '#10b981', color: 'white', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Check size={20} />
            <span>{success}</span>
            <button onClick={() => setSuccess(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={16} /></button>
          </div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className={styles['sa-alertes__loading']}>
            <Loader2 size={32} className={styles['sa-alertes__spinner']} />
          </div>
        ) : (
          <div className={styles['sa-alertes__table-wrapper']}>
            {alertes.length === 0 ? (
              <div className={styles['sa-alertes__empty']}>
                <Bell size={48} />
                <p>Aucune alerte trouvée</p>
              </div>
            ) : (
              <table className={styles['sa-alertes__table']}>
                <thead>
                  <tr>
                    <th>Numéro</th>
                    <th>Titre</th>
                    <th>Type</th>
                    <th><Calendar size={16} /> Date diffusion</th>
                    <th>Rayon</th>
                    <th>Statut</th>
                    <th>Dossier</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {alertes.map((alerte) => (
                    <tr key={alerte.id}>
                      <td><strong>{alerte.numero_alerte || '-'}</strong></td>
                      <td>{alerte.titre}</td>
                      <td>{getTypeLabel(alerte.type_alerte)}</td>
                      <td>{new Date(alerte.date_diffusion).toLocaleDateString('fr-FR')}</td>
                      <td>{alerte.rayon_km} km</td>
                      <td>
                        <span className={`${styles['sa-alertes__badge']} ${styles[`sa-alertes__badge--${getStatutColor(alerte.statut_alerte)}`]}`}>
                          {alerte.statut_alerte}
                        </span>
                      </td>
                      <td>{alerte.dossier?.numero_dossier || '-'}</td>
                      <td className={styles['sa-alertes__actions']}>
                        <button type="button" onClick={() => openViewModal(alerte)} title="Voir" className={styles['sa-alertes__btn-view']}>
                          <Eye size={16} /><span>Voir</span>
                        </button>
                        <button type="button" onClick={() => openEditModal(alerte)} title="Modifier" className={styles['sa-alertes__btn-edit']}>
                          <Edit2 size={16} /><span>Modifier</span>
                        </button>
                        {alerte.statut_alerte === 'en_cours' && (
                          <button type="button" onClick={() => handleCancel(alerte.id)} title="Annuler" className={styles['sa-alertes__btn-cancel']}>
                            <X size={16} /><span>Annuler</span>
                          </button>
                        )}
                        <button type="button" onClick={() => setDeleteConfirm(alerte.id)} title="Supprimer" className={styles['sa-alertes__btn-delete']}>
                          <Trash2 size={16} /><span>Supprimer</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={styles['sa-alertes__pagination']}>
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
              <ChevronLeft size={16} /> Précédent
            </button>
            <span>Page {currentPage} sur {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
              Suivant <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Modal Create/Edit */}
        {showModal && modalMode !== 'view' && (
          <div className={styles['sa-alertes__modal-overlay']} onClick={() => setShowModal(false)}>
            <div className={styles['sa-alertes__modal']} onClick={(e) => e.stopPropagation()}>
              <div className={styles['sa-alertes__modal-header']}>
                <h2>{modalMode === 'create' ? 'Créer une alerte' : 'Modifier l\'alerte'}</h2>
                <button type="button" onClick={() => setShowModal(false)} aria-label="Fermer"><X size={20} /></button>
              </div>
              
              <div className={styles['sa-alertes__modal-body']}>
                <div className={styles['sa-alertes__form-grid']}>
                  <div className={styles['sa-alertes__form-full']}>
                    <label>Titre *</label>
                    <input
                      type="text"
                      value={formData.titre}
                      onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                      required
                    />
                  </div>
                  <div className={styles['sa-alertes__form-full']}>
                    <label>Message *</label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={4}
                      required
                    />
                  </div>
                  <div className={styles['sa-alertes__form-full']}>
                    <label>Message court</label>
                    <input
                      type="text"
                      value={formData.message_court}
                      onChange={(e) => setFormData({ ...formData, message_court: e.target.value })}
                      maxLength={500}
                    />
                  </div>
                  <div>
                    <label>Type d'alerte *</label>
                    <select
                      value={formData.type_alerte}
                      onChange={(e) => {
                        const newType = e.target.value as TypeAlerte;
                        // Mettre à jour le rayon selon le type sélectionné
                        let defaultRayon = 50;
                        switch(newType) {
                          case 'amber_alert':
                            defaultRayon = globalConfig.rayon_diffusion_defaut_amber_alert;
                            break;
                          case 'disparition_enfant':
                            defaultRayon = globalConfig.rayon_diffusion_defaut_disparition_enfant;
                            break;
                          case 'disparition_adulte_vulnerable':
                            defaultRayon = globalConfig.rayon_diffusion_defaut_disparition_adulte_vulnerable;
                            break;
                          case 'disparition_standard':
                            defaultRayon = globalConfig.rayon_diffusion_defaut_disparition_standard;
                            break;
                          case 'mise_a_jour':
                            defaultRayon = globalConfig.rayon_diffusion_defaut_mise_a_jour;
                            break;
                          case 'personne_retrouvee':
                            defaultRayon = globalConfig.rayon_diffusion_defaut_personne_retrouvee;
                            break;
                        }
                        setFormData({ ...formData, type_alerte: newType, rayon_km: defaultRayon });
                      }}
                      required
                    >
                      <option value="amber_alert">Alerte Amber</option>
                      <option value="disparition_enfant">Disparition enfant</option>
                      <option value="disparition_adulte_vulnerable">Disparition adulte vulnérable</option>
                      <option value="disparition_standard">Disparition standard</option>
                      <option value="mise_a_jour">Mise à jour</option>
                      <option value="personne_retrouvee">Personne retrouvée</option>
                    </select>
                  </div>
                  <div>
                    <label>Statut *</label>
                    <select
                      value={formData.statut_alerte}
                      onChange={(e) => setFormData({ ...formData, statut_alerte: e.target.value as StatutAlerte })}
                      required
                    >
                      <option value="brouillon">Brouillon</option>
                      <option value="programmee">Programmée</option>
                      <option value="en_cours">En cours</option>
                      <option value="terminee">Terminée</option>
                      <option value="annulee">Annulée</option>
                    </select>
                  </div>
                  <div>
                    <label>Dossier</label>
                    <select
                      value={formData.id_dossier}
                      onChange={(e) => setFormData({ ...formData, id_dossier: e.target.value })}
                    >
                      <option value="">Aucun</option>
                      {dossiers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.numero_dossier} - {d.personne ? `${d.personne.prenom || ''} ${d.personne.nom}`.trim() : '-'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>Date de diffusion *</label>
                    <input
                      type="datetime-local"
                      value={formData.date_diffusion}
                      onChange={(e) => setFormData({ ...formData, date_diffusion: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label>Date d'expiration</label>
                    <input
                      type="datetime-local"
                      value={formData.date_expiration}
                      onChange={(e) => setFormData({ ...formData, date_expiration: e.target.value })}
                    />
                  </div>
                  <div>
                    <label>Latitude centre</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.latitude_centre}
                      onChange={(e) => setFormData({ ...formData, latitude_centre: e.target.value })}
                    />
                  </div>
                  <div>
                    <label>Longitude centre</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.longitude_centre}
                      onChange={(e) => setFormData({ ...formData, longitude_centre: e.target.value })}
                    />
                  </div>
                  <div>
                    <label>Rayon (km) *</label>
                    <Stepper value={formData.rayon_km} onChange={(v) => setFormData({ ...formData, rayon_km: v })} min={1} max={500} />
                  </div>
                </div>
              </div>

              <div className={styles['sa-alertes__modal-footer']}>
                <button type="button" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="button" onClick={handleSave} disabled={isSaving} className={styles['sa-alertes__btn-save']}>
                  {isSaving ? <Loader2 size={18} className={styles['sa-alertes__spinner']} /> : <Save size={18} />}
                  {modalMode === 'create' ? 'Créer' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal View */}
        {showModal && modalMode === 'view' && selectedAlerte && (
          <div className={styles['sa-alertes__modal-overlay']} onClick={() => { setShowModal(false); setSelectedAlerte(null); }}>
            <div className={styles['sa-alertes__modal']} onClick={(e) => e.stopPropagation()}>
              <div className={styles['sa-alertes__modal-header']}>
                <h2>Détails de l&apos;alerte</h2>
                <button type="button" onClick={() => { setShowModal(false); setSelectedAlerte(null); }} aria-label="Fermer"><X size={20} /></button>
              </div>
              
              <div className={styles['sa-alertes__modal-body']}>
                <div className={styles['sa-alertes__detail-grid']}>
                  <div><label>Numéro:</label><span>{selectedAlerte.numero_alerte || '-'}</span></div>
                  <div><label>Titre:</label><span>{selectedAlerte.titre}</span></div>
                  <div><label>Type:</label><span>{getTypeLabel(selectedAlerte.type_alerte)}</span></div>
                  <div><label>Statut:</label><span className={`${styles['sa-alertes__badge']} ${styles[`sa-alertes__badge--${getStatutColor(selectedAlerte.statut_alerte)}`]}`}>{selectedAlerte.statut_alerte}</span></div>
                  <div><label>Date diffusion:</label><span>{new Date(selectedAlerte.date_diffusion).toLocaleString('fr-FR')}</span></div>
                  <div><label>Date expiration:</label><span>{selectedAlerte.date_expiration ? new Date(selectedAlerte.date_expiration).toLocaleString('fr-FR') : '-'}</span></div>
                  <div><label>Rayon:</label><span>{selectedAlerte.rayon_km} km</span></div>
                  <div><label>Coordonnées:</label><span>{selectedAlerte.latitude_centre != null && selectedAlerte.longitude_centre != null ? `${selectedAlerte.latitude_centre}, ${selectedAlerte.longitude_centre}` : '-'}</span></div>
                  <div><label>Dossier:</label><span>{selectedAlerte.dossier?.numero_dossier || '-'}</span></div>
                  <div><label>Niveau urgence min:</label><span>{selectedAlerte.niveau_urgence_min ?? '-'}</span></div>
                  <div><label>Nombre destinataires:</label><span>{selectedAlerte.nombre_destinataires ?? 0}</span></div>
                  <div><label>Nombre envois réussis:</label><span>{selectedAlerte.nombre_envois_reussis ?? 0}</span></div>
                  <div><label>Nombre vues:</label><span>{selectedAlerte.nombre_vues ?? 0}</span></div>
                  <div><label>Nombre partages:</label><span>{selectedAlerte.nombre_partages ?? 0}</span></div>
                  <div><label>Nombre signalements générés:</label><span>{selectedAlerte.nombre_signalements_generes ?? 0}</span></div>
                  <div><label>Validée:</label><span>{selectedAlerte.validee ? 'Oui' : 'Non'}</span></div>
                  {selectedAlerte.createur && (
                    <div><label>Créée par:</label><span>{selectedAlerte.createur.nom} ({selectedAlerte.createur.email})</span></div>
                  )}
                  <div><label>Date création:</label><span>{new Date(selectedAlerte.created_at).toLocaleString('fr-FR')}</span></div>
                  {selectedAlerte.validateur && (
                    <div><label>Validateur:</label><span>{selectedAlerte.validateur.nom} ({selectedAlerte.validateur.email})</span></div>
                  )}
                  {selectedAlerte.date_validation && (
                    <div><label>Date validation:</label><span>{new Date(selectedAlerte.date_validation).toLocaleString('fr-FR')}</span></div>
                  )}
                  {selectedAlerte.commentaire_validation && (
                    <div className={styles['sa-alertes__form-full']}><label>Commentaire validation:</label><p>{selectedAlerte.commentaire_validation}</p></div>
                  )}
                  {selectedAlerte.zones_specifiques && (
                    <div className={styles['sa-alertes__form-full']}><label>Zones spécifiques:</label><pre style={{ fontSize: '0.875rem', background: '#f1f5f9', padding: '0.5rem', borderRadius: '0.25rem' }}>{JSON.stringify(selectedAlerte.zones_specifiques, null, 2)}</pre></div>
                  )}
                  {selectedAlerte.canaux_diffusion && (
                    <div className={styles['sa-alertes__form-full']}><label>Canaux diffusion:</label><pre style={{ fontSize: '0.875rem', background: '#f1f5f9', padding: '0.5rem', borderRadius: '0.25rem' }}>{JSON.stringify(selectedAlerte.canaux_diffusion, null, 2)}</pre></div>
                  )}
                  {selectedAlerte.types_utilisateurs && (
                    <div className={styles['sa-alertes__form-full']}><label>Types utilisateurs:</label><pre style={{ fontSize: '0.875rem', background: '#f1f5f9', padding: '0.5rem', borderRadius: '0.25rem' }}>{JSON.stringify(selectedAlerte.types_utilisateurs, null, 2)}</pre></div>
                  )}
                  <div className={styles['sa-alertes__form-full']}><label>Message:</label><p>{selectedAlerte.message}</p></div>
                  {selectedAlerte.message_court && (
                    <div className={styles['sa-alertes__form-full']}><label>Message court:</label><p>{selectedAlerte.message_court}</p></div>
                  )}
                </div>
              </div>

              <div className={styles['sa-alertes__modal-footer']}>
                <button type="button" onClick={() => { setShowModal(false); openEditModal(selectedAlerte); }} className={styles['sa-alertes__btn-save']}>
                  <Edit2 size={16} /> Modifier
                </button>
                {(selectedAlerte.statut_alerte === 'brouillon' || selectedAlerte.statut_alerte === 'en_cours') && (
                  <button type="button" onClick={() => { setShowModal(false); setSelectedAlerte(null); setDeleteConfirm(selectedAlerte.id); }} className={styles['sa-alertes__btn-delete']}>
                    <Trash2 size={16} /> Supprimer
                  </button>
                )}
                <button type="button" onClick={() => { setShowModal(false); setSelectedAlerte(null); }}>Fermer</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {deleteConfirm && (
          <div className={styles['sa-alertes__modal-overlay']} onClick={() => setDeleteConfirm(null)}>
            <div className={styles['sa-alertes__modal']} onClick={(e) => e.stopPropagation()}>
              <div className={styles['sa-alertes__modal-header']}>
                <h2>Confirmer la suppression</h2>
                <button type="button" onClick={() => setDeleteConfirm(null)} aria-label="Fermer"><X size={20} /></button>
              </div>
              <div className={styles['sa-alertes__modal-body']}>
                <p>Êtes-vous sûr de vouloir supprimer cette alerte ? Cette action est irréversible.</p>
              </div>
              <div className={styles['sa-alertes__modal-footer']}>
                <button type="button" onClick={() => setDeleteConfirm(null)}>Annuler</button>
                <button type="button" onClick={() => handleDelete(deleteConfirm)} className={styles['sa-alertes__btn-delete']}>
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Configuration Globale */}
        {showGlobalConfig && (
          <div className={styles['sa-alertes__modal-overlay']} onClick={() => setShowGlobalConfig(false)}>
            <div className={styles['sa-alertes__modal']} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
              <div className={styles['sa-alertes__modal-header']}>
                <h2>Configuration globale des alertes</h2>
                <button onClick={() => setShowGlobalConfig(false)}><X size={20} /></button>
              </div>
              
              <div className={styles['sa-alertes__modal-body']}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: 600 }}>Rayons de diffusion par défaut (km)</h3>
                <div className={styles['sa-alertes__form-grid']} style={{ marginBottom: '1.5rem' }}>
                  <div>
                    <label>Alerte Amber</label>
                    <Stepper value={globalConfig.rayon_diffusion_defaut_amber_alert} onChange={(v) => setGlobalConfig({ ...globalConfig, rayon_diffusion_defaut_amber_alert: v })} min={1} max={500} />
                  </div>
                  <div>
                    <label>Disparition enfant</label>
                    <Stepper value={globalConfig.rayon_diffusion_defaut_disparition_enfant} onChange={(v) => setGlobalConfig({ ...globalConfig, rayon_diffusion_defaut_disparition_enfant: v })} min={1} max={500} />
                  </div>
                  <div>
                    <label>Disparition adulte vulnérable</label>
                    <Stepper value={globalConfig.rayon_diffusion_defaut_disparition_adulte_vulnerable} onChange={(v) => setGlobalConfig({ ...globalConfig, rayon_diffusion_defaut_disparition_adulte_vulnerable: v })} min={1} max={500} />
                  </div>
                  <div>
                    <label>Disparition standard</label>
                    <Stepper value={globalConfig.rayon_diffusion_defaut_disparition_standard} onChange={(v) => setGlobalConfig({ ...globalConfig, rayon_diffusion_defaut_disparition_standard: v })} min={1} max={500} />
                  </div>
                  <div>
                    <label>Mise à jour</label>
                    <Stepper value={globalConfig.rayon_diffusion_defaut_mise_a_jour} onChange={(v) => setGlobalConfig({ ...globalConfig, rayon_diffusion_defaut_mise_a_jour: v })} min={1} max={500} />
                  </div>
                  <div>
                    <label>Personne retrouvée</label>
                    <Stepper value={globalConfig.rayon_diffusion_defaut_personne_retrouvee} onChange={(v) => setGlobalConfig({ ...globalConfig, rayon_diffusion_defaut_personne_retrouvee: v })} min={1} max={500} />
                  </div>
                </div>

                <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: 600 }}>Paramètres généraux</h3>
                <div className={styles['sa-alertes__form-grid']} style={{ marginBottom: '1.5rem' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={globalConfig.validation_obligatoire}
                        onChange={(e) => setGlobalConfig({ ...globalConfig, validation_obligatoire: e.target.checked })}
                      />
                      Validation obligatoire avant diffusion
                    </label>
                  </div>
                  <div>
                    <label>Délai d&apos;expiration par défaut (heures)</label>
                    <Stepper value={globalConfig.delai_expiration_defaut_heures} onChange={(v) => setGlobalConfig({ ...globalConfig, delai_expiration_defaut_heures: v })} min={1} max={720} />
                  </div>
                </div>

                <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: 600 }}>Canaux de diffusion par défaut</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={globalConfig.canaux_diffusion_defaut.push}
                      onChange={(e) => setGlobalConfig({ 
                        ...globalConfig, 
                        canaux_diffusion_defaut: { ...globalConfig.canaux_diffusion_defaut, push: e.target.checked }
                      })}
                    />
                    Notifications push
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={globalConfig.canaux_diffusion_defaut.email}
                      onChange={(e) => setGlobalConfig({ 
                        ...globalConfig, 
                        canaux_diffusion_defaut: { ...globalConfig.canaux_diffusion_defaut, email: e.target.checked }
                      })}
                    />
                    Email
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={globalConfig.canaux_diffusion_defaut.sms}
                      onChange={(e) => setGlobalConfig({ 
                        ...globalConfig, 
                        canaux_diffusion_defaut: { ...globalConfig.canaux_diffusion_defaut, sms: e.target.checked }
                      })}
                    />
                    SMS
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={globalConfig.canaux_diffusion_defaut.in_app}
                      onChange={(e) => setGlobalConfig({ 
                        ...globalConfig, 
                        canaux_diffusion_defaut: { ...globalConfig.canaux_diffusion_defaut, in_app: e.target.checked }
                      })}
                    />
                    Notification in-app
                  </label>
                </div>
              </div>

              <div className={styles['sa-alertes__modal-footer']}>
                <button type="button" onClick={() => { setShowGlobalConfig(false); setGlobalConfig(originalGlobalConfig); }}>Annuler</button>
                <button 
                  type="button"
                  onClick={handleSaveGlobalConfig} 
                  disabled={isSavingConfig || JSON.stringify(globalConfig) === JSON.stringify(originalGlobalConfig)}
                  className={styles['sa-alertes__btn-save']}
                >
                  {isSavingConfig ? <Loader2 size={18} className={styles['sa-alertes__spinner']} /> : <Save size={18} />}
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

export default SuperAdminAlertesPage;
