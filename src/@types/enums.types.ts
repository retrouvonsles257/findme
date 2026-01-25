/**
 * =====================================================
 * RETROUVONSLES - Types Enums TypeScript
 * Correspondance avec les ENUMs PostgreSQL de Supabase
 * =====================================================
 */

// ============================================
// ORGANISATION & UTILISATEURS
// ============================================

export enum TypeOrganisation {
  POLICE = 'police',
  GENDARMERIE = 'gendarmerie',
  ONG_HUMANITAIRE = 'ong_humanitaire',
  CROIX_ROUGE = 'croix_rouge',
  PROTECTION_CIVILE = 'protection_civile',
  UNICEF = 'unicef',
  GOUVERNEMENT = 'gouvernement',
  AUTRE = 'autre'
}

export enum NomRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN_ORGANISATION = 'admin_organisation',
  OFFICIER_POLICE = 'officier_police',
  AGENT_GENDARMERIE = 'agent_gendarmerie',
  RESPONSABLE_ONG = 'responsable_ong',
  OPERATEUR_SAISIE = 'operateur_saisie',
  MODERATEUR = 'moderateur',
  CITOYEN_VERIFIE = 'citoyen_verifie',
  CITOYEN_STANDARD = 'citoyen_standard'
}

export enum StatutCompte {
  ACTIF = 'actif',
  SUSPENDU = 'suspendu',
  EN_ATTENTE_VERIFICATION = 'en_attente_verification',
  DESACTIVE = 'desactive',
  BLOQUE = 'bloque'
}

export enum TypeCompte {
  AUTORITE = 'autorite',
  GRAND_PUBLIC = 'grand_public'
}

// ============================================
// PERSONNE - CARACTÉRISTIQUES PHYSIQUES
// ============================================

export enum Sexe {
  MASCULIN = 'masculin',
  FEMININ = 'feminin',
  INCONNU = 'inconnu',
  NON_PRECISE = 'non_precise'
}

export enum TypeIdentification {
  CNI = 'cni',
  PASSEPORT = 'passeport',
  ACTE_NAISSANCE = 'acte_naissance',
  AUCUN = 'aucun',
  AUTRE = 'autre'
}

export enum Corpulence {
  MINCE = 'mince',
  MOYENNE = 'moyenne',
  FORTE = 'forte',
  ATHLETIQUE = 'athletique',
  INCONNUE = 'inconnue'
}

export enum CouleurPeau {
  CLAIRE = 'claire',
  MATE = 'mate',
  FONCEE = 'foncee',
  TRES_FONCEE = 'tres_foncee',
  INCONNUE = 'inconnue'
}

export enum TypeCheveux {
  COURTS = 'courts',
  LONGS = 'longs',
  FRISES = 'frises',
  RAIDES = 'raides',
  TRESSES = 'tresses',
  RASES = 'rases',
  AUTRE = 'autre'
}

export enum SituationFamiliale {
  AVEC_FAMILLE = 'avec_famille',
  ORPHELIN = 'orphelin',
  SEPARE_FAMILLE = 'separe_famille',
  FAMILLE_INCONNUE = 'famille_inconnue',
  AUTRE = 'autre'
}

export enum StatutIdentite {
  IDENTIFIE = 'identifie',
  PARTIELLEMENT_IDENTIFIE = 'partiellement_identifie',
  NON_IDENTIFIE = 'non_identifie'
}

export enum FiabiliteInformations {
  CONFIRMEE = 'confirmee',
  PROBABLE = 'probable',
  INCERTAINE = 'incertaine'
}

// ============================================
// FILIATION
// ============================================

export enum TypeLienFiliation {
  PERE_BIOLOGIQUE = 'pere_biologique',
  MERE_BIOLOGIQUE = 'mere_biologique',
  PERE_ADOPTIF = 'pere_adoptif',
  MERE_ADOPTIVE = 'mere_adoptive',
  ENFANT_BIOLOGIQUE = 'enfant_biologique',
  ENFANT_ADOPTIF = 'enfant_adoptif',
  CONJOINT = 'conjoint',
  FRERE_BIOLOGIQUE = 'frere_biologique',
  SOEUR_BIOLOGIQUE = 'soeur_biologique',
  DEMI_FRERE = 'demi_frere',
  DEMI_SOEUR = 'demi_soeur',
  GRAND_PERE_PATERNEL = 'grand_pere_paternel',
  GRAND_MERE_PATERNELLE = 'grand_mere_paternelle',
  GRAND_PERE_MATERNEL = 'grand_pere_maternel',
  GRAND_MERE_MATERNELLE = 'grand_mere_maternelle',
  PETIT_FILS = 'petit_fils',
  PETITE_FILLE = 'petite_fille',
  ONCLE_PATERNEL = 'oncle_paternel',
  TANTE_PATERNELLE = 'tante_paternelle',
  ONCLE_MATERNEL = 'oncle_maternel',
  TANTE_MATERNEL = 'tante_maternel',
  NEVEU = 'neveu',
  NIECE = 'niece',
  COUSIN_GERMAIN = 'cousin_germain',
  COUSINE_GERMAINE = 'cousine_germaine',
  TUTEUR_LEGAL = 'tuteur_legal',
  PUPILLE = 'pupille',
  AUTRE = 'autre'
}

export enum NatureFiliation {
  BIOLOGIQUE = 'biologique',
  ADOPTIVE = 'adoptive',
  PAR_ALLIANCE = 'par_alliance',
  TUTELLE_LEGALE = 'tutelle_legale',
  GARDE_PARTAGEE = 'garde_partagee',
  INCONNUE = 'inconnue'
}

export enum StatutVerification {
  CONFIRME_OFFICIELLEMENT = 'confirme_officiellement',
  CONFIRME_GENETIQUEMENT = 'confirme_genetiquement',
  DECLARE_FAMILLE = 'declare_famille',
  SUPPOSE_IA = 'suppose_ia',
  EN_VERIFICATION = 'en_verification',
  CONTESTE = 'conteste',
  INVALIDE = 'invalide'
}

export enum TypePreuve {
  ACTE_NAISSANCE = 'acte_naissance',
  LIVRET_FAMILLE = 'livret_famille',
  JUGEMENT_ADOPTION = 'jugement_adoption',
  TEST_ADN = 'test_adn',
  TEMOIGNAGES = 'temoignages',
  RECONNAISSANCE_IA = 'reconnaissance_ia',
  DOCUMENTS_IDENTITE = 'documents_identite',
  AUTRE = 'autre',
  AUCUNE = 'aucune'
}

export enum AutoriteParentale {
  LES_DEUX_PARENTS = 'les_deux_parents',
  MERE_SEULE = 'mere_seule',
  PERE_SEUL = 'pere_seul',
  TUTEUR = 'tuteur',
  GARDE_ALTERNEE = 'garde_alternee',
  INSTITUTION = 'institution',
  NON_APPLICABLE = 'non_applicable',
  INCONNUE = 'inconnue'
}

// ============================================
// DOSSIER DISPARITION
// ============================================

export enum TypeDisparition {
  FUGUE = 'fugue',
  ENLEVEMENT_PRESUME = 'enlevement_presume',
  ACCIDENT = 'accident',
  CONFLIT_ARME = 'conflit_arme',
  MIGRATION = 'migration',
  CATASTROPHE_NATURELLE = 'catastrophe_naturelle',
  DISPARITION_VOLONTAIRE = 'disparition_volontaire',
  INCONNUE = 'inconnue',
  AUTRE = 'autre'
}

export enum StatutDossier {
  EN_COURS = 'en_cours',
  RETROUVE_VIVANT = 'retrouve_vivant',
  RETROUVE_DECEDE = 'retrouve_decede',
  SUSPENDU = 'suspendu',
  CLASSE_SANS_SUITE = 'classe_sans_suite',
  TRANSFERE = 'transfere'
}

export enum NiveauUrgence {
  CRITIQUE = 'critique',
  URGENT = 'urgent',
  NORMAL = 'normal',
  FAIBLE = 'faible'
}

export enum EtatPersonneRetrouvee {
  BONNE_SANTE = 'bonne_sante',
  BLESSE = 'blesse',
  HOSPITALISE = 'hospitalise',
  DECEDE = 'decede',
  TRAUMATISE = 'traumatise',
  NON_APPLICABLE = 'non_applicable'
}

export enum PrecisionLieu {
  EXACTE = 'exacte',
  APPROXIMATIVE = 'approximative',
  INCONNUE = 'inconnue'
}

// ============================================
// PHOTO
// ============================================

export enum TypePhoto {
  PORTRAIT = 'portrait',
  CORPS_ENTIER = 'corps_entier',
  SIGNALEMENT = 'signalement',
  LIEU_DISPARITION = 'lieu_disparition',
  OBJET_PERSONNEL = 'objet_personnel',
  DOCUMENT = 'document',
  AUTRE = 'autre'
}

export enum QualiteImage {
  EXCELLENTE = 'excellente',
  BONNE = 'bonne',
  MOYENNE = 'moyenne',
  FAIBLE = 'faible'
}

// ============================================
// SIGNALEMENT
// ============================================

export enum NiveauCertitude {
  CERTAIN = 'certain',
  TRES_PROBABLE = 'tres_probable',
  PROBABLE = 'probable',
  INCERTAIN = 'incertain',
  DOUTE = 'doute'
}

export enum DistanceObservation {
  TRES_PROCHE = 'tres_proche',
  PROCHE = 'proche',
  MOYENNE = 'moyenne',
  LOINTAINE = 'lointaine'
}

export enum StatutValidation {
  EN_ATTENTE = 'en_attente',
  EN_VERIFICATION = 'en_verification',
  VALIDE = 'valide',
  INVALIDE = 'invalide',
  DOUBLONNE = 'doublonne',
  SPAM = 'spam'
}

export enum PrioriteTraitement {
  HAUTE = 'haute',
  MOYENNE = 'moyenne',
  BASSE = 'basse'
}

export enum SourceSignalement {
  APPLICATION_MOBILE = 'application_mobile',
  APPLICATION_WEB = 'application_web',
  HOTLINE = 'hotline',
  EMAIL = 'email',
  RESEAU_SOCIAL = 'reseau_social',
  AUTRE = 'autre'
}

// ============================================
// LOCALISATION
// ============================================

export enum SourceLocalisation {
  GPS_MOBILE = 'gps_mobile',
  TEMOIGNAGE = 'temoignage',
  CAMERA_SURVEILLANCE = 'camera_surveillance',
  PREDICTION_IA = 'prediction_ia',
  DOCUMENT_OFFICIEL = 'document_officiel',
  AUTRE = 'autre'
}

export enum FiabiliteSource {
  HAUTE = 'haute',
  MOYENNE = 'moyenne',
  FAIBLE = 'faible'
}

export enum TypeLocalisation {
  DISPARITION = 'disparition',
  DERNIERE_OBSERVATION = 'derniere_observation',
  SIGNALEMENT = 'signalement',
  DECOUVERTE = 'decouverte',
  PREDICTION = 'prediction',
  AUTRE = 'autre'
}

// ============================================
// ALERTE
// ============================================

export enum TypeAlerte {
  AMBER_ALERT = 'amber_alert',
  DISPARITION_ENFANT = 'disparition_enfant',
  DISPARITION_ADULTE_VULNERABLE = 'disparition_adulte_vulnerable',
  DISPARITION_STANDARD = 'disparition_standard',
  MISE_A_JOUR = 'mise_a_jour',
  PERSONNE_RETROUVEE = 'personne_retrouvee'
}

export enum StatutAlerte {
  BROUILLON = 'brouillon',
  PROGRAMMEE = 'programmee',
  EN_COURS = 'en_cours',
  TERMINEE = 'terminee',
  ANNULEE = 'annulee'
}

// ============================================
// INTELLIGENCE ARTIFICIELLE
// ============================================

export enum TypeAnalyse {
  RECONNAISSANCE_FACIALE = 'reconnaissance_faciale',
  COMPARAISON_PHOTOS = 'comparaison_photos',
  PREDICTION_LOCALISATION = 'prediction_localisation',
  DETECTION_SIMILITUDES = 'detection_similitudes',
  ANALYSE_BIOMETRIQUE = 'analyse_biometrique',
  REGROUPEMENT_CAS = 'regroupement_cas',
  ESTIMATION_AGE = 'estimation_age',
  ANALYSE_VETEMENTS = 'analyse_vetements',
  DETECTION_OBJETS = 'detection_objets',
  AUTRE = 'autre'
}

export enum StatutValidationIA {
  EN_ATTENTE = 'en_attente',
  CONFIRME = 'confirme',
  INFIRME = 'infirme',
  INCERTAIN = 'incertain',
  NECESSITE_VERIFICATION = 'necessite_verification'
}

export enum ActionGeneree {
  AUCUNE = 'aucune',
  ALERTE_CREEE = 'alerte_creee',
  SIGNALEMENT_PRIORITAIRE = 'signalement_prioritaire',
  NOTIFICATION_AUTORITES = 'notification_autorites',
  MISE_A_JOUR_DOSSIER = 'mise_a_jour_dossier',
  AUTRE = 'autre'
}

// ============================================
// JOURNAL & NOTIFICATIONS
// ============================================

export enum TypeAction {
  CREATION_DOSSIER = 'creation_dossier',
  MODIFICATION_DOSSIER = 'modification_dossier',
  CREATION_SIGNALEMENT = 'creation_signalement',
  VALIDATION_SIGNALEMENT = 'validation_signalement',
  DIFFUSION_ALERTE = 'diffusion_alerte',
  CONNEXION = 'connexion',
  DECONNEXION = 'deconnexion',
  MODIFICATION_PROFIL = 'modification_profil',
  UPLOAD_PHOTO = 'upload_photo',
  ANALYSE_IA = 'analyse_ia',
  VALIDATION_IA = 'validation_ia',
  CHANGEMENT_STATUT = 'changement_statut',
  ATTRIBUTION_ROLE = 'attribution_role',
  AUTRE = 'autre'
}

export enum TypeNotification {
  NOUVELLE_ALERTE = 'nouvelle_alerte',
  SIGNALEMENT_VALIDE = 'signalement_valide',
  MISE_A_JOUR_DOSSIER = 'mise_a_jour_dossier',
  PERSONNE_RETROUVEE = 'personne_retrouvee',
  CORRESPONDANCE_IA = 'correspondance_ia',
  MESSAGE_AUTORITE = 'message_autorite',
  RAPPEL = 'rappel',
  AUTRE = 'autre'
}

export enum CanalNotification {
  PUSH = 'push',
  EMAIL = 'email',
  SMS = 'sms',
  IN_APP = 'in_app'
}

export enum StatutEnvoi {
  EN_ATTENTE = 'en_attente',
  ENVOYEE = 'envoyee',
  ECHEC = 'echec',
  ANNULEE = 'annulee'
}

// ============================================
// COMMENTAIRES & DOCUMENTS
// ============================================

export enum TypeCommentaire {
  NOTE_ENQUETE = 'note_enquete',
  COORDINATION = 'coordination',
  INFO_COMPLEMENTAIRE = 'info_complementaire',
  MISE_A_JOUR = 'mise_a_jour',
  QUESTION = 'question',
  REPONSE = 'reponse',
  AUTRE = 'autre'
}

export enum TypeDocument {
  PLAINTE_OFFICIELLE = 'plainte_officielle',
  RAPPORT_POLICE = 'rapport_police',
  TEMOIGNAGE_ECRIT = 'temoignage_ecrit',
  CERTIFICAT_MEDICAL = 'certificat_medical',
  PIECE_IDENTITE = 'piece_identite',
  ACTE_NAISSANCE = 'acte_naissance',
  PHOTO_DOCUMENT = 'photo_document',
  CARTE_GEOGRAPHIQUE = 'carte_geographique',
  AUTRE = 'autre'
}

// ============================================
// STATISTIQUES & DONS
// ============================================

export enum TypePeriode {
  JOUR = 'jour',
  SEMAINE = 'semaine',
  MOIS = 'mois',
  TRIMESTRE = 'trimestre',
  ANNEE = 'annee'
}

export enum TypeDon {
  PONCTUEL = 'ponctuel',
  MENSUEL = 'mensuel',
  ANNUEL = 'annuel',
  ENTREPRISE = 'entreprise',
  FONDATION = 'fondation'
}

export enum MethodePaiement {
  CARTE_BANCAIRE = 'carte_bancaire',
  MOBILE_MONEY = 'mobile_money',
  VIREMENT = 'virement',
  PAYPAL = 'paypal',
  AUTRE = 'autre'
}

export enum StatutPaiement {
  EN_ATTENTE = 'en_attente',
  REUSSI = 'reussi',
  ECHOUE = 'echoue',
  REMBOURSE = 'rembourse',
  ANNULE = 'annule'
}

// ============================================
// CAMPAGNES
// ============================================

export enum TypeCampagne {
  PREVENTION_FUGUE = 'prevention_fugue',
  SECURITE_ENFANTS = 'securite_enfants',
  VIGILANCE_COMMUNAUTAIRE = 'vigilance_communautaire',
  FORMATION_PREMIERS_SECOURS = 'formation_premiers_secours',
  SENSIBILISATION_GENERALE = 'sensibilisation_generale',
  COLLECTE_FONDS = 'collecte_fonds',
  AUTRE = 'autre'
}

export enum StatutCampagne {
  PLANIFIEE = 'planifiee',
  EN_COURS = 'en_cours',
  TERMINEE = 'terminee',
  ANNULEE = 'annulee'
}

export enum SourceInformation {
  DECLARATION_FAMILLE = 'declaration_famille',
  DOCUMENTS_OFFICIELS = 'documents_officiels',
  ENQUETE_POLICE = 'enquete_police',
  ANALYSE_IA = 'analyse_ia',
  RECOUPEMENT_BASES_DONNEES = 'recoupement_bases_donnees',
  AUTRE = 'autre'
}

// ============================================
// HELPERS - Conversion et Validation
// ============================================

/**
 * Récupère toutes les valeurs d'un enum
 */
export const getEnumValues = <T extends Record<string, string>>(enumObj: T): string[] => {
  return Object.values(enumObj);
};

/**
 * Vérifie si une valeur existe dans un enum
 */
export const isValidEnumValue = <T extends Record<string, string>>(
  enumObj: T,
  value: string
): value is T[keyof T] => {
  return Object.values(enumObj).includes(value);
};

/**
 * Récupère le label français d'une valeur enum
 */
export const getEnumLabel = (enumValue: string): string => {
  const labels: Record<string, string> = {
    // Organisations
    police: 'Police',
    gendarmerie: 'Gendarmerie',
    ong_humanitaire: 'ONG Humanitaire',
    croix_rouge: 'Croix-Rouge',
    protection_civile: 'Protection Civile',
    unicef: 'UNICEF',
    gouvernement: 'Gouvernement',
    
    // Rôles
    super_admin: 'Super Administrateur',
    admin_organisation: 'Administrateur Organisation',
    officier_police: 'Officier de Police',
    agent_gendarmerie: 'Agent de Gendarmerie',
    responsable_ong: 'Responsable ONG',
    operateur_saisie: 'Opérateur de Saisie',
    moderateur: 'Modérateur',
    citoyen_verifie: 'Citoyen Vérifié',
    citoyen_standard: 'Citoyen',
    
    // Statuts compte
    actif: 'Actif',
    suspendu: 'Suspendu',
    en_attente_verification: 'En attente de vérification',
    desactive: 'Désactivé',
    bloque: 'Bloqué',
    
    // Types disparition
    fugue: 'Fugue',
    enlevement_presume: 'Enlèvement présumé',
    accident: 'Accident',
    conflit_arme: 'Conflit armé',
    migration: 'Migration',
    catastrophe_naturelle: 'Catastrophe naturelle',
    disparition_volontaire: 'Disparition volontaire',
    
    // Statuts dossier
    en_cours: 'En cours',
    retrouve_vivant: 'Retrouvé(e) vivant(e)',
    retrouve_decede: 'Retrouvé(e) décédé(e)',
    classe_sans_suite: 'Classé sans suite',
    transfere: 'Transféré',
    
    // Niveaux urgence
    critique: 'Critique',
    urgent: 'Urgent',
    normal: 'Normal',
    faible: 'Faible',
    
    // Sexe
    masculin: 'Masculin',
    feminin: 'Féminin',
    inconnu: 'Inconnu',
    non_precise: 'Non précisé',
    
    // Par défaut
    autre: 'Autre',
    inconnue: 'Inconnue'
  };
  
  return labels[enumValue] || enumValue;
};

/**
 * Type helper pour les options de select
 */
export interface EnumOption {
  value: string;
  label: string;
}

/**
 * Convertit un enum en options pour un select
 */
export const enumToOptions = <T extends Record<string, string>>(
  enumObj: T
): EnumOption[] => {
  return Object.values(enumObj).map(value => ({
    value,
    label: getEnumLabel(value)
  }));
};