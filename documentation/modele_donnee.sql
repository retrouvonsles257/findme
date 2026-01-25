-- =====================================================
-- RETROUVONSLES - SCHÉMA SUPABASE COMPLET (PostgreSQL)
-- Application de recherche de personnes disparues
-- Version: 1.0.0
-- =====================================================

-- Activation des extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- TYPES ENUM PostgreSQL
-- =====================================================

CREATE TYPE type_organisation AS ENUM (
    'police', 'gendarmerie', 'ong_humanitaire', 
    'croix_rouge', 'protection_civile', 'unicef',
    'gouvernement', 'autre'
);

CREATE TYPE nom_role AS ENUM (
    'super_admin', 'admin_organisation', 'officier_police',
    'agent_gendarmerie', 'responsable_ong', 'operateur_saisie',
    'moderateur', 'citoyen_verifie', 'citoyen_standard'
);

CREATE TYPE statut_compte AS ENUM (
    'actif', 'suspendu', 'en_attente_verification', 
    'desactive', 'bloque'
);

CREATE TYPE type_compte AS ENUM ('autorite', 'grand_public');
CREATE TYPE sexe AS ENUM ('masculin', 'feminin', 'inconnu', 'non_precise');
CREATE TYPE type_identification AS ENUM ('cni', 'passeport', 'acte_naissance', 'aucun', 'autre');
CREATE TYPE corpulence AS ENUM ('mince', 'moyenne', 'forte', 'athletique', 'inconnue');
CREATE TYPE couleur_peau AS ENUM ('claire', 'mate', 'foncee', 'tres_foncee', 'inconnue');
CREATE TYPE type_cheveux AS ENUM ('courts', 'longs', 'frises', 'raides', 'tresses', 'rases', 'autre');

CREATE TYPE situation_familiale AS ENUM (
    'avec_famille', 'orphelin', 'separe_famille', 'famille_inconnue', 'autre'
);

CREATE TYPE statut_identite AS ENUM ('identifie', 'partiellement_identifie', 'non_identifie');
CREATE TYPE fiabilite_informations AS ENUM ('confirmee', 'probable', 'incertaine');

CREATE TYPE type_lien_filiation AS ENUM (
    'pere_biologique', 'mere_biologique', 'pere_adoptif', 'mere_adoptive',
    'enfant_biologique', 'enfant_adoptif', 'conjoint', 
    'frere_biologique', 'soeur_biologique', 'demi_frere', 'demi_soeur',
    'grand_pere_paternel', 'grand_mere_paternelle', 
    'grand_pere_maternel', 'grand_mere_maternelle',
    'petit_fils', 'petite_fille', 'oncle_paternel', 'tante_paternelle',
    'oncle_maternel', 'tante_maternel', 'neveu', 'niece',
    'cousin_germain', 'cousine_germaine', 'tuteur_legal', 'pupille', 'autre'
);

CREATE TYPE nature_filiation AS ENUM (
    'biologique', 'adoptive', 'par_alliance', 'tutelle_legale', 'garde_partagee', 'inconnue'
);

CREATE TYPE statut_verification AS ENUM (
    'confirme_officiellement', 'confirme_genetiquement', 'declare_famille',
    'suppose_ia', 'en_verification', 'conteste', 'invalide'
);

CREATE TYPE type_preuve AS ENUM (
    'acte_naissance', 'livret_famille', 'jugement_adoption', 'test_adn',
    'temoignages', 'reconnaissance_ia', 'documents_identite', 'autre', 'aucune'
);

CREATE TYPE autorite_parentale AS ENUM (
    'les_deux_parents', 'mere_seule', 'pere_seul', 'tuteur',
    'garde_alternee', 'institution', 'non_applicable', 'inconnue'
);

CREATE TYPE type_disparition AS ENUM (
    'fugue', 'enlevement_presume', 'accident', 'conflit_arme',
    'migration', 'catastrophe_naturelle', 'disparition_volontaire', 'inconnue', 'autre'
);

CREATE TYPE statut_dossier AS ENUM (
    'en_cours', 'retrouve_vivant', 'retrouve_decede',
    'suspendu', 'classe_sans_suite', 'transfere'
);

CREATE TYPE niveau_urgence AS ENUM ('critique', 'urgent', 'normal', 'faible');

CREATE TYPE etat_personne_retrouvee AS ENUM (
    'bonne_sante', 'blesse', 'hospitalise', 'decede', 'traumatise', 'non_applicable'
);

CREATE TYPE type_photo AS ENUM (
    'portrait', 'corps_entier', 'signalement', 'lieu_disparition',
    'objet_personnel', 'document', 'autre'
);

CREATE TYPE qualite_image AS ENUM ('excellente', 'bonne', 'moyenne', 'faible');
CREATE TYPE niveau_certitude AS ENUM ('certain', 'tres_probable', 'probable', 'incertain', 'doute');
CREATE TYPE distance_observation AS ENUM ('tres_proche', 'proche', 'moyenne', 'lointaine');

CREATE TYPE statut_validation AS ENUM (
    'en_attente', 'en_verification', 'valide', 'invalide', 'doublonne', 'spam'
);

CREATE TYPE priorite_traitement AS ENUM ('haute', 'moyenne', 'basse');

CREATE TYPE source_signalement AS ENUM (
    'application_mobile', 'application_web', 'hotline', 'email', 'reseau_social', 'autre'
);

CREATE TYPE source_localisation AS ENUM (
    'gps_mobile', 'temoignage', 'camera_surveillance',
    'prediction_ia', 'document_officiel', 'autre'
);

CREATE TYPE fiabilite_source AS ENUM ('haute', 'moyenne', 'faible');

CREATE TYPE type_localisation AS ENUM (
    'disparition', 'derniere_observation', 'signalement',
    'decouverte', 'prediction', 'autre'
);

CREATE TYPE type_alerte AS ENUM (
    'amber_alert', 'disparition_enfant', 'disparition_adulte_vulnerable',
    'disparition_standard', 'mise_a_jour', 'personne_retrouvee'
);

CREATE TYPE statut_alerte AS ENUM ('brouillon', 'programmee', 'en_cours', 'terminee', 'annulee');

CREATE TYPE type_analyse AS ENUM (
    'reconnaissance_faciale', 'comparaison_photos', 'prediction_localisation',
    'detection_similitudes', 'analyse_biometrique', 'regroupement_cas',
    'estimation_age', 'analyse_vetements', 'detection_objets', 'autre'
);

CREATE TYPE statut_validation_ia AS ENUM (
    'en_attente', 'confirme', 'infirme', 'incertain', 'necessite_verification'
);

CREATE TYPE action_generee AS ENUM (
    'aucune', 'alerte_creee', 'signalement_prioritaire',
    'notification_autorites', 'mise_a_jour_dossier', 'autre'
);

CREATE TYPE type_action AS ENUM (
    'creation_dossier', 'modification_dossier', 'creation_signalement',
    'validation_signalement', 'diffusion_alerte', 'connexion', 'deconnexion',
    'modification_profil', 'upload_photo', 'analyse_ia', 'validation_ia',
    'changement_statut', 'attribution_role', 'autre'
);

CREATE TYPE type_notification AS ENUM (
    'nouvelle_alerte', 'signalement_valide', 'mise_a_jour_dossier',
    'personne_retrouvee', 'correspondance_ia', 'message_autorite', 'rappel', 'autre'
);

CREATE TYPE canal_notification AS ENUM ('push', 'email', 'sms', 'in_app');
CREATE TYPE statut_envoi AS ENUM ('en_attente', 'envoyee', 'echec', 'annulee');

CREATE TYPE type_commentaire AS ENUM (
    'note_enquete', 'coordination', 'info_complementaire',
    'mise_a_jour', 'question', 'reponse', 'autre'
);

CREATE TYPE type_document AS ENUM (
    'plainte_officielle', 'rapport_police', 'temoignage_ecrit',
    'certificat_medical', 'piece_identite', 'acte_naissance',
    'photo_document', 'carte_geographique', 'autre'
);

CREATE TYPE type_periode AS ENUM ('jour', 'semaine', 'mois', 'trimestre', 'annee');

CREATE TYPE type_don AS ENUM ('ponctuel', 'mensuel', 'annuel', 'entreprise', 'fondation');

CREATE TYPE methode_paiement AS ENUM (
    'carte_bancaire', 'mobile_money', 'virement', 'paypal', 'autre'
);

CREATE TYPE statut_paiement AS ENUM (
    'en_attente', 'reussi', 'echoue', 'rembourse', 'annule'
);

CREATE TYPE type_campagne AS ENUM (
    'prevention_fugue', 'securite_enfants', 'vigilance_communautaire',
    'formation_premiers_secours', 'sensibilisation_generale', 'collecte_fonds', 'autre'
);

CREATE TYPE statut_campagne AS ENUM ('planifiee', 'en_cours', 'terminee', 'annulee');
CREATE TYPE precision_lieu AS ENUM ('exacte', 'approximative', 'inconnue');

CREATE TYPE source_information AS ENUM (
    'declaration_famille', 'documents_officiels', 'enquete_police',
    'analyse_ia', 'recoupement_bases_donnees', 'autre'
);

-- =====================================================
-- TABLES PRINCIPALES
-- =====================================================

-- TABLE: ORGANISATION
CREATE TABLE organisation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(150) NOT NULL,
    type_organisation type_organisation NOT NULL,
    pays VARCHAR(100) NOT NULL DEFAULT 'Cameroun',
    region VARCHAR(100),
    ville VARCHAR(100),
    adresse TEXT,
    contact_officiel VARCHAR(150),
    telephone VARCHAR(30),
    email VARCHAR(150),
    site_web VARCHAR(255),
    statut_actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_organisation_type ON organisation(type_organisation);
CREATE INDEX idx_organisation_pays ON organisation(pays);
CREATE INDEX idx_organisation_statut ON organisation(statut_actif);

-- TABLE: ROLE
CREATE TABLE role (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom_role nom_role NOT NULL UNIQUE,
    niveau_accreditation SMALLINT NOT NULL,
    description TEXT,
    permissions JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_role_niveau ON role(niveau_accreditation);

-- TABLE: UTILISATEUR
CREATE TABLE utilisateur (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    telephone VARCHAR(30),
    statut_compte statut_compte DEFAULT 'en_attente_verification',
    type_compte type_compte DEFAULT 'grand_public',
    photo_profil VARCHAR(255),
    date_naissance DATE,
    adresse TEXT,
    ville VARCHAR(100),
    region VARCHAR(100),
    pays VARCHAR(100) DEFAULT 'Cameroun',
    numero_badge VARCHAR(50),
    document_accreditation VARCHAR(255),
    latitude_actuelle DECIMAL(9,6),
    longitude_actuelle DECIMAL(9,6),
    rayon_notification_km DECIMAL(5,2) DEFAULT 50.00,
    preferences_notification JSONB,
    langue_preferee VARCHAR(10) DEFAULT 'fr',
    accepte_notifications BOOLEAN DEFAULT TRUE,
    accepte_geolocalisation BOOLEAN DEFAULT FALSE,
    score_fiabilite DECIMAL(5,2) DEFAULT 100.00,
    nombre_signalements_valides INT DEFAULT 0,
    nombre_signalements_invalides INT DEFAULT 0,
    derniere_connexion TIMESTAMPTZ,
    derniere_maj_localisation TIMESTAMPTZ,
    ip_derniere_connexion INET,
    id_organisation UUID REFERENCES organisation(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_utilisateur_email ON utilisateur(email);
CREATE INDEX idx_utilisateur_statut ON utilisateur(statut_compte);
CREATE INDEX idx_utilisateur_type ON utilisateur(type_compte);
CREATE INDEX idx_utilisateur_organisation ON utilisateur(id_organisation);

-- TABLE: UTILISATEUR_ROLE
CREATE TABLE utilisateur_role (
    id_utilisateur UUID REFERENCES utilisateur(id) ON DELETE CASCADE,
    id_role UUID REFERENCES role(id) ON DELETE CASCADE,
    date_attribution TIMESTAMPTZ DEFAULT NOW(),
    date_expiration TIMESTAMPTZ,
    attribue_par UUID REFERENCES utilisateur(id) ON DELETE SET NULL,
    commentaire TEXT,
    PRIMARY KEY (id_utilisateur, id_role)
);

CREATE INDEX idx_utilisateur_role_expiration ON utilisateur_role(date_expiration);

-- TABLE: PERSONNE
CREATE TABLE personne (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom VARCHAR(100),
    prenom VARCHAR(100),
    nom_complet VARCHAR(255),
    alias TEXT,
    sexe sexe DEFAULT 'non_precise',
    date_naissance DATE,
    age_estime_min SMALLINT,
    age_estime_max SMALLINT,
    nationalite VARCHAR(100) DEFAULT 'Camerounaise',
    autres_nationalites TEXT,
    langue_parlee TEXT,
    numero_identification VARCHAR(100),
    type_identification type_identification,
    description_physique TEXT,
    taille_cm SMALLINT,
    poids_kg SMALLINT,
    corpulence corpulence,
    couleur_peau couleur_peau,
    couleur_cheveux VARCHAR(50),
    type_cheveux type_cheveux,
    couleur_yeux VARCHAR(50),
    signes_distinctifs TEXT,
    handicaps_maladies TEXT,
    groupe_sanguin VARCHAR(5),
    derniers_vetements_portes TEXT,
    accessoires TEXT,
    donnees_biometriques JSONB,
    photo_principale VARCHAR(255),
    situation_familiale situation_familiale,
    nombre_enfants SMALLINT,
    statut_identite statut_identite DEFAULT 'identifie',
    fiabilite_informations fiabilite_informations DEFAULT 'probable',
    cree_par UUID REFERENCES utilisateur(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_personne_nom_prenom ON personne(nom, prenom);
CREATE INDEX idx_personne_sexe ON personne(sexe);
CREATE INDEX idx_personne_nationalite ON personne(nationalite);
CREATE INDEX idx_personne_age ON personne(age_estime_min, age_estime_max);
CREATE INDEX idx_personne_description ON personne USING gin(to_tsvector('french', description_physique));

-- TABLE: LIEN_FILIATION
CREATE TABLE lien_filiation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type_lien type_lien_filiation NOT NULL,
    id_personne_source UUID REFERENCES personne(id) ON DELETE CASCADE,
    id_personne_cible UUID REFERENCES personne(id) ON DELETE CASCADE,
    precision_lien VARCHAR(255),
    nature_filiation nature_filiation DEFAULT 'biologique',
    compatibilite_genetique_probable BOOLEAN,
    score_compatibilite_physique DECIMAL(5,2),
    caracteristiques_communes JSONB,
    donnees_genetiques_disponibles BOOLEAN DEFAULT FALSE,
    hash_adn_source VARCHAR(255),
    hash_adn_cible VARCHAR(255),
    statut_verification statut_verification DEFAULT 'declare_famille',
    type_preuve type_preuve DEFAULT 'aucune',
    document_justificatif VARCHAR(255),
    numero_acte_officiel VARCHAR(100),
    autorite_emettrice VARCHAR(150),
    date_etablissement_lien DATE,
    autorite_parentale autorite_parentale,
    situation_familiale TEXT,
    generation INT DEFAULT 0,
    ligne_directe BOOLEAN DEFAULT FALSE,
    personne_contact_principal BOOLEAN DEFAULT FALSE,
    telephone_contact VARCHAR(30),
    email_contact VARCHAR(150),
    adresse_contact TEXT,
    cree_par UUID REFERENCES utilisateur(id) ON DELETE SET NULL,
    modifie_par UUID REFERENCES utilisateur(id) ON DELETE SET NULL,
    source_information source_information DEFAULT 'declaration_famille',
    commentaire TEXT,
    confidentiel BOOLEAN DEFAULT FALSE,
    visible_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(id_personne_source, id_personne_cible, type_lien)
);

CREATE INDEX idx_lien_source ON lien_filiation(id_personne_source);
CREATE INDEX idx_lien_cible ON lien_filiation(id_personne_cible);
CREATE INDEX idx_lien_type ON lien_filiation(type_lien);
CREATE INDEX idx_lien_statut ON lien_filiation(statut_verification);

-- TABLE: DOSSIER_DISPARITION
CREATE TABLE dossier_disparition (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_dossier VARCHAR(50) UNIQUE NOT NULL,
    date_disparition TIMESTAMPTZ NOT NULL,
    date_derniere_observation TIMESTAMPTZ,
    lieu_disparition VARCHAR(255),
    ville_disparition VARCHAR(100),
    region_disparition VARCHAR(100),
    pays_disparition VARCHAR(100) DEFAULT 'Cameroun',
    latitude_disparition DECIMAL(9,6),
    longitude_disparition DECIMAL(9,6),
    point_disparition GEOGRAPHY(POINT),
    precision_lieu precision_lieu DEFAULT 'approximative',
    circonstances TEXT NOT NULL,
    type_disparition type_disparition NOT NULL,
    contexte_specifique TEXT,
    personnes_accompagnantes TEXT,
    derniere_activite_connue VARCHAR(255), -- CORRECTION: Changé le nom pour éviter le doublon
    destination_prevue VARCHAR(255),
    moyen_transport VARCHAR(100),
    statut_dossier statut_dossier DEFAULT 'en_cours',
    sous_statut VARCHAR(100),
    niveau_urgence niveau_urgence DEFAULT 'normal',
    score_priorite INT,
    zone_recherche_predite JSONB,
    probabilite_localisation JSONB,
    facteurs_risque JSONB,
    dossiers_similaires JSONB,
    autorite_saisie VARCHAR(255),
    numero_plainte VARCHAR(100),
    enqueteur_responsable VARCHAR(255),
    contact_enqueteur VARCHAR(150),
    contact_famille_principale VARCHAR(150),
    telephone_contact VARCHAR(30),
    email_contact VARCHAR(150),
    visible_public BOOLEAN DEFAULT TRUE,
    diffusion_autorisee BOOLEAN DEFAULT TRUE,
    diffusion_medias BOOLEAN DEFAULT FALSE,
    diffusion_reseaux_sociaux BOOLEAN DEFAULT TRUE,
    rayon_diffusion_km DECIMAL(6,2) DEFAULT 100.00,
    zones_diffusion_prioritaire TEXT,
    date_resolution TIMESTAMPTZ,
    lieu_decouverte VARCHAR(255),
    latitude_decouverte DECIMAL(9,6),
    longitude_decouverte DECIMAL(9,6),
    point_decouverte GEOGRAPHY(POINT),
    circonstances_resolution TEXT,
    etat_personne_retrouvee etat_personne_retrouvee,
    nombre_signalements INT DEFAULT 0,
    nombre_alertes_diffusees INT DEFAULT 0,
    nombre_vues_fiche INT DEFAULT 0,
    id_personne UUID REFERENCES personne(id) ON DELETE RESTRICT,
    id_utilisateur_createur UUID REFERENCES utilisateur(id) ON DELETE RESTRICT,
    id_organisation_responsable UUID REFERENCES organisation(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    derniere_activite TIMESTAMPTZ DEFAULT NOW() -- CORRECTION: Gardé comme TIMESTAMPTZ
);

CREATE INDEX idx_dossier_numero ON dossier_disparition(numero_dossier);
CREATE INDEX idx_dossier_date ON dossier_disparition(date_disparition);
CREATE INDEX idx_dossier_statut ON dossier_disparition(statut_dossier);
CREATE INDEX idx_dossier_urgence ON dossier_disparition(niveau_urgence);
CREATE INDEX idx_dossier_lieu ON dossier_disparition(ville_disparition, region_disparition);
CREATE INDEX idx_dossier_type ON dossier_disparition(type_disparition);
CREATE INDEX idx_dossier_personne ON dossier_disparition(id_personne);
CREATE INDEX idx_dossier_visible ON dossier_disparition(visible_public);
CREATE INDEX idx_dossier_circonstances ON dossier_disparition USING gin(to_tsvector('french', circonstances));
CREATE INDEX idx_dossier_point ON dossier_disparition USING GIST(point_disparition);

-- TABLE: SIGNALEMENT (forward reference pour photo)
CREATE TABLE signalement (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_signalement VARCHAR(50) UNIQUE,
    description TEXT NOT NULL,
    date_observation TIMESTAMPTZ NOT NULL,
    lieu_observation VARCHAR(255),
    ville_observation VARCHAR(100),
    region_observation VARCHAR(100),
    pays_observation VARCHAR(100) DEFAULT 'Cameroun',
    latitude_observation DECIMAL(9,6),
    longitude_observation DECIMAL(9,6),
    point_observation GEOGRAPHY(POINT),
    precision_localisation precision_lieu DEFAULT 'approximative',
    niveau_certitude niveau_certitude DEFAULT 'probable',
    distance_observation distance_observation,
    duree_observation VARCHAR(50),
    contexte_observation TEXT,
    etat_personne_observee TEXT,
    accompagnement TEXT,
    direction_deplacement VARCHAR(255),
    moyen_deplacement VARCHAR(100),
    statut_validation statut_validation DEFAULT 'en_attente',
    priorite_traitement priorite_traitement DEFAULT 'moyenne',
    score_pertinence DECIMAL(5,2),
    raisons_score JSONB,
    verifie_par UUID REFERENCES utilisateur(id) ON DELETE SET NULL,
    date_verification TIMESTAMPTZ,
    commentaire_verification TEXT,
    transmis_autorites BOOLEAN DEFAULT FALSE,
    date_transmission TIMESTAMPTZ,
    autorite_destinataire VARCHAR(255),
    actions_entreprises TEXT,
    temoin_anonyme BOOLEAN DEFAULT FALSE,
    nom_temoin VARCHAR(100),
    telephone_temoin VARCHAR(30),
    email_temoin VARCHAR(150),
    accepte_contact_suivi BOOLEAN DEFAULT TRUE,
    source_signalement source_signalement DEFAULT 'application_mobile',
    ip_signalement INET,
    user_agent TEXT,
    id_utilisateur UUID REFERENCES utilisateur(id) ON DELETE SET NULL,
    id_dossier UUID REFERENCES dossier_disparition(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_signalement_numero ON signalement(numero_signalement);
CREATE INDEX idx_signalement_dossier ON signalement(id_dossier);
CREATE INDEX idx_signalement_statut ON signalement(statut_validation);
CREATE INDEX idx_signalement_date ON signalement(date_observation);
CREATE INDEX idx_signalement_utilisateur ON signalement(id_utilisateur);
CREATE INDEX idx_signalement_description ON signalement USING gin(to_tsvector('french', description));
CREATE INDEX idx_signalement_point ON signalement USING GIST(point_observation);

-- TABLE: PHOTO
CREATE TABLE photo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url_cloudinary VARCHAR(255) NOT NULL,
    url_thumbnail VARCHAR(255),
    public_id_cloudinary VARCHAR(255),
    type_photo type_photo DEFAULT 'portrait',
    titre VARCHAR(255),
    description TEXT,
    date_prise DATE,
    lieu_prise VARCHAR(255),
    analyse_ia_effectuee BOOLEAN DEFAULT FALSE,
    vecteur_facial JSONB,
    caracteristiques_detectees JSONB,
    qualite_image qualite_image DEFAULT 'moyenne',
    taille_octets INT,
    format VARCHAR(10),
    largeur_px SMALLINT,
    hauteur_px SMALLINT,
    hash_image VARCHAR(64),
    est_principale BOOLEAN DEFAULT FALSE,
    visible_public BOOLEAN DEFAULT TRUE,
    approuvee BOOLEAN DEFAULT FALSE,
    moderee_par UUID REFERENCES utilisateur(id) ON DELETE SET NULL,
    date_moderation TIMESTAMPTZ,
    uploadee_par UUID REFERENCES utilisateur(id) ON DELETE SET NULL,
    id_personne UUID REFERENCES personne(id) ON DELETE CASCADE,
    id_signalement UUID REFERENCES signalement(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_photo_personne ON photo(id_personne);
CREATE INDEX idx_photo_signalement ON photo(id_signalement);
CREATE INDEX idx_photo_type ON photo(type_photo);
CREATE INDEX idx_photo_hash ON photo(hash_image);

-- TABLE: LOCALISATION
CREATE TABLE localisation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    latitude DECIMAL(9,6) NOT NULL,
    longitude DECIMAL(9,6) NOT NULL,
    point GEOGRAPHY(POINT) NOT NULL,
    precision_m INT,
    altitude_m INT,
    source_localisation source_localisation NOT NULL,
    fiabilite_source fiabilite_source DEFAULT 'moyenne',
    type_localisation type_localisation NOT NULL,
    adresse VARCHAR(255),
    ville VARCHAR(100),
    region VARCHAR(100),
    pays VARCHAR(100),
    point_interet VARCHAR(255),
    description TEXT,
    date_localisation TIMESTAMPTZ NOT NULL,
    id_dossier UUID REFERENCES dossier_disparition(id) ON DELETE CASCADE,
    id_signalement UUID REFERENCES signalement(id) ON DELETE CASCADE,
    enregistree_par UUID REFERENCES utilisateur(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_localisation_point ON localisation USING GIST(point);
CREATE INDEX idx_localisation_dossier ON localisation(id_dossier);
CREATE INDEX idx_localisation_signalement ON localisation(id_signalement);
CREATE INDEX idx_localisation_date ON localisation(date_localisation);
CREATE INDEX idx_localisation_type ON localisation(type_localisation);

-- TABLE: ALERTE
CREATE TABLE alerte (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_alerte VARCHAR(50) UNIQUE,
    titre VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    message_court VARCHAR(500),
    type_alerte type_alerte NOT NULL,
    latitude_centre DECIMAL(9,6),
    longitude_centre DECIMAL(9,6),
    point_centre GEOGRAPHY(POINT),
    rayon_km DECIMAL(5,2) DEFAULT 50.00,
    zones_specifiques JSONB,
    date_diffusion TIMESTAMPTZ NOT NULL,
    date_expiration TIMESTAMPTZ,
    canaux_diffusion JSONB,
    statut_alerte statut_alerte DEFAULT 'brouillon',
    niveau_urgence_min SMALLINT DEFAULT 1,
    types_utilisateurs JSONB,
    nombre_destinataires INT DEFAULT 0,
    nombre_envois_reussis INT DEFAULT 0,
    nombre_vues INT DEFAULT 0,
    nombre_partages INT DEFAULT 0,
    nombre_signalements_generes INT DEFAULT 0,
    validee BOOLEAN DEFAULT FALSE,
    id_utilisateur_validateur UUID REFERENCES utilisateur(id) ON DELETE SET NULL,
    date_validation TIMESTAMPTZ,
    commentaire_validation TEXT,
    id_dossier UUID REFERENCES dossier_disparition(id) ON DELETE CASCADE,
    id_utilisateur_createur UUID REFERENCES utilisateur(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alerte_numero ON alerte(numero_alerte);
CREATE INDEX idx_alerte_dossier ON alerte(id_dossier);
CREATE INDEX idx_alerte_statut ON alerte(statut_alerte);
CREATE INDEX idx_alerte_date ON alerte(date_diffusion);
CREATE INDEX idx_alerte_point ON alerte USING GIST(point_centre);

-- TABLE: RESULTAT_IA
CREATE TABLE resultat_ia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type_analyse type_analyse NOT NULL,
    score_confiance DECIMAL(5,2) NOT NULL,
    seuil_decision DECIMAL(5,2) DEFAULT 70.00,
    donnees_brutes JSONB NOT NULL,
    donnees_interpretees JSONB,
    correspondances_trouvees JSONB,
    zones_predites JSONB,
    facteurs_cles JSONB,
    modele_ia_utilise VARCHAR(100),
    version_algorithme VARCHAR(50),
    temps_traitement_ms INT,
    statut_validation statut_validation_ia DEFAULT 'en_attente',
    valide_par UUID REFERENCES utilisateur(id) ON DELETE SET NULL,
    date_validation TIMESTAMPTZ,
    commentaire_validation TEXT,
    action_generee action_generee DEFAULT 'aucune',
    faux_positif BOOLEAN,
    date_analyse TIMESTAMPTZ DEFAULT NOW(),
    id_photo UUID REFERENCES photo(id) ON DELETE CASCADE,
    id_dossier UUID REFERENCES dossier_disparition(id) ON DELETE CASCADE,
    id_signalement UUID REFERENCES signalement(id) ON DELETE CASCADE,
    declenche_par UUID REFERENCES utilisateur(id) ON DELETE SET NULL
);

CREATE INDEX idx_resultat_type ON resultat_ia(type_analyse);
CREATE INDEX idx_resultat_score ON resultat_ia(score_confiance);
CREATE INDEX idx_resultat_statut ON resultat_ia(statut_validation);
CREATE INDEX idx_resultat_photo ON resultat_ia(id_photo);
CREATE INDEX idx_resultat_dossier ON resultat_ia(id_dossier);
CREATE INDEX idx_resultat_date ON resultat_ia(date_analyse);

-- TABLE: JOURNAL_ACTIVITE
CREATE TABLE journal_activite (
    id BIGSERIAL PRIMARY KEY,
    type_action type_action NOT NULL,
    action_detaillee VARCHAR(255),
    description TEXT,
    donnees_avant JSONB,
    donnees_apres JSONB,
    ip_utilisateur INET,
    user_agent TEXT,
    localisation_action VARCHAR(255),
    date_action TIMESTAMPTZ DEFAULT NOW(),
    id_utilisateur UUID REFERENCES utilisateur(id) ON DELETE SET NULL,
    id_dossier UUID REFERENCES dossier_disparition(id) ON DELETE CASCADE,
    id_signalement UUID REFERENCES signalement(id) ON DELETE CASCADE,
    id_alerte UUID REFERENCES alerte(id) ON DELETE CASCADE
);

CREATE INDEX idx_journal_utilisateur ON journal_activite(id_utilisateur);
CREATE INDEX idx_journal_type ON journal_activite(type_action);
CREATE INDEX idx_journal_date ON journal_activite(date_action);
CREATE INDEX idx_journal_dossier ON journal_activite(id_dossier);

-- TABLE: NOTIFICATION
CREATE TABLE notification (
    id BIGSERIAL PRIMARY KEY,
    type_notification type_notification NOT NULL,
    titre VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    message_court VARCHAR(500),
    canal canal_notification NOT NULL,
    priorite priorite_traitement DEFAULT 'moyenne',
    lue BOOLEAN DEFAULT FALSE,
    date_lecture TIMESTAMPTZ,
    url_action VARCHAR(255),
    donnees_supplementaires JSONB,
    statut_envoi statut_envoi DEFAULT 'en_attente',
    code_erreur VARCHAR(100),
    tentatives_envoi SMALLINT DEFAULT 0,
    date_creation TIMESTAMPTZ DEFAULT NOW(),
    date_envoi TIMESTAMPTZ,
    id_utilisateur UUID REFERENCES utilisateur(id) ON DELETE CASCADE,
    id_dossier UUID REFERENCES dossier_disparition(id) ON DELETE CASCADE,
    id_alerte UUID REFERENCES alerte(id) ON DELETE CASCADE
);

CREATE INDEX idx_notification_utilisateur ON notification(id_utilisateur);
CREATE INDEX idx_notification_lue ON notification(lue);
CREATE INDEX idx_notification_type ON notification(type_notification);
CREATE INDEX idx_notification_statut ON notification(statut_envoi);
CREATE INDEX idx_notification_date ON notification(date_creation);

-- TABLE: COMMENTAIRE
CREATE TABLE commentaire (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contenu TEXT NOT NULL,
    type_commentaire type_commentaire DEFAULT 'note_enquete',
    confidentiel BOOLEAN DEFAULT TRUE,
    modifie BOOLEAN DEFAULT FALSE,
    id_dossier UUID REFERENCES dossier_disparition(id) ON DELETE CASCADE,
    id_utilisateur UUID REFERENCES utilisateur(id) ON DELETE CASCADE,
    id_commentaire_parent UUID REFERENCES commentaire(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_commentaire_dossier ON commentaire(id_dossier);
CREATE INDEX idx_commentaire_utilisateur ON commentaire(id_utilisateur);
CREATE INDEX idx_commentaire_date ON commentaire(created_at);
CREATE INDEX idx_commentaire_contenu ON commentaire USING gin(to_tsvector('french', contenu));

-- TABLE: DOCUMENT
CREATE TABLE document (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom_fichier VARCHAR(255) NOT NULL,
    type_document type_document NOT NULL,
    url_fichier VARCHAR(255) NOT NULL,
    taille_octets INT,
    format_fichier VARCHAR(20),
    description TEXT,
    confidentiel BOOLEAN DEFAULT TRUE,
    date_upload TIMESTAMPTZ DEFAULT NOW(),
    uploade_par UUID REFERENCES utilisateur(id) ON DELETE SET NULL,
    id_dossier UUID REFERENCES dossier_disparition(id) ON DELETE CASCADE,
    id_signalement UUID REFERENCES signalement(id) ON DELETE CASCADE
);

CREATE INDEX idx_document_dossier ON document(id_dossier);
CREATE INDEX idx_document_type ON document(type_document);

-- TABLE: STATISTIQUE_RECHERCHE
CREATE TABLE statistique_recherche (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    periode_debut DATE NOT NULL,
    periode_fin DATE NOT NULL,
    type_periode type_periode NOT NULL,
    region VARCHAR(100),
    ville VARCHAR(100),
    nombre_nouveaux_dossiers INT DEFAULT 0,
    nombre_dossiers_resolus INT DEFAULT 0,
    nombre_personnes_retrouvees_vivantes INT DEFAULT 0,
    nombre_personnes_retrouvees_decedees INT DEFAULT 0,
    taux_resolution DECIMAL(5,2),
    temps_moyen_resolution_jours DECIMAL(8,2),
    nombre_enfants_disparus INT DEFAULT 0,
    nombre_adultes_disparus INT DEFAULT 0,
    nombre_enlevements INT DEFAULT 0,
    nombre_fugues INT DEFAULT 0,
    nombre_signalements_recus INT DEFAULT 0,
    nombre_signalements_valides INT DEFAULT 0,
    taux_validation_signalements DECIMAL(5,2),
    nombre_alertes_diffusees INT DEFAULT 0,
    portee_moyenne_alertes INT DEFAULT 0,
    nombre_analyses_ia INT DEFAULT 0,
    taux_precision_ia DECIMAL(5,2),
    nombre_correspondances_ia INT DEFAULT 0,
    date_generation TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stat_periode ON statistique_recherche(periode_debut, periode_fin);
CREATE INDEX idx_stat_region ON statistique_recherche(region, ville);

-- TABLE: DON
CREATE TABLE don (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    montant DECIMAL(10,2) NOT NULL,
    devise VARCHAR(3) DEFAULT 'XAF',
    type_don type_don DEFAULT 'ponctuel',
    donateur_anonyme BOOLEAN DEFAULT FALSE,
    nom_donateur VARCHAR(150),
    email_donateur VARCHAR(150),
    telephone_donateur VARCHAR(30),
    organisation_donatrice VARCHAR(150),
    message_donateur TEXT,
    methode_paiement methode_paiement NOT NULL,
    statut_paiement statut_paiement DEFAULT 'en_attente',
    reference_transaction VARCHAR(100) UNIQUE,
    id_transaction_externe VARCHAR(255),
    date_don TIMESTAMPTZ DEFAULT NOW(),
    date_traitement TIMESTAMPTZ,
    remerciement_envoye BOOLEAN DEFAULT FALSE,
    date_remerciement TIMESTAMPTZ,
    recu_fiscal_genere BOOLEAN DEFAULT FALSE,
    numero_recu VARCHAR(50)
);

CREATE INDEX idx_don_statut ON don(statut_paiement);
CREATE INDEX idx_don_date ON don(date_don);
CREATE INDEX idx_don_type ON don(type_don);

-- TABLE: CAMPAGNE_SENSIBILISATION
CREATE TABLE campagne_sensibilisation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    objectif TEXT,
    type_campagne type_campagne NOT NULL,
    public_cible VARCHAR(255),
    date_debut DATE NOT NULL,
    date_fin DATE,
    zones_geographiques JSONB,
    canaux_diffusion JSONB,
    contenu_campagne JSONB,
    statut_campagne statut_campagne DEFAULT 'planifiee',
    nombre_personnes_touchees INT DEFAULT 0,
    nombre_interactions INT DEFAULT 0,
    budget_alloue DECIMAL(10,2),
    budget_depense DECIMAL(10,2),
    creee_par UUID REFERENCES utilisateur(id) ON DELETE SET NULL,
    id_organisation UUID REFERENCES organisation(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campagne_statut ON campagne_sensibilisation(statut_campagne);
CREATE INDEX idx_campagne_dates ON campagne_sensibilisation(date_debut, date_fin);
CREATE INDEX idx_campagne_type ON campagne_sensibilisation(type_campagne);

-- =====================================================
-- VUES MATÉRIALISÉES
-- =====================================================

-- VUE: Dossiers actifs avec statistiques
CREATE MATERIALIZED VIEW v_dossiers_actifs AS
SELECT 
    d.id,
    d.numero_dossier,
    d.date_disparition,
    d.statut_dossier,
    d.niveau_urgence,
    p.nom,
    p.prenom,
    p.sexe,
    p.age_estime_min,
    d.ville_disparition,
    d.region_disparition,
    COUNT(DISTINCT s.id) as nombre_signalements,
    COUNT(DISTINCT a.id) as nombre_alertes,
    EXTRACT(DAY FROM NOW() - d.date_disparition) as jours_depuis_disparition
FROM dossier_disparition d
JOIN personne p ON d.id_personne = p.id
LEFT JOIN signalement s ON d.id = s.id_dossier
LEFT JOIN alerte a ON d.id = a.id_dossier
WHERE d.statut_dossier = 'en_cours'
GROUP BY d.id, p.id;

CREATE UNIQUE INDEX idx_v_dossiers_actifs_id ON v_dossiers_actifs(id);

-- VUE: Statistiques par région
CREATE MATERIALIZED VIEW v_stats_par_region AS
SELECT 
    region_disparition,
    COUNT(*) as total_disparitions,
    SUM(CASE WHEN statut_dossier = 'en_cours' THEN 1 ELSE 0 END) as en_cours,
    SUM(CASE WHEN statut_dossier = 'retrouve_vivant' THEN 1 ELSE 0 END) as retrouves_vivants,
    SUM(CASE WHEN statut_dossier = 'retrouve_decede' THEN 1 ELSE 0 END) as retrouves_decedes,
    ROUND(SUM(CASE WHEN statut_dossier IN ('retrouve_vivant', 'retrouve_decede') THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 2) as taux_resolution
FROM dossier_disparition
GROUP BY region_disparition;

CREATE UNIQUE INDEX idx_v_stats_region ON v_stats_par_region(region_disparition);

-- =====================================================
-- FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction: Calcul de distance entre deux points
CREATE OR REPLACE FUNCTION calcul_distance_km(
    lat1 DECIMAL(9,6),
    lon1 DECIMAL(9,6),
    lat2 DECIMAL(9,6),
    lon2 DECIMAL(9,6)
) RETURNS DECIMAL(8,2) AS $$
BEGIN
    RETURN (6371 * acos(
        cos(radians(lat1)) * 
        cos(radians(lat2)) * 
        cos(radians(lon2) - radians(lon1)) + 
        sin(radians(lat1)) * 
        sin(radians(lat2))
    ))::DECIMAL(8,2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fonction: Génération numéro de dossier
CREATE OR REPLACE FUNCTION generer_numero_dossier()
RETURNS TRIGGER AS $$
DECLARE
    ville_code VARCHAR(3);
    annee VARCHAR(4);
    numero_seq VARCHAR(6);
BEGIN
    ville_code := CASE 
        WHEN NEW.ville_disparition ILIKE '%Yaoundé%' THEN 'YDE'
        WHEN NEW.ville_disparition ILIKE '%Douala%' THEN 'DLA'
        WHEN NEW.ville_disparition ILIKE '%Bafoussam%' THEN 'BFS'
        ELSE 'CMR'
    END;
    
    annee := EXTRACT(YEAR FROM NEW.date_disparition)::VARCHAR;
    
    SELECT LPAD((COUNT(*) + 1)::VARCHAR, 6, '0')
    INTO numero_seq
    FROM dossier_disparition 
    WHERE EXTRACT(YEAR FROM date_disparition) = EXTRACT(YEAR FROM NEW.date_disparition);
    
    NEW.numero_dossier := CONCAT('DISP-', ville_code, '-', annee, '-', numero_seq);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction: Mise à jour score fiabilité utilisateur
CREATE OR REPLACE FUNCTION maj_score_fiabilite()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.statut_validation != OLD.statut_validation AND NEW.id_utilisateur IS NOT NULL THEN
        IF NEW.statut_validation = 'valide' THEN
            UPDATE utilisateur 
            SET nombre_signalements_valides = nombre_signalements_valides + 1,
                score_fiabilite = LEAST(100, score_fiabilite + 2)
            WHERE id = NEW.id_utilisateur;
        ELSIF NEW.statut_validation = 'invalide' THEN
            UPDATE utilisateur 
            SET nombre_signalements_invalides = nombre_signalements_invalides + 1,
                score_fiabilite = GREATEST(0, score_fiabilite - 5)
            WHERE id = NEW.id_utilisateur;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction: Mise à jour compteur signalements
CREATE OR REPLACE FUNCTION maj_compteur_signalements()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE dossier_disparition 
    SET nombre_signalements = nombre_signalements + 1,
        derniere_activite = NOW()
    WHERE id = NEW.id_dossier;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction: Mise à jour timestamp
CREATE OR REPLACE FUNCTION maj_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction: Mise à jour point géographique
CREATE OR REPLACE FUNCTION maj_point_geographique()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude_disparition IS NOT NULL AND NEW.longitude_disparition IS NOT NULL THEN
        NEW.point_disparition := ST_SetSRID(ST_MakePoint(NEW.longitude_disparition, NEW.latitude_disparition), 4326)::geography;
    END IF;
    
    IF NEW.latitude_decouverte IS NOT NULL AND NEW.longitude_decouverte IS NOT NULL THEN
        NEW.point_decouverte := ST_SetSRID(ST_MakePoint(NEW.longitude_decouverte, NEW.latitude_decouverte), 4326)::geography;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger: Génération numéro dossier
CREATE TRIGGER trg_generer_numero_dossier
BEFORE INSERT ON dossier_disparition
FOR EACH ROW
WHEN (NEW.numero_dossier IS NULL)
EXECUTE FUNCTION generer_numero_dossier();

-- Trigger: Mise à jour score fiabilité
CREATE TRIGGER trg_maj_score_fiabilite
AFTER UPDATE ON signalement
FOR EACH ROW
EXECUTE FUNCTION maj_score_fiabilite();

-- Trigger: Compteur signalements
CREATE TRIGGER trg_maj_compteur_signalements
AFTER INSERT ON signalement
FOR EACH ROW
EXECUTE FUNCTION maj_compteur_signalements();

-- Trigger: Updated_at pour toutes les tables
CREATE TRIGGER trg_organisation_updated_at BEFORE UPDATE ON organisation FOR EACH ROW EXECUTE FUNCTION maj_updated_at();
CREATE TRIGGER trg_utilisateur_updated_at BEFORE UPDATE ON utilisateur FOR EACH ROW EXECUTE FUNCTION maj_updated_at();
CREATE TRIGGER trg_personne_updated_at BEFORE UPDATE ON personne FOR EACH ROW EXECUTE FUNCTION maj_updated_at();
CREATE TRIGGER trg_lien_updated_at BEFORE UPDATE ON lien_filiation FOR EACH ROW EXECUTE FUNCTION maj_updated_at();
CREATE TRIGGER trg_dossier_updated_at BEFORE UPDATE ON dossier_disparition FOR EACH ROW EXECUTE FUNCTION maj_updated_at();
CREATE TRIGGER trg_signalement_updated_at BEFORE UPDATE ON signalement FOR EACH ROW EXECUTE FUNCTION maj_updated_at();
CREATE TRIGGER trg_alerte_updated_at BEFORE UPDATE ON alerte FOR EACH ROW EXECUTE FUNCTION maj_updated_at();
CREATE TRIGGER trg_commentaire_updated_at BEFORE UPDATE ON commentaire FOR EACH ROW EXECUTE FUNCTION maj_updated_at();

-- Trigger: Points géographiques dossier
CREATE TRIGGER trg_dossier_point_geo
BEFORE INSERT OR UPDATE ON dossier_disparition
FOR EACH ROW
EXECUTE FUNCTION maj_point_geographique();

-- Trigger: Point géographique signalement
CREATE OR REPLACE FUNCTION maj_point_signalement()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude_observation IS NOT NULL AND NEW.longitude_observation IS NOT NULL THEN
        NEW.point_observation := ST_SetSRID(ST_MakePoint(NEW.longitude_observation, NEW.latitude_observation), 4326)::geography;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_signalement_point_geo
BEFORE INSERT OR UPDATE ON signalement
FOR EACH ROW
EXECUTE FUNCTION maj_point_signalement();

-- Trigger: Point géographique alerte
CREATE OR REPLACE FUNCTION maj_point_alerte()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude_centre IS NOT NULL AND NEW.longitude_centre IS NOT NULL THEN
        NEW.point_centre := ST_SetSRID(ST_MakePoint(NEW.longitude_centre, NEW.latitude_centre), 4326)::geography;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_alerte_point_geo
BEFORE INSERT OR UPDATE ON alerte
FOR EACH ROW
EXECUTE FUNCTION maj_point_alerte();

-- Trigger: Point géographique localisation
CREATE OR REPLACE FUNCTION maj_point_localisation()
RETURNS TRIGGER AS $$
BEGIN
    NEW.point := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_localisation_point_geo
BEFORE INSERT OR UPDATE ON localisation
FOR EACH ROW
EXECUTE FUNCTION maj_point_localisation();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Activation RLS sur toutes les tables principales
ALTER TABLE utilisateur ENABLE ROW LEVEL SECURITY;
ALTER TABLE personne ENABLE ROW LEVEL SECURITY;
ALTER TABLE dossier_disparition ENABLE ROW LEVEL SECURITY;
ALTER TABLE signalement ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerte ENABLE ROW LEVEL SECURITY;
ALTER TABLE commentaire ENABLE ROW LEVEL SECURITY;
ALTER TABLE document ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification ENABLE ROW LEVEL SECURITY;

-- Fonction helper: Obtenir niveau accès utilisateur
CREATE OR REPLACE FUNCTION get_user_niveau_acces(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    niveau INTEGER;
BEGIN
    SELECT COALESCE(MAX(r.niveau_accreditation), 0)
    INTO niveau
    FROM utilisateur_role ur
    JOIN role r ON ur.id_role = r.id
    WHERE ur.id_utilisateur = user_id
    AND (ur.date_expiration IS NULL OR ur.date_expiration > NOW());
    
    RETURN niveau;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Politique: Utilisateur peut voir son profil
CREATE POLICY utilisateur_voir_propre_profil ON utilisateur
    FOR SELECT
    USING (auth.uid() = id);

-- Politique: Autorités peuvent voir autres utilisateurs
CREATE POLICY utilisateur_voir_autres ON utilisateur
    FOR SELECT
    USING (get_user_niveau_acces(auth.uid()) >= 4);

-- Politique: Dossiers publics visibles par tous
CREATE POLICY dossier_public_visible ON dossier_disparition
    FOR SELECT
    USING (visible_public = TRUE);

-- Politique: Autorités voient tous les dossiers
CREATE POLICY dossier_autorite_all ON dossier_disparition
    FOR ALL
    USING (get_user_niveau_acces(auth.uid()) >= 4);

-- Politique: Créateur peut voir ses dossiers
CREATE POLICY dossier_createur ON dossier_disparition
    FOR SELECT
    USING (id_utilisateur_createur = auth.uid());

-- Politique: Signalements visibles par autorités
CREATE POLICY signalement_autorite ON signalement
    FOR SELECT
    USING (get_user_niveau_acces(auth.uid()) >= 3);

-- Politique: Utilisateur voit ses signalements
CREATE POLICY signalement_propre ON signalement
    FOR SELECT
    USING (id_utilisateur = auth.uid());

-- Politique: Photos publiques visibles par tous
CREATE POLICY photo_public ON photo
    FOR SELECT
    USING (visible_public = TRUE AND approuvee = TRUE);

-- Politique: Commentaires confidentiels pour autorités
CREATE POLICY commentaire_confidentiel ON commentaire
    FOR SELECT
    USING (
        NOT confidentiel OR 
        get_user_niveau_acces(auth.uid()) >= 4
    );

-- Politique: Notifications pour utilisateur
CREATE POLICY notification_utilisateur ON notification
    FOR ALL
    USING (id_utilisateur = auth.uid());

-- =====================================================
-- DONNÉES INITIALES
-- =====================================================

-- Insertion des rôles prédéfinis
INSERT INTO role (nom_role, niveau_accreditation, description, permissions) VALUES
('citoyen_standard', 0, 'Utilisateur grand public standard', '{"can_view_public": true, "can_report": true, "can_create_dossier": false}'::jsonb),
('citoyen_verifie', 1, 'Citoyen avec identité vérifiée', '{"can_view_public": true, "can_report": true, "can_create_dossier": false, "priority_reports": true}'::jsonb),
('operateur_saisie', 2, 'Opérateur de saisie des données', '{"can_create_dossier": true, "can_edit_dossier": false, "can_validate": false}'::jsonb),
('moderateur', 3, 'Modérateur de signalements', '{"can_moderate": true, "can_validate_reports": true}'::jsonb),
('officier_police', 4, 'Officier de police', '{"can_create_dossier": true, "can_edit_dossier": true, "can_validate": true, "can_create_alert": true}'::jsonb),
('agent_gendarmerie', 4, 'Agent de gendarmerie', '{"can_create_dossier": true, "can_edit_dossier": true, "can_validate": true, "can_create_alert": true}'::jsonb),
('responsable_ong', 5, 'Responsable organisation humanitaire', '{"can_create_dossier": true, "can_edit_dossier": true, "can_create_alert": true, "can_view_stats": true}'::jsonb),
('admin_organisation', 6, 'Administrateur d''organisation', '{"full_access_organization": true, "can_manage_users": true, "can_view_all_stats": true}'::jsonb),
('super_admin', 7, 'Super administrateur système', '{"full_system_access": true, "can_manage_all": true}'::jsonb);

-- =====================================================
-- COMMENTAIRES FINAUX
-- =====================================================

COMMENT ON DATABASE postgres IS 'RetrouvonsLes - Base de données Supabase pour application de recherche de personnes disparues';

-- =====================================================
-- FIN DU SCHÉMA
-- =====================================================
