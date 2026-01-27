/**
 * =====================================================
 * RETROUVONSLES - Edit Dossier Page
 * Modification d'un dossier existant
 * Connecté à Supabase
 * =====================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts';
import { useNotification } from '../../contexts';
import { supabase } from '../../config';
import { AuthorityLayout } from '../../components/layout';
import { 
  RefreshCw, 
  AlertTriangle, 
  User, 
  FileText, 
  Save, 
  Loader2, 
  ArrowLeft, 
  Phone, 
  Settings, 
  Clipboard,
  Circle,
  AlertCircle as AlertCircleIcon
} from 'lucide-react';
import styles from './EditDossierPage.module.css';

export const EditDossierPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  useAuth(); // Hook call for auth context
  const { addNotification } = useNotification();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [dossier, setDossier] = useState<any>(null);
  const [personne, setPersonne] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    niveau_urgence: 'normal',
    statut_dossier: 'en_cours',
    lieu_disparition: '',
    ville_disparition: '',
    circonstances: '',
    vetements_portes: '',
    objets_personnels: '',
    derniere_activite_connue: '',
    visible_public: true,
    diffusion_autorisee: true,
    contact_nom: '',
    contact_telephone: '',
    notes_internes: '',
  });

  // Charger le dossier
  useEffect(() => {
    const loadDossier = async () => {
      if (!id) return;

      try {
        const { data: dossierData, error: dossierError } = await (supabase as any)
          .from('dossier_disparition')
          .select('*, personne:id_personne(*)')
          .eq('id', id)
          .single();

        if (dossierError) throw dossierError;

        setDossier(dossierData);
        setPersonne(dossierData.personne);
        
        setFormData({
          niveau_urgence: dossierData.niveau_urgence || 'normal',
          statut_dossier: dossierData.statut_dossier || 'en_cours',
          lieu_disparition: dossierData.lieu_disparition || '',
          ville_disparition: dossierData.ville_disparition || '',
          circonstances: dossierData.circonstances || '',
          vetements_portes: dossierData.vetements_portes || '',
          objets_personnels: dossierData.objets_personnels || '',
          derniere_activite_connue: dossierData.derniere_activite_connue || '',
          visible_public: dossierData.visible_public ?? true,
          diffusion_autorisee: dossierData.diffusion_autorisee ?? true,
          contact_nom: dossierData.contact_nom || '',
          contact_telephone: dossierData.contact_telephone || '',
          notes_internes: dossierData.notes_internes || '',
        });
      } catch (err: any) {
        // Erreur gérée par la notification
        addNotification({
          title: 'Erreur',
          message: 'Impossible de charger le dossier',
          type: 'error',
        });
        navigate('/authority/dossiers');
      } finally {
        setIsLoading(false);
      }
    };

    loadDossier();
  }, [id, addNotification, navigate]);

  // Sauvegarder les modifications
  const handleSave = useCallback(async () => {
    if (!id) return;

    setIsSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('dossier_disparition')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
          date_resolution: formData.statut_dossier.includes('retrouve') ? new Date().toISOString() : null,
        })
        .eq('id', id);

      if (error) throw error;

      addNotification({
        title: 'Modifications enregistrées',
        message: 'Le dossier a été mis à jour',
        type: 'success',
      });

      navigate(`/authority/dossiers/${id}`);
    } catch (err: any) {
      addNotification({
        title: 'Erreur',
        message: err.message || 'Erreur lors de la sauvegarde',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  }, [id, formData, addNotification, navigate]);

  if (isLoading) {
    return (
      <AuthorityLayout>
        <div className={styles.loadingState}>
          <RefreshCw size={24} className={styles.spinning} />
          Chargement du dossier...
        </div>
      </AuthorityLayout>
    );
  }

  if (!dossier) {
    return (
      <AuthorityLayout>
        <div className={styles.emptyState}>
          <AlertTriangle size={48} />
          <p>Dossier non trouvé</p>
        </div>
      </AuthorityLayout>
    );
  }

  return (
    <AuthorityLayout>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1>Modifier le Dossier</h1>
            <p className={styles.subtitle}>
              {dossier.numero_dossier} - {personne?.prenom} {personne?.nom}
            </p>
          </div>
          <button 
            onClick={() => navigate(`/authority/dossiers/${id}`)}
            className={styles.backBtn}
          >
            <ArrowLeft size={18} /> Retour au dossier
          </button>
        </div>

        {/* Personne Info (lecture seule) */}
        <div className={styles.infoCard}>
          <h3><User size={18} /> Informations Personne (lecture seule)</h3>
          <div className={styles.infoGrid}>
            <p><strong>Nom:</strong> {personne?.prenom} {personne?.nom}</p>
            <p><strong>Date naissance:</strong> {personne?.date_naissance || 'N/A'}</p>
            <p><strong>Sexe:</strong> {personne?.sexe || 'N/A'}</p>
          </div>
        </div>

        {/* Formulaire */}
        <div className={styles.formContainer}>
          <h2><FileText size={20} /> Détails du Dossier</h2>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Statut du Dossier *</label>
              <select
                value={formData.statut_dossier}
                onChange={(e) => setFormData({ ...formData, statut_dossier: e.target.value })}
              >
                <option value="en_cours">En Cours</option>
                <option value="suspendu">Suspendu</option>
                <option value="retrouve_vivant">Retrouvé Vivant</option>
                <option value="retrouve_decede">Retrouvé Décédé</option>
                <option value="cloture">Clôturé</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Niveau d'Urgence *</label>
              <select
                value={formData.niveau_urgence}
                onChange={(e) => setFormData({ ...formData, niveau_urgence: e.target.value })}
                className={styles.urgenceSelect}
              >
                <option value="critique">Critique</option>
                <option value="urgent">Urgent</option>
                <option value="normal">Normal</option>
                <option value="faible">Faible</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Lieu de Disparition</label>
              <input
                type="text"
                value={formData.lieu_disparition}
                onChange={(e) => setFormData({ ...formData, lieu_disparition: e.target.value })}
                placeholder="Adresse ou description"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Ville</label>
              <input
                type="text"
                value={formData.ville_disparition}
                onChange={(e) => setFormData({ ...formData, ville_disparition: e.target.value })}
              />
            </div>

            <div className={styles.formGroupFull}>
              <label>Circonstances</label>
              <textarea
                value={formData.circonstances}
                onChange={(e) => setFormData({ ...formData, circonstances: e.target.value })}
                rows={4}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Vêtements Portés</label>
              <textarea
                value={formData.vetements_portes}
                onChange={(e) => setFormData({ ...formData, vetements_portes: e.target.value })}
                rows={3}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Objets Personnels</label>
              <textarea
                value={formData.objets_personnels}
                onChange={(e) => setFormData({ ...formData, objets_personnels: e.target.value })}
                rows={3}
              />
            </div>

            <div className={styles.formGroupFull}>
              <label>Dernière Activité Connue</label>
              <textarea
                value={formData.derniere_activite_connue}
                onChange={(e) => setFormData({ ...formData, derniere_activite_connue: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <h3 style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Phone size={18} /> Contact
          </h3>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Nom du Contact</label>
              <input
                type="text"
                value={formData.contact_nom}
                onChange={(e) => setFormData({ ...formData, contact_nom: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Téléphone</label>
              <input
                type="tel"
                value={formData.contact_telephone}
                onChange={(e) => setFormData({ ...formData, contact_telephone: e.target.value })}
              />
            </div>
          </div>

          <h3 style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={18} /> Options
          </h3>
          <div className={styles.checkboxGroup}>
            <label>
              <input
                type="checkbox"
                checked={formData.visible_public}
                onChange={(e) => setFormData({ ...formData, visible_public: e.target.checked })}
              />
              Visible au Public
            </label>
            <label>
              <input
                type="checkbox"
                checked={formData.diffusion_autorisee}
                onChange={(e) => setFormData({ ...formData, diffusion_autorisee: e.target.checked })}
              />
              Diffusion Autorisée
            </label>
          </div>

          <h3 style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clipboard size={18} /> Notes Internes
          </h3>
          <textarea
            value={formData.notes_internes}
            onChange={(e) => setFormData({ ...formData, notes_internes: e.target.value })}
            placeholder="Notes visibles uniquement par les autorités..."
            rows={4}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
          />

          {/* Actions */}
          <div className={styles.formActions}>
            <button 
              onClick={() => navigate(`/authority/dossiers/${id}`)}
              className={styles.cancelBtn}
            >
              Annuler
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className={styles.saveBtn}
            >
              {isSaving ? <><Loader2 size={16} className={styles.spinner} /> Enregistrement...</> : <><Save size={16} /> Enregistrer</>}
            </button>
          </div>
        </div>
      </div>
    </AuthorityLayout>
  );
};

export default EditDossierPage;
