/**
 * =====================================================
 * RETROUVONSLES - Personne Types
 * Type definitions for personne (missing person) feature
 * =====================================================
 */

export interface Personne {
  id: string;
  nom?: string;
  prenom?: string;
  nom_complet?: string;
  alias?: string;
  sexe: 'masculin' | 'feminin' | 'inconnu' | 'non_precise';
  date_naissance?: Date;
  age_estime_min?: number;
  age_estime_max?: number;
  nationalite?: string;
  autres_nationalites?: string;
  langue_parlee?: string;
  numero_identification?: string;
  type_identification?: 'cni' | 'passeport' | 'acte_naissance' | 'aucun' | 'autre';
  description_physique?: string;
  taille_cm?: number;
  poids_kg?: number;
  corpulence?: 'mince' | 'moyenne' | 'forte' | 'athletique' | 'inconnue';
  couleur_peau?: 'claire' | 'mate' | 'foncee' | 'tres_foncee' | 'inconnue';
  couleur_cheveux?: string;
  type_cheveux?: 'courts' | 'longs' | 'frises' | 'raides' | 'tresses' | 'rases' | 'autre';
  couleur_yeux?: string;
  signes_distinctifs?: string;
  handicaps_maladies?: string;
  groupe_sanguin?: string;
  derniers_vetements_portes?: string;
  accessoires?: string;
  donnees_biometriques?: Record<string, any>;
  photo_principale?: string;
  situation_familiale?: 'avec_famille' | 'orphelin' | 'separe_famille' | 'famille_inconnue' | 'autre';
  nombre_enfants?: number;
  statut_identite?: 'identifie' | 'partiellement_identifie' | 'non_identifie';
  fiabilite_informations?: 'confirmee' | 'probable' | 'incertaine';
  cree_par?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface PersonnePhoto {
  id: string;
  personne_id: string;
  url: string;
  type_photo: 'portrait' | 'corps_entier' | 'signalement' | 'lieu_disparition' | 'objet_personnel' | 'document' | 'autre';
  qualite_image: 'excellente' | 'bonne' | 'moyenne' | 'faible';
  source_photo?: string;
  date_prise?: Date;
  localisation_prise?: string;
  metadata?: Record<string, any>;
  created_at?: Date;
  updated_at?: Date;
}

export interface LienFiliation {
  id: string;
  type_lien: string;
  id_personne_source: string;
  id_personne_cible: string;
  precision_lien?: string;
  nature_filiation: 'biologique' | 'adoptive' | 'par_alliance' | 'tutelle_legale' | 'garde_partagee' | 'inconnue';
  compatibilite_genetique_probable?: boolean;
  score_compatibilite_physique?: number;
  caracteristiques_communes?: Record<string, any>;
  donnees_genetiques_disponibles?: boolean;
  statut_verification: 'confirme_officiellement' | 'confirme_genetiquement' | 'declare_famille' | 'suppose_ia' | 'en_verification' | 'conteste' | 'invalide';
  type_preuve?: 'acte_naissance' | 'livret_famille' | 'jugement_adoption' | 'test_adn' | 'temoignages' | 'reconnaissance_ia' | 'documents_identite' | 'autre' | 'aucune';
  created_at?: Date;
  updated_at?: Date;
}

export interface PersonneCreatePayload {
  nom?: string;
  prenom?: string;
  nom_complet?: string;
  alias?: string;
  sexe: 'masculin' | 'feminin' | 'inconnu' | 'non_precise';
  date_naissance?: string;
  age_estime_min?: number;
  age_estime_max?: number;
  nationalite?: string;
  autres_nationalites?: string;
  langue_parlee?: string;
  numero_identification?: string;
  type_identification?: 'cni' | 'passeport' | 'acte_naissance' | 'aucun' | 'autre';
  description_physique?: string;
  taille_cm?: number;
  poids_kg?: number;
  corpulence?: 'mince' | 'moyenne' | 'forte' | 'athletique' | 'inconnue';
  couleur_peau?: 'claire' | 'mate' | 'foncee' | 'tres_foncee' | 'inconnue';
  couleur_cheveux?: string;
  type_cheveux?: 'courts' | 'longs' | 'frises' | 'raides' | 'tresses' | 'rases' | 'autre';
  couleur_yeux?: string;
  signes_distinctifs?: string;
  handicaps_maladies?: string;
  groupe_sanguin?: string;
  derniers_vetements_portes?: string;
  accessoires?: string;
  photo_principale?: string;
  situation_familiale?: 'avec_famille' | 'orphelin' | 'separe_famille' | 'famille_inconnue' | 'autre';
  nombre_enfants?: number;
}

export interface PersonneUpdatePayload {
  nom?: string;
  prenom?: string;
  nom_complet?: string;
  alias?: string;
  sexe?: 'masculin' | 'feminin' | 'inconnu' | 'non_precise';
  date_naissance?: string;
  age_estime_min?: number;
  age_estime_max?: number;
  nationalite?: string;
  autres_nationalites?: string;
  langue_parlee?: string;
  numero_identification?: string;
  type_identification?: 'cni' | 'passeport' | 'acte_naissance' | 'aucun' | 'autre';
  description_physique?: string;
  taille_cm?: number;
  poids_kg?: number;
  corpulence?: 'mince' | 'moyenne' | 'forte' | 'athletique' | 'inconnue';
  couleur_peau?: 'claire' | 'mate' | 'foncee' | 'tres_foncee' | 'inconnue';
  couleur_cheveux?: string;
  type_cheveux?: 'courts' | 'longs' | 'frises' | 'raides' | 'tresses' | 'rases' | 'autre';
  couleur_yeux?: string;
  signes_distinctifs?: string;
  handicaps_maladies?: string;
  groupe_sanguin?: string;
  derniers_vetements_portes?: string;
  accessoires?: string;
  photo_principale?: string;
  situation_familiale?: 'avec_famille' | 'orphelin' | 'separe_famille' | 'famille_inconnue' | 'autre';
  nombre_enfants?: number;
  statut_identite?: 'identifie' | 'partiellement_identifie' | 'non_identifie';
  fiabilite_informations?: 'confirmee' | 'probable' | 'incertaine';
}

export interface PersonneFilter {
  sexe?: 'masculin' | 'feminin' | 'inconnu' | 'non_precise';
  ageMin?: number;
  ageMax?: number;
  nationalite?: string;
  search?: string;
  sortBy?: 'nom' | 'created_at' | 'age_estime_min';
  sortOrder?: 'asc' | 'desc';
}

export interface PersonneStats {
  total: number;
  parSexe: {
    masculin: number;
    feminin: number;
    inconnu: number;
    non_precise: number;
  };
  parNationalite: Record<string, number>;
  parStatutIdentite: {
    identifie: number;
    partiellement_identifie: number;
    non_identifie: number;
  };
  agesMoyens: {
    min: number;
    max: number;
  };
}

export interface PersonneState {
  personnes: Personne[];
  selectedPersonne: Personne | null;
  photos: PersonnePhoto[];
  filions: LienFiliation[];
  isLoading: boolean;
  error: string | null;
  filter: PersonneFilter;
  pagination: {
    currentPage: number;
    pageSize: number;
    total: number;
  };
  stats: PersonneStats | null;
}
