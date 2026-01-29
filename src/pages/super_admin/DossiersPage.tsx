/**
 * =====================================================
 * RETROUVONSLES - Super Admin Dossiers Page
 * Gestion complète des dossiers de disparition (CRUD)
 * Connecté à Supabase table: dossier_disparition, personne
 * =====================================================
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useI18n } from '../../hooks';
import { supabase } from '../../config';
import { SuperAdminLayout } from './SuperAdminLayout';
import { 
  FolderOpen, Plus, Edit2, Trash2, X, Check, 
  Loader2, AlertCircle, Search, Eye, MapPin, Calendar,
  ChevronLeft, ChevronRight, Archive, Download
} from 'lucide-react';
import styles from './DossiersPage.module.css';

interface Personne {
  id: string;
  nom: string;
  prenom?: string;
  sexe?: string;
  date_naissance?: string;
  age_estime_min?: number;
  age_estime_max?: number;
}

interface Organisation {
  id: string;
  nom: string;
}

interface Dossier {
  id: string;
  numero_dossier: string;
  date_disparition: string;
  date_derniere_observation?: string;
  lieu_disparition?: string;
  ville_disparition?: string;
  region_disparition?: string;
  pays_disparition?: string;
  latitude_disparition?: number;
  longitude_disparition?: number;
  precision_lieu?: string;
  circonstances?: string;
  type_disparition: string;
  contexte_specifique?: string;
  personnes_accompagnantes?: string;
  derniere_activite_connue?: string;
  destination_prevue?: string;
  moyen_transport?: string;
  statut_dossier: string;
  sous_statut?: string;
  niveau_urgence: string;
  score_priorite?: number;
  zone_recherche_predite?: Record<string, any>;
  probabilite_localisation?: Record<string, any>;
  facteurs_risque?: Record<string, any>;
  dossiers_similaires?: Record<string, any>;
  autorite_saisie?: string;
  numero_plainte?: string;
  enqueteur_responsable?: string;
  contact_enqueteur?: string;
  contact_famille_principale?: string;
  telephone_contact?: string;
  email_contact?: string;
  visible_public: boolean;
  diffusion_autorisee?: boolean;
  diffusion_medias?: boolean;
  diffusion_reseaux_sociaux?: boolean;
  rayon_diffusion_km?: number;
  zones_diffusion_prioritaire?: string;
  date_resolution?: string;
  lieu_decouverte?: string;
  latitude_decouverte?: number;
  longitude_decouverte?: number;
  circonstances_resolution?: string;
  etat_personne_retrouvee?: string;
  nombre_signalements?: number;
  nombre_alertes_diffusees?: number;
  nombre_vues_fiche?: number;
  id_personne?: string;
  id_utilisateur_createur?: string;
  id_organisation_responsable?: string;
  created_at: string;
  updated_at?: string;
  derniere_activite?: string;
  personne?: Personne;
  organisation?: Organisation;
  createur?: { nom: string; email: string };
}

type StatutDossier = 'en_cours' | 'retrouve_vivant' | 'retrouve_decede' | 'suspendu' | 'classe_sans_suite' | 'transfere';
type NiveauUrgence = 'critique' | 'urgent' | 'normal' | 'faible';
type TypeDisparition = 'fugue' | 'enlevement_presume' | 'accident' | 'conflit_arme' | 'migration' | 'catastrophe_naturelle' | 'disparition_volontaire' | 'inconnue' | 'autre';

const ITEMS_PER_PAGE = 15;

const SuperAdminDossiersPage: React.FC = () => {
  useI18n(); // For future i18n support
  
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [personnes, setPersonnes] = useState<Personne[]>([]);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedDossier, setSelectedDossier] = useState<Dossier | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState<string>('');
  const [filterUrgence, setFilterUrgence] = useState<string>('');
  
  // Form state - TOUS les champs du modèle SQL
  const [formData, setFormData] = useState({
    numero_dossier: '',
    date_disparition: '',
    date_derniere_observation: '',
    lieu_disparition: '',
    ville_disparition: '',
    region_disparition: '',
    pays_disparition: 'Cameroun',
    latitude_disparition: '',
    longitude_disparition: '',
    precision_lieu: 'approximative',
    circonstances: '',
    type_disparition: 'inconnue' as TypeDisparition,
    contexte_specifique: '',
    personnes_accompagnantes: '',
    derniere_activite_connue: '',
    destination_prevue: '',
    moyen_transport: '',
    statut_dossier: 'en_cours' as StatutDossier,
    sous_statut: '',
    niveau_urgence: 'normal' as NiveauUrgence,
    score_priorite: '',
    autorite_saisie: '',
    numero_plainte: '',
    enqueteur_responsable: '',
    contact_enqueteur: '',
    contact_famille_principale: '',
    telephone_contact: '',
    email_contact: '',
    id_personne: '',
    id_organisation_responsable: '',
    visible_public: true,
    diffusion_autorisee: true,
    diffusion_medias: false,
    diffusion_reseaux_sociaux: true,
    rayon_diffusion_km: 100,
    zones_diffusion_prioritaire: '',
    date_resolution: '',
    lieu_decouverte: '',
    latitude_decouverte: '',
    longitude_decouverte: '',
    circonstances_resolution: '',
    etat_personne_retrouvee: '',
  });

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const openedForEditIdRef = useRef<string | null>(null);

  // Charger les données
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Charger personnes et organisations
      const [personnesResult, orgsResult] = await Promise.all([
        (supabase as any).from('personne').select('id, nom, prenom, sexe, date_naissance, age_estime_min, age_estime_max').limit(1000),
        (supabase as any).from('organisation').select('id, nom').eq('statut_actif', true),
      ]);

      if (personnesResult.data) setPersonnes(personnesResult.data);
      if (orgsResult.data) setOrganisations(orgsResult.data);

      // Compter avec filtres
      let countQuery = (supabase as any).from('dossier_disparition').select('id', { count: 'exact', head: true });
      if (filterStatut) countQuery = countQuery.eq('statut_dossier', filterStatut);
      if (filterUrgence) countQuery = countQuery.eq('niveau_urgence', filterUrgence);
      if (searchTerm) {
        countQuery = countQuery.or(`numero_dossier.ilike.%${searchTerm}%,lieu_disparition.ilike.%${searchTerm}%`);
      }
      
      const { count } = await countQuery;
      setTotalCount(count || 0);

      // Charger les dossiers avec pagination - RÉCUPÉRER TOUS LES CHAMPS
      const offset = (currentPage - 1) * ITEMS_PER_PAGE;
      let query = (supabase as any)
        .from('dossier_disparition')
        .select(`
          *,
          personne:personne(*),
          organisation:organisation(*),
          createur:utilisateur!dossier_disparition_id_utilisateur_createur_fkey(nom, email)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1);

      if (filterStatut) query = query.eq('statut_dossier', filterStatut);
      if (filterUrgence) query = query.eq('niveau_urgence', filterUrgence);
      if (searchTerm) {
        query = query.or(`numero_dossier.ilike.%${searchTerm}%,lieu_disparition.ilike.%${searchTerm}%`);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      // Les données sont déjà enrichies par Supabase avec les relations
      // Mais on peut encore enrichir avec des compteurs si nécessaire
      const enrichedDossiers = await Promise.all(
        (data || []).map(async (dossier: any) => {
          // Compter signalements et alertes pour ce dossier
          const [signalementsResult, alertesResult] = await Promise.all([
            (supabase as any).from('signalement').select('id', { count: 'exact', head: true }).eq('id_dossier', dossier.id),
            (supabase as any).from('alerte').select('id', { count: 'exact', head: true }).eq('id_dossier', dossier.id),
          ]);
          
          return {
            ...dossier,
            nombre_signalements: signalementsResult.count || 0,
            nombre_alertes_diffusees: alertesResult.count || 0,
            personne: dossier.personne || null,
            organisation: dossier.organisation || null,
            createur: dossier.createur || null,
          };
        })
      );

      setDossiers(enrichedDossiers);
    } catch (err: any) {
      console.error('Erreur chargement dossiers:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filterStatut, filterUrgence, searchTerm]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const editId = searchParams.get('edit');

  useEffect(() => {
    if (!editId) {
      openedForEditIdRef.current = null;
      return;
    }
    if (openedForEditIdRef.current === editId) return;
    const d = dossiers.find((x) => x.id === editId);
    if (d) {
      openedForEditIdRef.current = editId;
      openEditModal(d);
      setSearchParams({});
      return;
    }
    (async () => {
      const { data: one } = await (supabase as any).from('dossier_disparition').select('*').eq('id', editId).single();
      if (one && openedForEditIdRef.current !== editId) {
        openedForEditIdRef.current = editId;
        openEditModal(one as Dossier);
        setSearchParams({});
      }
    })();
  }, [editId, dossiers, setSearchParams]);

  const openCreateModal = () => {
    setSearchParams({});
    setFormData({
      numero_dossier: '',
      date_disparition: new Date().toISOString().split('T')[0],
      date_derniere_observation: '',
      lieu_disparition: '',
      ville_disparition: '',
      region_disparition: '',
      pays_disparition: 'Cameroun',
      latitude_disparition: '',
      longitude_disparition: '',
      precision_lieu: 'approximative',
      circonstances: '',
      type_disparition: 'inconnue',
      contexte_specifique: '',
      personnes_accompagnantes: '',
      derniere_activite_connue: '',
      destination_prevue: '',
      moyen_transport: '',
      statut_dossier: 'en_cours',
      sous_statut: '',
      niveau_urgence: 'normal',
      score_priorite: '',
      autorite_saisie: '',
      numero_plainte: '',
      enqueteur_responsable: '',
      contact_enqueteur: '',
      contact_famille_principale: '',
      telephone_contact: '',
      email_contact: '',
      id_personne: '',
      id_organisation_responsable: '',
      visible_public: true,
      diffusion_autorisee: true,
      diffusion_medias: false,
      diffusion_reseaux_sociaux: true,
      rayon_diffusion_km: 100,
      zones_diffusion_prioritaire: '',
      date_resolution: '',
      lieu_decouverte: '',
      latitude_decouverte: '',
      longitude_decouverte: '',
      circonstances_resolution: '',
      etat_personne_retrouvee: '',
    });
    setModalMode('create');
    setSelectedDossier(null);
    setShowModal(true);
  };

  const openEditModal = (dossier: Dossier) => {
    setFormData({
      numero_dossier: dossier.numero_dossier,
      date_disparition: dossier.date_disparition ? new Date(dossier.date_disparition).toISOString().split('T')[0] : '',
      date_derniere_observation: dossier.date_derniere_observation ? new Date(dossier.date_derniere_observation).toISOString().split('T')[0] : '',
      lieu_disparition: dossier.lieu_disparition || '',
      ville_disparition: dossier.ville_disparition || '',
      region_disparition: dossier.region_disparition || '',
      pays_disparition: dossier.pays_disparition || 'Cameroun',
      latitude_disparition: dossier.latitude_disparition?.toString() || '',
      longitude_disparition: dossier.longitude_disparition?.toString() || '',
      precision_lieu: dossier.precision_lieu || 'approximative',
      circonstances: dossier.circonstances || '',
      type_disparition: dossier.type_disparition as TypeDisparition,
      contexte_specifique: dossier.contexte_specifique || '',
      personnes_accompagnantes: dossier.personnes_accompagnantes || '',
      derniere_activite_connue: dossier.derniere_activite_connue || '',
      destination_prevue: dossier.destination_prevue || '',
      moyen_transport: dossier.moyen_transport || '',
      statut_dossier: dossier.statut_dossier as StatutDossier,
      sous_statut: dossier.sous_statut || '',
      niveau_urgence: dossier.niveau_urgence as NiveauUrgence,
      score_priorite: dossier.score_priorite?.toString() || '',
      autorite_saisie: dossier.autorite_saisie || '',
      numero_plainte: dossier.numero_plainte || '',
      enqueteur_responsable: dossier.enqueteur_responsable || '',
      contact_enqueteur: dossier.contact_enqueteur || '',
      contact_famille_principale: dossier.contact_famille_principale || '',
      telephone_contact: dossier.telephone_contact || '',
      email_contact: dossier.email_contact || '',
      id_personne: dossier.id_personne || '',
      id_organisation_responsable: dossier.id_organisation_responsable || '',
      visible_public: dossier.visible_public,
      diffusion_autorisee: dossier.diffusion_autorisee ?? true,
      diffusion_medias: dossier.diffusion_medias ?? false,
      diffusion_reseaux_sociaux: dossier.diffusion_reseaux_sociaux ?? true,
      rayon_diffusion_km: dossier.rayon_diffusion_km || 100,
      zones_diffusion_prioritaire: dossier.zones_diffusion_prioritaire || '',
      date_resolution: dossier.date_resolution ? new Date(dossier.date_resolution).toISOString().split('T')[0] : '',
      lieu_decouverte: dossier.lieu_decouverte || '',
      latitude_decouverte: dossier.latitude_decouverte?.toString() || '',
      longitude_decouverte: dossier.longitude_decouverte?.toString() || '',
      circonstances_resolution: dossier.circonstances_resolution || '',
      etat_personne_retrouvee: dossier.etat_personne_retrouvee || '',
    });
    setModalMode('edit');
    setSelectedDossier(dossier);
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();

      // Préparer les données avec TOUS les champs
      const dossierData: any = {
        numero_dossier: formData.numero_dossier || null,
        date_disparition: formData.date_disparition,
        date_derniere_observation: formData.date_derniere_observation || null,
        lieu_disparition: formData.lieu_disparition || null,
        ville_disparition: formData.ville_disparition || null,
        region_disparition: formData.region_disparition || null,
        pays_disparition: formData.pays_disparition || 'Cameroun',
        latitude_disparition: formData.latitude_disparition ? parseFloat(formData.latitude_disparition) : null,
        longitude_disparition: formData.longitude_disparition ? parseFloat(formData.longitude_disparition) : null,
        precision_lieu: formData.precision_lieu || 'approximative',
        circonstances: formData.circonstances || null,
        type_disparition: formData.type_disparition,
        contexte_specifique: formData.contexte_specifique || null,
        personnes_accompagnantes: formData.personnes_accompagnantes || null,
        derniere_activite_connue: formData.derniere_activite_connue || null,
        destination_prevue: formData.destination_prevue || null,
        moyen_transport: formData.moyen_transport || null,
        statut_dossier: formData.statut_dossier,
        sous_statut: formData.sous_statut || null,
        niveau_urgence: formData.niveau_urgence,
        score_priorite: formData.score_priorite ? parseInt(formData.score_priorite) : null,
        autorite_saisie: formData.autorite_saisie || null,
        numero_plainte: formData.numero_plainte || null,
        enqueteur_responsable: formData.enqueteur_responsable || null,
        contact_enqueteur: formData.contact_enqueteur || null,
        contact_famille_principale: formData.contact_famille_principale || null,
        telephone_contact: formData.telephone_contact || null,
        email_contact: formData.email_contact || null,
        id_personne: formData.id_personne || null,
        id_organisation_responsable: formData.id_organisation_responsable || null,
        visible_public: formData.visible_public,
        diffusion_autorisee: formData.diffusion_autorisee,
        diffusion_medias: formData.diffusion_medias,
        diffusion_reseaux_sociaux: formData.diffusion_reseaux_sociaux,
        rayon_diffusion_km: formData.rayon_diffusion_km || 100,
        zones_diffusion_prioritaire: formData.zones_diffusion_prioritaire || null,
        date_resolution: formData.date_resolution || null,
        lieu_decouverte: formData.lieu_decouverte || null,
        latitude_decouverte: formData.latitude_decouverte ? parseFloat(formData.latitude_decouverte) : null,
        longitude_decouverte: formData.longitude_decouverte ? parseFloat(formData.longitude_decouverte) : null,
        circonstances_resolution: formData.circonstances_resolution || null,
        etat_personne_retrouvee: formData.etat_personne_retrouvee || null,
      };

      if (modalMode === 'create') {
        dossierData.id_utilisateur_createur = user?.id || null;
        const { error: insertError } = await (supabase as any)
          .from('dossier_disparition')
          .insert(dossierData);
        if (insertError) throw insertError;
      } else if (modalMode === 'edit' && selectedDossier) {
        dossierData.updated_at = new Date().toISOString();
        const { error: updateError } = await (supabase as any)
          .from('dossier_disparition')
          .update(dossierData)
          .eq('id', selectedDossier.id);
        if (updateError) throw updateError;
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

  const handleDelete = async (id: string) => {
    try {
      const { error: deleteError } = await (supabase as any)
        .from('dossier_disparition')
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

  // Fonction pour transfert de dossiers entre organisations (selon doc NIVEAU 7)
  // TODO: Implémenter cette fonctionnalité si nécessaire
  // const handleTransfer = async (dossierId: string, newOrgId: string) => {
  //   try {
  //     const { error: updateError } = await (supabase as any)
  //       .from('dossier_disparition')
  //       .update({
  //         id_organisation_responsable: newOrgId,
  //         statut_dossier: 'transfere',
  //         updated_at: new Date().toISOString(),
  //       })
  //       .eq('id', dossierId);
  //
  //     if (updateError) throw updateError;
  //     loadData();
  //     setSuccess('Dossier transféré avec succès');
  //   } catch (err: any) {
  //     console.error('Erreur transfert:', err);
  //     setError(err.message);
  //   }
  // };

  // Fonction pour archiver un dossier (selon doc NIVEAU 7)
  const handleArchive = async (dossierId: string) => {
    try {
      const { error: updateError } = await (supabase as any)
        .from('dossier_disparition')
        .update({
          statut_dossier: 'classe_sans_suite',
          updated_at: new Date().toISOString(),
        })
        .eq('id', dossierId);

      if (updateError) throw updateError;
      loadData();
    } catch (err: any) {
      console.error('Erreur archivage:', err);
      setError(err.message);
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const exportToCSV = async () => {
    try {
      setIsLoading(true);
      
      // Charger TOUS les dossiers avec les filtres actuels
      let query = (supabase as any)
        .from('dossier_disparition')
        .select(`
          *,
          personne:personne(*),
          organisation:organisation(*),
          createur:utilisateur!dossier_disparition_id_utilisateur_createur_fkey(nom, email)
        `)
        .order('created_at', { ascending: false });

      if (filterStatut) query = query.eq('statut_dossier', filterStatut);
      if (filterUrgence) query = query.eq('niveau_urgence', filterUrgence);
      if (searchTerm) {
        query = query.or(`numero_dossier.ilike.%${searchTerm}%,lieu_disparition.ilike.%${searchTerm}%`);
      }

      const { data: allDossiers, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      // Enrichir avec compteurs
      const enrichedDossiers = await Promise.all(
        (allDossiers || []).map(async (dossier: any) => {
          const [signalementsResult, alertesResult] = await Promise.all([
            (supabase as any).from('signalement').select('id', { count: 'exact', head: true }).eq('id_dossier', dossier.id),
            (supabase as any).from('alerte').select('id', { count: 'exact', head: true }).eq('id_dossier', dossier.id),
          ]);
          return {
            ...dossier,
            nombre_signalements: signalementsResult.count || 0,
            nombre_alertes_diffusees: alertesResult.count || 0,
          };
        })
      );

      // CSV avec TOUS les champs
      const headers = [
        'ID', 'Numéro dossier', 'Date disparition', 'Date dernière observation', 'Lieu disparition',
        'Ville', 'Région', 'Pays', 'Latitude', 'Longitude', 'Précision lieu', 'Circonstances',
        'Type disparition', 'Contexte spécifique', 'Personnes accompagnantes', 'Dernière activité connue',
        'Destination prévue', 'Moyen transport', 'Statut dossier', 'Sous statut', 'Niveau urgence',
        'Score priorité', 'Autorité saisie', 'Numéro plainte', 'Enquêteur responsable',
        'Contact enquêteur', 'Contact famille principale', 'Téléphone contact', 'Email contact',
        'Personne nom', 'Personne prénom', 'Personne sexe', 'Personne date naissance',
        'Organisation', 'Créateur', 'Visible public', 'Diffusion autorisée', 'Diffusion médias',
        'Diffusion réseaux sociaux', 'Rayon diffusion (km)', 'Zones diffusion prioritaire',
        'Date résolution', 'Lieu découverte', 'Latitude découverte', 'Longitude découverte',
        'Circonstances résolution', 'État personne retrouvée', 'Nombre signalements',
        'Nombre alertes diffusées', 'Nombre vues fiche', 'Date création', 'Date modification'
      ];
      
      const rows = enrichedDossiers.map((d: any) => [
        d.id,
        d.numero_dossier,
        d.date_disparition ? new Date(d.date_disparition).toLocaleString('fr-FR') : '',
        d.date_derniere_observation ? new Date(d.date_derniere_observation).toLocaleString('fr-FR') : '',
        d.lieu_disparition || '',
        d.ville_disparition || '',
        d.region_disparition || '',
        d.pays_disparition || '',
        d.latitude_disparition || '',
        d.longitude_disparition || '',
        d.precision_lieu || '',
        d.circonstances || '',
        d.type_disparition,
        d.contexte_specifique || '',
        d.personnes_accompagnantes || '',
        d.derniere_activite_connue || '',
        d.destination_prevue || '',
        d.moyen_transport || '',
        d.statut_dossier,
        d.sous_statut || '',
        d.niveau_urgence,
        d.score_priorite || '',
        d.autorite_saisie || '',
        d.numero_plainte || '',
        d.enqueteur_responsable || '',
        d.contact_enqueteur || '',
        d.contact_famille_principale || '',
        d.telephone_contact || '',
        d.email_contact || '',
        d.personne?.nom || '',
        d.personne?.prenom || '',
        d.personne?.sexe || '',
        d.personne?.date_naissance ? new Date(d.personne.date_naissance).toLocaleDateString('fr-FR') : '',
        d.organisation?.nom || '',
        d.createur ? `${d.createur.nom} (${d.createur.email})` : '',
        d.visible_public ? 'Oui' : 'Non',
        d.diffusion_autorisee ? 'Oui' : 'Non',
        d.diffusion_medias ? 'Oui' : 'Non',
        d.diffusion_reseaux_sociaux ? 'Oui' : 'Non',
        d.rayon_diffusion_km || '',
        d.zones_diffusion_prioritaire || '',
        d.date_resolution ? new Date(d.date_resolution).toLocaleString('fr-FR') : '',
        d.lieu_decouverte || '',
        d.latitude_decouverte || '',
        d.longitude_decouverte || '',
        d.circonstances_resolution || '',
        d.etat_personne_retrouvee || '',
        d.nombre_signalements || 0,
        d.nombre_alertes_diffusees || 0,
        d.nombre_vues_fiche || 0,
        d.created_at ? new Date(d.created_at).toLocaleString('fr-FR') : '',
        d.updated_at ? new Date(d.updated_at).toLocaleString('fr-FR') : '',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row: any[]) => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `dossiers_${new Date().toISOString().split('T')[0]}.csv`;
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
      en_cours: 'warning',
      retrouve_vivant: 'success',
      retrouve_decede: 'danger',
      suspendu: 'info',
      classe_sans_suite: 'default',
      transfere: 'info',
    };
    return colors[statut] || 'default';
  };

  const getUrgenceColor = (urgence: string) => {
    const colors: Record<string, string> = {
      critique: 'danger',
      urgent: 'warning',
      normal: 'info',
      faible: 'default',
    };
    return colors[urgence] || 'default';
  };

  return (
    <SuperAdminLayout title="Gestion des Dossiers" activeNav="dossiers">
      <div className={styles['sa-dossiers']}>
        {/* Header avec bouton créer */}
        <div className={styles['sa-dossiers__header']}>
          <div>
            <h2>Gestion des Dossiers</h2>
            <p>Créez, modifiez et gérez tous les dossiers de disparition</p>
          </div>
          <div className={styles['sa-dossiers__header-actions']}>
            <button type="button" onClick={exportToCSV} disabled={isLoading} className={styles['sa-dossiers__btn-export']}>
              <Download size={18} />
              Exporter CSV
            </button>
            <button type="button" onClick={openCreateModal} className={styles['sa-dossiers__btn-create']}>
              <Plus size={20} />
              Créer un dossier
            </button>
          </div>
        </div>

        {/* Filtres */}
        <div className={styles['sa-dossiers__filters']}>
          <div className={styles['sa-dossiers__search']}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Rechercher par numéro ou lieu..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <select value={filterStatut} onChange={(e) => { setFilterStatut(e.target.value); setCurrentPage(1); }}>
            <option value="">Tous les statuts</option>
            <option value="en_cours">En cours</option>
            <option value="retrouve_vivant">Retrouvé vivant</option>
            <option value="retrouve_decede">Retrouvé décédé</option>
            <option value="suspendu">Suspendu</option>
            <option value="classe_sans_suite">Archivés (classés sans suite)</option>
            <option value="transfere">Transféré</option>
          </select>
          <select value={filterUrgence} onChange={(e) => { setFilterUrgence(e.target.value); setCurrentPage(1); }}>
            <option value="">Tous les niveaux</option>
            <option value="critique">Critique</option>
            <option value="urgent">Urgent</option>
            <option value="normal">Normal</option>
            <option value="faible">Faible</option>
          </select>
        </div>
        <p className={styles['sa-dossiers__archives-hint']}>
          Les dossiers archivés restent dans cette liste. Filtrez par « Archivés (classés sans suite) » pour les afficher.
        </p>

        {/* Error */}
        {error && (
          <div className={styles['sa-dossiers__error']}>
            <AlertCircle size={20} />
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)} aria-label="Fermer"><X size={16} /></button>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className={styles['sa-dossiers__success']}>
            <Check size={20} />
            <span>{success}</span>
            <button type="button" onClick={() => setSuccess(null)}><X size={16} /></button>
          </div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className={styles['sa-dossiers__loading']}>
            <Loader2 size={32} className={styles['sa-dossiers__spinner']} />
          </div>
        ) : (
          <div className={styles['sa-dossiers__table-wrapper']}>
            {dossiers.length === 0 ? (
              <div className={styles['sa-dossiers__empty']}>
                <FolderOpen size={48} />
                <p>Aucun dossier trouvé</p>
              </div>
            ) : (
              <table className={styles['sa-dossiers__table']}>
                <thead>
                  <tr>
                    <th>Numéro</th>
                    <th>Personne</th>
                    <th><span className={styles['sa-dossiers__th-icon']}><Calendar size={14} /> Date</span></th>
                    <th><span className={styles['sa-dossiers__th-icon']}><MapPin size={14} /> Lieu</span></th>
                    <th>Type</th>
                    <th>Statut</th>
                    <th>Urgence</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dossiers.map((dossier) => (
                    <tr key={dossier.id}>
                      <td>
                        <button
                          type="button"
                          className={styles['sa-dossiers__num-link']}
                          onClick={() => navigate(`/super-admin/dossiers/${dossier.id}`)}
                          title="Voir le détail complet"
                        >
                          {dossier.numero_dossier}
                        </button>
                      </td>
                      <td>
                        {dossier.personne ? (
                          `${dossier.personne.prenom || ''} ${dossier.personne.nom}`.trim()
                        ) : '-'}
                      </td>
                      <td>{new Date(dossier.date_disparition).toLocaleDateString('fr-FR')}</td>
                      <td>{dossier.lieu_disparition || dossier.ville_disparition || '-'}</td>
                      <td>{dossier.type_disparition}</td>
                      <td>
                        <span className={`${styles['sa-dossiers__badge']} ${styles[`sa-dossiers__badge--${getStatutColor(dossier.statut_dossier)}`]}`}>
                          {dossier.statut_dossier}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles['sa-dossiers__badge']} ${styles[`sa-dossiers__badge--${getUrgenceColor(dossier.niveau_urgence)}`]}`}>
                          {dossier.niveau_urgence}
                        </span>
                      </td>
                      <td className={styles['sa-dossiers__actions']}>
                        <button
                          type="button"
                          className={styles['sa-dossiers__btn-modifier']}
                          onClick={() => openEditModal(dossier)}
                          title="Modifier le dossier"
                        >
                          <Edit2 size={16} />
                          Modifier
                        </button>
                        <button
                          type="button"
                          className={styles['sa-dossiers__btn-voir']}
                          onClick={() => navigate(`/super-admin/dossiers/${dossier.id}`)}
                          title="Voir le détail complet (page dédiée)"
                        >
                          <Eye size={16} />
                          Voir détail
                        </button>
                        {dossier.statut_dossier !== 'classe_sans_suite' && (
                          <button type="button" onClick={() => handleArchive(dossier.id)} className={styles['sa-dossiers__btn-archive']} title="Archiver">
                            <Archive size={16} />
                          </button>
                        )}
                        <button type="button" onClick={() => setDeleteConfirm(dossier.id)} className={styles['sa-dossiers__btn-delete']} title="Supprimer">
                          <Trash2 size={16} />
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
          <div className={styles['sa-dossiers__pagination']}>
            <button type="button" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
              <ChevronLeft size={16} /> Précédent
            </button>
            <span>Page {currentPage} sur {totalPages}</span>
            <button type="button" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
              Suivant <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Modal Create/Edit */}
        {(showModal && (modalMode === 'create' || modalMode === 'edit')) && (
          <div className={styles['sa-dossiers__modal-overlay']} onClick={() => setShowModal(false)}>
            <div className={styles['sa-dossiers__modal']} onClick={(e) => e.stopPropagation()}>
              <div className={styles['sa-dossiers__modal-header']}>
                <h2>{modalMode === 'create' ? 'Créer un dossier' : 'Modifier le dossier'}</h2>
                <button type="button" onClick={() => setShowModal(false)} aria-label="Fermer"><X size={20} /></button>
              </div>
              
              <div className={styles['sa-dossiers__modal-body']}>
                <div className={styles['sa-dossiers__form-grid']}>
                  <div>
                    <label>Numéro de dossier</label>
                    <input
                      type="text"
                      value={formData.numero_dossier}
                      onChange={(e) => setFormData({ ...formData, numero_dossier: e.target.value })}
                      placeholder="Laissé vide pour génération automatique"
                    />
                  </div>
                  <div>
                    <label>Date de disparition *</label>
                    <input
                      type="date"
                      value={formData.date_disparition}
                      onChange={(e) => setFormData({ ...formData, date_disparition: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label>Lieu de disparition</label>
                    <input
                      type="text"
                      value={formData.lieu_disparition}
                      onChange={(e) => setFormData({ ...formData, lieu_disparition: e.target.value })}
                    />
                  </div>
                  <div>
                    <label>Ville</label>
                    <input
                      type="text"
                      value={formData.ville_disparition}
                      onChange={(e) => setFormData({ ...formData, ville_disparition: e.target.value })}
                    />
                  </div>
                  <div>
                    <label>Région</label>
                    <input
                      type="text"
                      value={formData.region_disparition}
                      onChange={(e) => setFormData({ ...formData, region_disparition: e.target.value })}
                    />
                  </div>
                  <div>
                    <label>Type de disparition *</label>
                    <select
                      value={formData.type_disparition}
                      onChange={(e) => setFormData({ ...formData, type_disparition: e.target.value as TypeDisparition })}
                      required
                    >
                      <option value="fugue">Fugue</option>
                      <option value="enlevement_presume">Enlèvement présumé</option>
                      <option value="accident">Accident</option>
                      <option value="conflit_arme">Conflit armé</option>
                      <option value="migration">Migration</option>
                      <option value="catastrophe_naturelle">Catastrophe naturelle</option>
                      <option value="disparition_volontaire">Disparition volontaire</option>
                      <option value="inconnue">Inconnue</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                  <div>
                    <label>Statut *</label>
                    <select
                      value={formData.statut_dossier}
                      onChange={(e) => setFormData({ ...formData, statut_dossier: e.target.value as StatutDossier })}
                      required
                    >
                      <option value="en_cours">En cours</option>
                      <option value="retrouve_vivant">Retrouvé vivant</option>
                      <option value="retrouve_decede">Retrouvé décédé</option>
                      <option value="suspendu">Suspendu</option>
                      <option value="classe_sans_suite">Classé sans suite</option>
                      <option value="transfere">Transféré</option>
                    </select>
                  </div>
                  <div>
                    <label>Niveau d'urgence *</label>
                    <select
                      value={formData.niveau_urgence}
                      onChange={(e) => setFormData({ ...formData, niveau_urgence: e.target.value as NiveauUrgence })}
                      required
                    >
                      <option value="critique">Critique</option>
                      <option value="urgent">Urgent</option>
                      <option value="normal">Normal</option>
                      <option value="faible">Faible</option>
                    </select>
                  </div>
                  <div>
                    <label>Personne</label>
                    <select
                      value={formData.id_personne}
                      onChange={(e) => setFormData({ ...formData, id_personne: e.target.value })}
                    >
                      <option value="">Sélectionner une personne</option>
                      {personnes.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.prenom || ''} {p.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>Organisation responsable</label>
                    <select
                      value={formData.id_organisation_responsable}
                      onChange={(e) => setFormData({ ...formData, id_organisation_responsable: e.target.value })}
                    >
                      <option value="">Aucune</option>
                      {organisations.map((org) => (
                        <option key={org.id} value={org.id}>{org.nom}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles['sa-dossiers__form-full']}>
                    <label>Circonstances</label>
                    <textarea
                      value={formData.circonstances}
                      onChange={(e) => setFormData({ ...formData, circonstances: e.target.value })}
                      rows={4}
                    />
                  </div>
                  <div>
                    <label>
                      <input
                        type="checkbox"
                        checked={formData.visible_public}
                        onChange={(e) => setFormData({ ...formData, visible_public: e.target.checked })}
                      />
                      Visible publiquement
                    </label>
                  </div>
                </div>
              </div>

              <div className={styles['sa-dossiers__modal-footer']}>
                <button onClick={() => setShowModal(false)}>Annuler</button>
                <button onClick={handleSave} disabled={isSaving} className={styles['sa-dossiers__btn-save']}>
                  {isSaving ? <Loader2 size={16} className={styles['sa-dossiers__spinner']} /> : <Check size={16} />}
                  {modalMode === 'create' ? 'Créer' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {deleteConfirm && (
          <div className={styles['sa-dossiers__modal-overlay']}>
            <div className={styles['sa-dossiers__modal']}>
              <div className={styles['sa-dossiers__modal-header']}>
                <h2>Confirmer la suppression</h2>
                <button type="button" onClick={() => setDeleteConfirm(null)} aria-label="Fermer"><X size={20} /></button>
              </div>
              <div className={styles['sa-dossiers__modal-body']}>
                <p>Êtes-vous sûr de vouloir supprimer ce dossier ? Cette action est irréversible.</p>
              </div>
              <div className={styles['sa-dossiers__modal-footer']}>
                <button type="button" onClick={() => setDeleteConfirm(null)}>Annuler</button>
                <button type="button" onClick={() => handleDelete(deleteConfirm)} className={styles['sa-dossiers__btn-delete']}>
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminDossiersPage;
