/**
 * =====================================================
 * RETROUVONSLES - Types de Base de Données
 * Types TypeScript générés depuis le schéma Supabase
 * =====================================================
 */

import * as Enums from './enums.types';

// ============================================
// TYPES DE BASE
// ============================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Timestamp = string; // ISO 8601 format

export type UUID = string;

export type Geography = {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
};

// ============================================
// TABLES - INTERFACES
// ============================================

export interface Organisation {
  id: UUID;
  nom: string;
  type_organisation: Enums.TypeOrganisation;
  pays: string;
  region: string | null;
  ville: string | null;
  adresse: string | null;
  contact_officiel: string | null;
  telephone: string | null;
  email: string | null;
  site_web: string | null;
  statut_actif: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Role {
  id: UUID;
  nom_role: Enums.NomRole;
  niveau_accreditation: number;
  description: string | null;
  permissions: Json | null;
  created_at: Timestamp;
}

export interface Utilisateur {
  id: UUID;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  statut_compte: Enums.StatutCompte;
  type_compte: Enums.TypeCompte;
  photo_profil: string | null;
  date_naissance: string | null;
  adresse: string | null;
  ville: string | null;
  region: string | null;
  pays: string;
  numero_badge: string | null;
  document_accreditation: string | null;
  latitude_actuelle: number | null;
  longitude_actuelle: number | null;
  rayon_notification_km: number;
  preferences_notification: Json | null;
  langue_preferee: string;
  accepte_notifications: boolean;
  accepte_geolocalisation: boolean;
  score_fiabilite: number;
  nombre_signalements_valides: number;
  nombre_signalements_invalides: number;
  derniere_connexion: Timestamp | null;
  derniere_maj_localisation: Timestamp | null;
  ip_derniere_connexion: string | null;
  id_organisation: UUID | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface UtilisateurRole {
  id_utilisateur: UUID;
  id_role: UUID;
  date_attribution: Timestamp;
  date_expiration: Timestamp | null;
  attribue_par: UUID | null;
  commentaire: string | null;
}

export interface Personne {
  id: UUID;
  nom: string | null;
  prenom: string | null;
  nom_complet: string | null;
  alias: string | null;
  sexe: Enums.Sexe;
  date_naissance: string | null;
  age_estime_min: number | null;
  age_estime_max: number | null;
  nationalite: string;
  autres_nationalites: string | null;
  langue_parlee: string | null;
  numero_identification: string | null;
  type_identification: Enums.TypeIdentification | null;
  description_physique: string | null;
  taille_cm: number | null;
  poids_kg: number | null;
  corpulence: Enums.Corpulence | null;
  couleur_peau: Enums.CouleurPeau | null;
  couleur_cheveux: string | null;
  type_cheveux: Enums.TypeCheveux | null;
  couleur_yeux: string | null;
  signes_distinctifs: string | null;
  handicaps_maladies: string | null;
  groupe_sanguin: string | null;
  derniers_vetements_portes: string | null;
  accessoires: string | null;
  donnees_biometriques: Json | null;
  photo_principale: string | null;
  situation_familiale: Enums.SituationFamiliale | null;
  nombre_enfants: number | null;
  statut_identite: Enums.StatutIdentite;
  fiabilite_informations: Enums.FiabiliteInformations;
  cree_par: UUID | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface LienFiliation {
  id: UUID;
  type_lien: Enums.TypeLienFiliation;
  id_personne_source: UUID | null;
  id_personne_cible: UUID | null;
  precision_lien: string | null;
  nature_filiation: Enums.NatureFiliation;
  compatibilite_genetique_probable: boolean | null;
  score_compatibilite_physique: number | null;
  caracteristiques_communes: Json | null;
  donnees_genetiques_disponibles: boolean;
  hash_adn_source: string | null;
  hash_adn_cible: string | null;
  statut_verification: Enums.StatutVerification;
  type_preuve: Enums.TypePreuve;
  document_justificatif: string | null;
  numero_acte_officiel: string | null;
  autorite_emettrice: string | null;
  date_etablissement_lien: string | null;
  autorite_parentale: Enums.AutoriteParentale | null;
  situation_familiale: string | null;
  generation: number;
  ligne_directe: boolean;
  personne_contact_principal: boolean;
  telephone_contact: string | null;
  email_contact: string | null;
  adresse_contact: string | null;
  cree_par: UUID | null;
  modifie_par: UUID | null;
  source_information: Enums.SourceInformation;
  commentaire: string | null;
  confidentiel: boolean;
  visible_public: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface DossierDisparition {
  id: UUID;
  numero_dossier: string;
  date_disparition: Timestamp;
  date_derniere_observation: Timestamp | null;
  lieu_disparition: string | null;
  ville_disparition: string | null;
  region_disparition: string | null;
  pays_disparition: string;
  latitude_disparition: number | null;
  longitude_disparition: number | null;
  point_disparition: Geography | null;
  precision_lieu: Enums.PrecisionLieu;
  circonstances: string;
  type_disparition: Enums.TypeDisparition;
  contexte_specifique: string | null;
  personnes_accompagnantes: string | null;
  derniere_activite_connue: string | null;
  destination_prevue: string | null;
  moyen_transport: string | null;
  statut_dossier: Enums.StatutDossier;
  sous_statut: string | null;
  niveau_urgence: Enums.NiveauUrgence;
  score_priorite: number | null;
  zone_recherche_predite: Json | null;
  probabilite_localisation: Json | null;
  facteurs_risque: Json | null;
  dossiers_similaires: Json | null;
  autorite_saisie: string | null;
  numero_plainte: string | null;
  enqueteur_responsable: string | null;
  contact_enqueteur: string | null;
  contact_famille_principale: string | null;
  telephone_contact: string | null;
  email_contact: string | null;
  visible_public: boolean;
  diffusion_autorisee: boolean;
  diffusion_medias: boolean;
  diffusion_reseaux_sociaux: boolean;
  rayon_diffusion_km: number;
  zones_diffusion_prioritaire: string | null;
  date_resolution: Timestamp | null;
  lieu_decouverte: string | null;
  latitude_decouverte: number | null;
  longitude_decouverte: number | null;
  point_decouverte: Geography | null;
  circonstances_resolution: string | null;
  etat_personne_retrouvee: Enums.EtatPersonneRetrouvee | null;
  nombre_signalements: number;
  nombre_alertes_diffusees: number;
  nombre_vues_fiche: number;
  id_personne: UUID | null;
  id_utilisateur_createur: UUID | null;
  id_organisation_responsable: UUID | null;
  created_at: Timestamp;
  updated_at: Timestamp;
  derniere_activite: Timestamp;
}

export interface Signalement {
  id: UUID;
  numero_signalement: string | null;
  description: string;
  date_observation: Timestamp;
  lieu_observation: string | null;
  ville_observation: string | null;
  region_observation: string | null;
  pays_observation: string;
  latitude_observation: number | null;
  longitude_observation: number | null;
  point_observation: Geography | null;
  precision_localisation: Enums.PrecisionLieu;
  niveau_certitude: Enums.NiveauCertitude;
  distance_observation: Enums.DistanceObservation | null;
  duree_observation: string | null;
  contexte_observation: string | null;
  etat_personne_observee: string | null;
  accompagnement: string | null;
  direction_deplacement: string | null;
  moyen_deplacement: string | null;
  statut_validation: Enums.StatutValidation;
  priorite_traitement: Enums.PrioriteTraitement;
  score_pertinence: number | null;
  raisons_score: Json | null;
  verifie_par: UUID | null;
  date_verification: Timestamp | null;
  commentaire_verification: string | null;
  transmis_autorites: boolean;
  date_transmission: Timestamp | null;
  autorite_destinataire: string | null;
  actions_entreprises: string | null;
  temoin_anonyme: boolean;
  nom_temoin: string | null;
  telephone_temoin: string | null;
  email_temoin: string | null;
  accepte_contact_suivi: boolean;
  source_signalement: Enums.SourceSignalement;
  ip_signalement: string | null;
  user_agent: string | null;
  id_utilisateur: UUID | null;
  id_dossier: UUID | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Photo {
  id: UUID;
  url_cloudinary: string;
  url_thumbnail: string | null;
  public_id_cloudinary: string | null;
  type_photo: Enums.TypePhoto;
  titre: string | null;
  description: string | null;
  date_prise: string | null;
  lieu_prise: string | null;
  analyse_ia_effectuee: boolean;
  vecteur_facial: Json | null;
  caracteristiques_detectees: Json | null;
  qualite_image: Enums.QualiteImage;
  taille_octets: number | null;
  format: string | null;
  largeur_px: number | null;
  hauteur_px: number | null;
  hash_image: string | null;
  est_principale: boolean;
  visible_public: boolean;
  approuvee: boolean;
  moderee_par: UUID | null;
  date_moderation: Timestamp | null;
  uploadee_par: UUID | null;
  id_personne: UUID | null;
  id_signalement: UUID | null;
  created_at: Timestamp;
}

export interface Localisation {
  id: UUID;
  latitude: number;
  longitude: number;
  point: Geography;
  precision_m: number | null;
  altitude_m: number | null;
  source_localisation: Enums.SourceLocalisation;
  fiabilite_source: Enums.FiabiliteSource;
  type_localisation: Enums.TypeLocalisation;
  adresse: string | null;
  ville: string | null;
  region: string | null;
  pays: string | null;
  point_interet: string | null;
  description: string | null;
  date_localisation: Timestamp;
  id_dossier: UUID | null;
  id_signalement: UUID | null;
  enregistree_par: UUID | null;
  created_at: Timestamp;
}

export interface Alerte {
  id: UUID;
  numero_alerte: string | null;
  titre: string;
  message: string;
  message_court: string | null;
  type_alerte: Enums.TypeAlerte;
  latitude_centre: number | null;
  longitude_centre: number | null;
  point_centre: Geography | null;
  rayon_km: number;
  zones_specifiques: Json | null;
  date_diffusion: Timestamp;
  date_expiration: Timestamp | null;
  canaux_diffusion: Json | null;
  statut_alerte: Enums.StatutAlerte;
  niveau_urgence_min: number;
  types_utilisateurs: Json | null;
  nombre_destinataires: number;
  nombre_envois_reussis: number;
  nombre_vues: number;
  nombre_partages: number;
  nombre_signalements_generes: number;
  validee: boolean;
  id_utilisateur_validateur: UUID | null;
  date_validation: Timestamp | null;
  commentaire_validation: string | null;
  id_dossier: UUID | null;
  id_utilisateur_createur: UUID | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface ResultatIA {
  id: UUID;
  type_analyse: Enums.TypeAnalyse;
  score_confiance: number;
  seuil_decision: number;
  donnees_brutes: Json;
  donnees_interpretees: Json | null;
  correspondances_trouvees: Json | null;
  zones_predites: Json | null;
  facteurs_cles: Json | null;
  modele_ia_utilise: string | null;
  version_algorithme: string | null;
  temps_traitement_ms: number | null;
  statut_validation: Enums.StatutValidationIA;
  valide_par: UUID | null;
  date_validation: Timestamp | null;
  commentaire_validation: string | null;
  action_generee: Enums.ActionGeneree;
  faux_positif: boolean | null;
  date_analyse: Timestamp;
  id_photo: UUID | null;
  id_dossier: UUID | null;
  id_signalement: UUID | null;
  declenche_par: UUID | null;
}

export interface JournalActivite {
  id: number;
  type_action: Enums.TypeAction;
  action_detaillee: string | null;
  description: string | null;
  donnees_avant: Json | null;
  donnees_apres: Json | null;
  ip_utilisateur: string | null;
  user_agent: string | null;
  localisation_action: string | null;
  date_action: Timestamp;
  id_utilisateur: UUID | null;
  id_dossier: UUID | null;
  id_signalement: UUID | null;
  id_alerte: UUID | null;
}

export interface Notification {
  id: number;
  type_notification: Enums.TypeNotification;
  titre: string;
  message: string;
  message_court: string | null;
  canal: Enums.CanalNotification;
  priorite: Enums.PrioriteTraitement;
  lue: boolean;
  date_lecture: Timestamp | null;
  url_action: string | null;
  donnees_supplementaires: Json | null;
  statut_envoi: Enums.StatutEnvoi;
  code_erreur: string | null;
  tentatives_envoi: number;
  date_creation: Timestamp;
  date_envoi: Timestamp | null;
  id_utilisateur: UUID | null;
  id_dossier: UUID | null;
  id_alerte: UUID | null;
}

export interface Commentaire {
  id: UUID;
  contenu: string;
  type_commentaire: Enums.TypeCommentaire;
  confidentiel: boolean;
  modifie: boolean;
  id_dossier: UUID | null;
  id_utilisateur: UUID | null;
  id_commentaire_parent: UUID | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Document {
  id: UUID;
  nom_fichier: string;
  type_document: Enums.TypeDocument;
  url_fichier: string;
  taille_octets: number | null;
  format_fichier: string | null;
  description: string | null;
  confidentiel: boolean;
  date_upload: Timestamp;
  uploade_par: UUID | null;
  id_dossier: UUID | null;
  id_signalement: UUID | null;
}

export interface StatistiqueRecherche {
  id: UUID;
  periode_debut: string;
  periode_fin: string;
  type_periode: Enums.TypePeriode;
  region: string | null;
  ville: string | null;
  nombre_nouveaux_dossiers: number;
  nombre_dossiers_resolus: number;
  nombre_personnes_retrouvees_vivantes: number;
  nombre_personnes_retrouvees_decedees: number;
  taux_resolution: number | null;
  temps_moyen_resolution_jours: number | null;
  nombre_enfants_disparus: number;
  nombre_adultes_disparus: number;
  nombre_enlevements: number;
  nombre_fugues: number;
  nombre_signalements_recus: number;
  nombre_signalements_valides: number;
  taux_validation_signalements: number | null;
  nombre_alertes_diffusees: number;
  portee_moyenne_alertes: number;
  nombre_analyses_ia: number;
  taux_precision_ia: number | null;
  nombre_correspondances_ia: number;
  date_generation: Timestamp;
}

export interface Don {
  id: UUID;
  montant: number;
  devise: string;
  type_don: Enums.TypeDon;
  donateur_anonyme: boolean;
  nom_donateur: string | null;
  email_donateur: string | null;
  telephone_donateur: string | null;
  organisation_donatrice: string | null;
  message_donateur: string | null;
  methode_paiement: Enums.MethodePaiement;
  statut_paiement: Enums.StatutPaiement;
  reference_transaction: string | null;
  id_transaction_externe: string | null;
  date_don: Timestamp;
  date_traitement: Timestamp | null;
  remerciement_envoye: boolean;
  date_remerciement: Timestamp | null;
  recu_fiscal_genere: boolean;
  numero_recu: string | null;
}

export interface CampagneSensibilisation {
  id: UUID;
  titre: string;
  description: string | null;
  objectif: string | null;
  type_campagne: Enums.TypeCampagne;
  public_cible: string | null;
  date_debut: string;
  date_fin: string | null;
  zones_geographiques: Json | null;
  canaux_diffusion: Json | null;
  contenu_campagne: Json | null;
  statut_campagne: Enums.StatutCampagne;
  nombre_personnes_touchees: number;
  nombre_interactions: number;
  budget_alloue: number | null;
  budget_depense: number | null;
  creee_par: UUID | null;
  id_organisation: UUID | null;
  created_at: Timestamp;
}

// ============================================
// DATABASE SCHEMA TYPE
// ============================================

export interface Database {
  public: {
    Tables: {
      organisation: {
        Row: Organisation;
        Insert: Omit<Organisation, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Organisation, 'id' | 'created_at'>>;
      };
      role: {
        Row: Role;
        Insert: Omit<Role, 'id' | 'created_at'>;
        Update: Partial<Omit<Role, 'id' | 'created_at'>>;
      };
      utilisateur: {
        Row: Utilisateur;
        Insert: Omit<Utilisateur, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Utilisateur, 'id' | 'created_at'>>;
      };
      utilisateur_role: {
        Row: UtilisateurRole;
        Insert: Omit<UtilisateurRole, 'date_attribution'>;
        Update: Partial<UtilisateurRole>;
      };
      personne: {
        Row: Personne;
        Insert: Omit<Personne, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Personne, 'id' | 'created_at'>>;
      };
      lien_filiation: {
        Row: LienFiliation;
        Insert: Omit<LienFiliation, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<LienFiliation, 'id' | 'created_at'>>;
      };
      dossier_disparition: {
        Row: DossierDisparition;
        Insert: Omit<DossierDisparition, 'id' | 'created_at' | 'updated_at' | 'derniere_activite' | 'numero_dossier'>;
        Update: Partial<Omit<DossierDisparition, 'id' | 'created_at' | 'numero_dossier'>>;
      };
      signalement: {
        Row: Signalement;
        Insert: Omit<Signalement, 'id' | 'created_at' | 'updated_at' | 'numero_signalement'>;
        Update: Partial<Omit<Signalement, 'id' | 'created_at' | 'numero_signalement'>>;
      };
      photo: {
        Row: Photo;
        Insert: Omit<Photo, 'id' | 'created_at'>;
        Update: Partial<Omit<Photo, 'id' | 'created_at'>>;
      };
      localisation: {
        Row: Localisation;
        Insert: Omit<Localisation, 'id' | 'created_at'>;
        Update: Partial<Omit<Localisation, 'id' | 'created_at'>>;
      };
      alerte: {
        Row: Alerte;
        Insert: Omit<Alerte, 'id' | 'created_at' | 'updated_at' | 'numero_alerte'>;
        Update: Partial<Omit<Alerte, 'id' | 'created_at' | 'numero_alerte'>>;
      };
      resultat_ia: {
        Row: ResultatIA;
        Insert: Omit<ResultatIA, 'id' | 'date_analyse'>;
        Update: Partial<Omit<ResultatIA, 'id' | 'date_analyse'>>;
      };
      journal_activite: {
        Row: JournalActivite;
        Insert: Omit<JournalActivite, 'id' | 'date_action'>;
        Update: never; // Journal non modifiable
      };
      notification: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'date_creation'>;
        Update: Partial<Omit<Notification, 'id' | 'date_creation'>>;
      };
      commentaire: {
        Row: Commentaire;
        Insert: Omit<Commentaire, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Commentaire, 'id' | 'created_at'>>;
      };
      document: {
        Row: Document;
        Insert: Omit<Document, 'id' | 'date_upload'>;
        Update: Partial<Omit<Document, 'id' | 'date_upload'>>;
      };
      statistique_recherche: {
        Row: StatistiqueRecherche;
        Insert: Omit<StatistiqueRecherche, 'id' | 'date_generation'>;
        Update: Partial<Omit<StatistiqueRecherche, 'id' | 'date_generation'>>;
      };
      don: {
        Row: Don;
        Insert: Omit<Don, 'id' | 'date_don'>;
        Update: Partial<Omit<Don, 'id' | 'date_don'>>;
      };
      campagne_sensibilisation: {
        Row: CampagneSensibilisation;
        Insert: Omit<CampagneSensibilisation, 'id' | 'created_at'>;
        Update: Partial<Omit<CampagneSensibilisation, 'id' | 'created_at'>>;
      };
    };
    Views: {
      v_dossiers_actifs: {
        Row: {
          id: UUID;
          numero_dossier: string;
          date_disparition: Timestamp;
          statut_dossier: Enums.StatutDossier;
          niveau_urgence: Enums.NiveauUrgence;
          nom: string | null;
          prenom: string | null;
          sexe: Enums.Sexe;
          age_estime_min: number | null;
          ville_disparition: string | null;
          region_disparition: string | null;
          nombre_signalements: number;
          nombre_alertes: number;
          jours_depuis_disparition: number;
        };
      };
      v_stats_par_region: {
        Row: {
          region_disparition: string | null;
          total_disparitions: number;
          en_cours: number;
          retrouves_vivants: number;
          retrouves_decedes: number;
          taux_resolution: number | null;
        };
      };
    };
    Functions: {
      calcul_distance_km: {
        Args: {
          lat1: number;
          lon1: number;
          lat2: number;
          lon2: number;
        };
        Returns: number;
      };
      get_user_niveau_acces: {
        Args: {
          user_id: UUID;
        };
        Returns: number;
      };
    };
  };
}