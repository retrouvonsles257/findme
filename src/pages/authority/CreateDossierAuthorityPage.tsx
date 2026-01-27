/**
 * =====================================================
 * RETROUVONSLES - Authority Create Dossier Page
 * Création complète d'un dossier de disparition
 * Connecté à Supabase avec upload Cloudinary
 * =====================================================
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts';
import { useNotification } from '../../contexts';
import { supabase } from '../../config';
import { cloudinaryConfig, cloudinaryUploadConfig } from '../../config/cloudinary.config';
import { AuthorityLayout } from '../../components/layout';
import {
  User,
  MapPin,
  Camera,
  FolderPlus,
  Loader2,
} from 'lucide-react';
import styles from './CreateDossierPage.module.css';

interface PersonneFormData {
  nom: string;
  prenom: string;
  date_naissance: string;
  sexe: 'masculin' | 'feminin' | 'inconnu' | 'non_precise';
  nationalite: string;
  taille_cm: string;
  poids_kg: string;
  couleur_yeux: string;
  couleur_cheveux: string;
  signes_particuliers: string;
}

interface DossierFormData {
  niveau_urgence: 'critique' | 'urgent' | 'normal' | 'faible';
  date_disparition: string;
  lieu_disparition: string;
  ville_disparition: string;
  pays_disparition: string;
  circonstances: string;
  vetements_portes: string;
  objets_personnels: string;
  derniere_activite_connue: string;
  visible_public: boolean;
  diffusion_autorisee: boolean;
  contact_nom: string;
  contact_telephone: string;
  contact_email: string;
}

export const CreateDossierAuthorityPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [photoUploading, setPhotoUploading] = useState(false);

  // Formulaire personne
  const [personneData, setPersonneData] = useState<PersonneFormData>({
    nom: '',
    prenom: '',
    date_naissance: '',
    sexe: 'masculin',
    nationalite: 'Camerounaise',
    taille_cm: '',
    poids_kg: '',
    couleur_yeux: '',
    couleur_cheveux: '',
    signes_particuliers: '',
  });

  // Formulaire dossier
  const [dossierData, setDossierData] = useState<DossierFormData>({
    niveau_urgence: 'normal',
    date_disparition: new Date().toISOString().split('T')[0],
    lieu_disparition: '',
    ville_disparition: '',
    pays_disparition: 'Cameroun',
    circonstances: '',
    vetements_portes: '',
    objets_personnels: '',
    derniere_activite_connue: '',
    visible_public: true,
    diffusion_autorisee: true,
    contact_nom: '',
    contact_telephone: '',
    contact_email: '',
  });

  // Upload photo vers Cloudinary
  const handlePhotoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setPhotoUploading(true);
    
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', cloudinaryConfig.uploadPreset);
        formData.append('folder', cloudinaryUploadConfig.personnePhoto.folder);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (!response.ok) throw new Error('Upload failed');
        
        const data = await response.json();
        return data.secure_url;
      });

      const urls = await Promise.all(uploadPromises);
      setUploadedPhotos(prev => [...prev, ...urls]);
      
      addNotification({
        title: 'Photos uploadées',
        message: `${urls.length} photo(s) ajoutée(s)`,
        type: 'success',
      });
    } catch (err: any) {
      addNotification({
        title: 'Erreur upload',
        message: err.message || 'Erreur lors de l\'upload',
        type: 'error',
      });
    } finally {
      setPhotoUploading(false);
    }
  }, [addNotification]);

  // Supprimer une photo
  const removePhoto = (index: number) => {
    setUploadedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Validation étape 1
  const validateStep1 = (): boolean => {
    if (!personneData.nom.trim() || !personneData.prenom.trim()) {
      addNotification({
        title: 'Champs requis',
        message: 'Le nom et prénom sont obligatoires',
        type: 'error',
      });
      return false;
    }
    return true;
  };

  // Validation étape 2
  const validateStep2 = (): boolean => {
    if (!dossierData.date_disparition || !dossierData.lieu_disparition.trim()) {
      addNotification({
        title: 'Champs requis',
        message: 'La date et le lieu de disparition sont obligatoires',
        type: 'error',
      });
      return false;
    }
    return true;
  };

  // Soumission finale
  const handleSubmit = useCallback(async () => {
    if (!user?.id) {
      addNotification({
        title: 'Erreur',
        message: 'Vous devez être connecté',
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Créer la personne (sans photos_supplementaires - elles vont dans la table photo)
      const { data: personneCreated, error: personneError } = await (supabase as any)
        .from('personne')
        .insert({
          nom: personneData.nom,
          prenom: personneData.prenom,
          nom_complet: `${personneData.prenom} ${personneData.nom}`,
          date_naissance: personneData.date_naissance || null,
          sexe: personneData.sexe,
          nationalite: personneData.nationalite,
          taille_cm: personneData.taille_cm ? parseInt(personneData.taille_cm) : null,
          poids_kg: personneData.poids_kg ? parseInt(personneData.poids_kg) : null,
          couleur_yeux: personneData.couleur_yeux || null,
          couleur_cheveux: personneData.couleur_cheveux || null,
          signes_distinctifs: personneData.signes_particuliers || null,
          photo_principale: uploadedPhotos[0] || null,
          cree_par: user.id,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (personneError) throw personneError;

      // 2. Insérer les photos dans la table photo
      if (uploadedPhotos.length > 0) {
        const photosToInsert = uploadedPhotos.map((url, index) => ({
          url_cloudinary: url,
          type_photo: 'portrait',
          est_principale: index === 0,
          visible_public: true,
          id_personne: personneCreated.id,
          uploadee_par: user.id,
          created_at: new Date().toISOString(),
        }));

        const { error: photosError } = await (supabase as any)
          .from('photo')
          .insert(photosToInsert);

        if (photosError) {
          // Erreur silencieuse - les photos sont optionnelles
          // On continue même si les photos échouent
        }
      }

      // 3. Créer le dossier de disparition
      const numeroDossier = `DOS-${Date.now().toString(36).toUpperCase()}`;
      
      const { data: dossierCreated, error: dossierError } = await (supabase as any)
        .from('dossier_disparition')
        .insert({
          numero_dossier: numeroDossier,
          id_personne: personneCreated.id,
          id_utilisateur_createur: user.id,
          niveau_urgence: dossierData.niveau_urgence,
          statut_dossier: 'en_cours',
          type_disparition: 'inconnue', // Valeur valide de l'enum type_disparition
          date_disparition: new Date(dossierData.date_disparition).toISOString(),
          lieu_disparition: dossierData.lieu_disparition,
          ville_disparition: dossierData.ville_disparition || null,
          pays_disparition: dossierData.pays_disparition || 'Cameroun',
          circonstances: dossierData.circonstances || 'Non précisées', // Champ obligatoire
          derniere_activite_connue: dossierData.derniere_activite_connue || null,
          visible_public: dossierData.visible_public,
          diffusion_autorisee: dossierData.diffusion_autorisee,
          contact_famille_principale: dossierData.contact_nom || null,
          telephone_contact: dossierData.contact_telephone || null,
          email_contact: dossierData.contact_email || null,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (dossierError) throw dossierError;

      addNotification({
        title: 'Dossier créé',
        message: `Dossier ${numeroDossier} créé avec succès`,
        type: 'success',
      });

      // Rediriger vers le dossier
      setTimeout(() => {
        navigate(`/authority/dossiers/${dossierCreated.id}`);
      }, 1500);

    } catch (err: any) {
      // Erreur gérée par la notification
      addNotification({
        title: 'Erreur',
        message: err.message || 'Erreur lors de la création du dossier',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [user, personneData, dossierData, uploadedPhotos, addNotification, navigate]);

  return (
    <AuthorityLayout>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h1>Créer un Nouveau Dossier</h1>
          <p className={styles.subtitle}>
            Étape {step} sur 3 - {step === 1 ? 'Informations Personne' : step === 2 ? 'Détails Disparition' : 'Vérification'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className={styles.progressBar}>
          <div 
            className={`${styles.progressStep} ${step >= 1 ? styles.active : ''}`}
            onClick={() => setStep(1)}
          >
            <span>1</span> Personne
          </div>
          <div 
            className={`${styles.progressStep} ${step >= 2 ? styles.active : ''}`}
            onClick={() => step >= 2 && setStep(2)}
          >
            <span>2</span> Disparition
          </div>
          <div 
            className={`${styles.progressStep} ${step >= 3 ? styles.active : ''}`}
          >
            <span>3</span> Vérification
          </div>
        </div>

        {/* Form Content */}
        <div className={styles.formContainer}>
          {/* Étape 1: Informations Personne */}
          {step === 1 && (
            <div className={styles.formSection}>
              <h2><User size={20} /> Informations sur la Personne Disparue</h2>
              
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Nom *</label>
                  <input
                    type="text"
                    value={personneData.nom}
                    onChange={(e) => setPersonneData({ ...personneData, nom: e.target.value })}
                    placeholder="Nom de famille"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Prénom *</label>
                  <input
                    type="text"
                    value={personneData.prenom}
                    onChange={(e) => setPersonneData({ ...personneData, prenom: e.target.value })}
                    placeholder="Prénom"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Date de naissance</label>
                  <input
                    type="date"
                    value={personneData.date_naissance}
                    onChange={(e) => setPersonneData({ ...personneData, date_naissance: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Sexe</label>
                  <select
                    value={personneData.sexe}
                    onChange={(e) => setPersonneData({ ...personneData, sexe: e.target.value as any })}
                  >
                    <option value="masculin">Masculin</option>
                    <option value="feminin">Féminin</option>
                    <option value="non_precise">Non précisé</option>
                    <option value="inconnu">Inconnu</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Nationalité</label>
                  <input
                    type="text"
                    value={personneData.nationalite}
                    onChange={(e) => setPersonneData({ ...personneData, nationalite: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Taille (cm)</label>
                  <input
                    type="number"
                    value={personneData.taille_cm}
                    onChange={(e) => setPersonneData({ ...personneData, taille_cm: e.target.value })}
                    placeholder="ex: 175"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Poids (kg)</label>
                  <input
                    type="number"
                    value={personneData.poids_kg}
                    onChange={(e) => setPersonneData({ ...personneData, poids_kg: e.target.value })}
                    placeholder="ex: 70"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Couleur des yeux</label>
                  <input
                    type="text"
                    value={personneData.couleur_yeux}
                    onChange={(e) => setPersonneData({ ...personneData, couleur_yeux: e.target.value })}
                    placeholder="ex: Marron"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Couleur des cheveux</label>
                  <input
                    type="text"
                    value={personneData.couleur_cheveux}
                    onChange={(e) => setPersonneData({ ...personneData, couleur_cheveux: e.target.value })}
                    placeholder="ex: Noir"
                  />
                </div>

                <div className={styles.formGroupFull}>
                  <label>Signes particuliers</label>
                  <textarea
                    value={personneData.signes_particuliers}
                    onChange={(e) => setPersonneData({ ...personneData, signes_particuliers: e.target.value })}
                    placeholder="Cicatrices, tatouages, marques distinctives..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Upload Photos */}
              <div className={styles.photoSection}>
                <h3><Camera size={18} /> Photos</h3>
                <div className={styles.photoUpload}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    disabled={photoUploading}
                    id="photo-upload"
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="photo-upload" className={styles.uploadButton}>
                    {photoUploading ? <><Loader2 size={16} className={styles.spinner} /> Upload...</> : <><FolderPlus size={16} /> Ajouter des photos</>}
                  </label>
                </div>
                
                {uploadedPhotos.length > 0 && (
                  <div className={styles.photoGrid}>
                    {uploadedPhotos.map((url, index) => (
                      <div key={index} className={styles.photoPreview}>
                        <img src={url} alt={`Photo ${index + 1}`} />
                        <button onClick={() => removePhoto(index)} className={styles.removePhoto}>✕</button>
                        {index === 0 && <span className={styles.mainPhotoBadge}>Principale</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.formActions}>
                <button onClick={() => navigate('/authority/dossiers')} className={styles.cancelBtn}>
                  Annuler
                </button>
                <button 
                  onClick={() => validateStep1() && setStep(2)} 
                  className={styles.nextBtn}
                >
                  Suivant →
                </button>
              </div>
            </div>
          )}

          {/* Étape 2: Détails Disparition */}
          {step === 2 && (
            <div className={styles.formSection}>
              <h2><MapPin size={20} /> Détails de la Disparition</h2>
              
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Niveau d'urgence *</label>
                  <select
                    value={dossierData.niveau_urgence}
                    onChange={(e) => setDossierData({ ...dossierData, niveau_urgence: e.target.value as any })}
                  >
                    <option value="critique">🔴 Critique</option>
                    <option value="urgent">🟠 Urgent</option>
                    <option value="normal">🟡 Normal</option>
                    <option value="faible">🟢 Faible</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Date de disparition *</label>
                  <input
                    type="date"
                    value={dossierData.date_disparition}
                    onChange={(e) => setDossierData({ ...dossierData, date_disparition: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Lieu de disparition *</label>
                  <input
                    type="text"
                    value={dossierData.lieu_disparition}
                    onChange={(e) => setDossierData({ ...dossierData, lieu_disparition: e.target.value })}
                    placeholder="Adresse ou description du lieu"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Ville</label>
                  <input
                    type="text"
                    value={dossierData.ville_disparition}
                    onChange={(e) => setDossierData({ ...dossierData, ville_disparition: e.target.value })}
                    placeholder="ex: Yaoundé"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Pays</label>
                  <input
                    type="text"
                    value={dossierData.pays_disparition}
                    onChange={(e) => setDossierData({ ...dossierData, pays_disparition: e.target.value })}
                  />
                </div>

                <div className={styles.formGroupFull}>
                  <label>Circonstances</label>
                  <textarea
                    value={dossierData.circonstances}
                    onChange={(e) => setDossierData({ ...dossierData, circonstances: e.target.value })}
                    placeholder="Décrivez les circonstances de la disparition..."
                    rows={4}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Vêtements portés</label>
                  <textarea
                    value={dossierData.vetements_portes}
                    onChange={(e) => setDossierData({ ...dossierData, vetements_portes: e.target.value })}
                    placeholder="Description des vêtements..."
                    rows={2}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Objets personnels</label>
                  <textarea
                    value={dossierData.objets_personnels}
                    onChange={(e) => setDossierData({ ...dossierData, objets_personnels: e.target.value })}
                    placeholder="Téléphone, sac, bijoux..."
                    rows={2}
                  />
                </div>

                <div className={styles.formGroupFull}>
                  <label>Dernière activité connue</label>
                  <textarea
                    value={dossierData.derniere_activite_connue}
                    onChange={(e) => setDossierData({ ...dossierData, derniere_activite_connue: e.target.value })}
                    placeholder="Qu'était en train de faire la personne avant sa disparition..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Contact */}
              <h3 style={{ marginTop: '24px' }}>📞 Contact de la Famille</h3>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Nom du contact</label>
                  <input
                    type="text"
                    value={dossierData.contact_nom}
                    onChange={(e) => setDossierData({ ...dossierData, contact_nom: e.target.value })}
                    placeholder="Nom complet"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Téléphone</label>
                  <input
                    type="tel"
                    value={dossierData.contact_telephone}
                    onChange={(e) => setDossierData({ ...dossierData, contact_telephone: e.target.value })}
                    placeholder="+237..."
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Email</label>
                  <input
                    type="email"
                    value={dossierData.contact_email}
                    onChange={(e) => setDossierData({ ...dossierData, contact_email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              {/* Options de diffusion */}
              <h3 style={{ marginTop: '24px' }}>⚙️ Options de Diffusion</h3>
              <div className={styles.checkboxGroup}>
                <label>
                  <input
                    type="checkbox"
                    checked={dossierData.visible_public}
                    onChange={(e) => setDossierData({ ...dossierData, visible_public: e.target.checked })}
                  />
                  Visible au public
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={dossierData.diffusion_autorisee}
                    onChange={(e) => setDossierData({ ...dossierData, diffusion_autorisee: e.target.checked })}
                  />
                  Diffusion autorisée (alertes)
                </label>
              </div>

              <div className={styles.formActions}>
                <button onClick={() => setStep(1)} className={styles.backBtn}>
                  ← Retour
                </button>
                <button 
                  onClick={() => validateStep2() && setStep(3)} 
                  className={styles.nextBtn}
                >
                  Suivant →
                </button>
              </div>
            </div>
          )}

          {/* Étape 3: Vérification */}
          {step === 3 && (
            <div className={styles.formSection}>
              <h2>✓ Vérification et Confirmation</h2>
              
              <div className={styles.summary}>
                <div className={styles.summarySection}>
                  <h3><User size={16} /> Personne</h3>
                  <p><strong>Nom:</strong> {personneData.prenom} {personneData.nom}</p>
                  <p><strong>Date de naissance:</strong> {personneData.date_naissance || 'Non renseignée'}</p>
                  <p><strong>Sexe:</strong> {personneData.sexe}</p>
                  <p><strong>Taille:</strong> {personneData.taille_cm ? `${personneData.taille_cm} cm` : 'Non renseignée'}</p>
                  <p><strong>Photos:</strong> {uploadedPhotos.length} photo(s)</p>
                </div>

                <div className={styles.summarySection}>
                  <h3><MapPin size={16} /> Disparition</h3>
                  <p><strong>Urgence:</strong> {dossierData.niveau_urgence}</p>
                  <p><strong>Date:</strong> {new Date(dossierData.date_disparition).toLocaleDateString('fr-FR')}</p>
                  <p><strong>Lieu:</strong> {dossierData.lieu_disparition}</p>
                  <p><strong>Ville:</strong> {dossierData.ville_disparition || 'Non renseignée'}</p>
                  {dossierData.circonstances && (
                    <p><strong>Circonstances:</strong> {dossierData.circonstances.substring(0, 100)}...</p>
                  )}
                </div>

                <div className={styles.summarySection}>
                  <h3>📞 Contact</h3>
                  <p><strong>Nom:</strong> {dossierData.contact_nom || 'Non renseigné'}</p>
                  <p><strong>Téléphone:</strong> {dossierData.contact_telephone || 'Non renseigné'}</p>
                </div>

                <div className={styles.summarySection}>
                  <h3>⚙️ Options</h3>
                  <p><strong>Visible au public:</strong> {dossierData.visible_public ? 'Oui' : 'Non'}</p>
                  <p><strong>Diffusion autorisée:</strong> {dossierData.diffusion_autorisee ? 'Oui' : 'Non'}</p>
                </div>
              </div>

              {uploadedPhotos.length > 0 && (
                <div className={styles.previewPhotos}>
                  <h3><Camera size={18} /> Photos</h3>
                  <div className={styles.photoGrid}>
                    {uploadedPhotos.slice(0, 4).map((url, index) => (
                      <img key={index} src={url} alt={`Preview ${index}`} />
                    ))}
                    {uploadedPhotos.length > 4 && (
                      <div className={styles.morePhotos}>+{uploadedPhotos.length - 4}</div>
                    )}
                  </div>
                </div>
              )}

              <div className={styles.formActions}>
                <button onClick={() => setStep(2)} className={styles.backBtn}>
                  ← Modifier
                </button>
                <button 
                  onClick={handleSubmit} 
                  className={styles.submitBtn}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <><Loader2 size={16} className={styles.spinner} /> Création en cours...</> : 'Créer le Dossier'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthorityLayout>
  );
};

export default CreateDossierAuthorityPage;
