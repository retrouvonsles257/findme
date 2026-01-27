/**
 * =====================================================
 * RETROUVONSLES - Create Alerte Page
 * Création d'une nouvelle alerte
 * Connecté à Supabase
 * =====================================================
 */

import React, { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts';
import { useNotification } from '../../contexts';
import { useDossiers } from '../../features/dossiers/hooks/useDossiers';
import { createAlerte } from '../../features/alertes/services/alerteAPI';
import { TypeAlerte as TypeAlerteEnum } from '../../@types/enums.types';
import { AuthorityLayout } from '../../components/layout';
import {
  MapPin,
  Save,
  Megaphone,
  Loader2,
  Eye,
  Bell,
  FileText,
  Radio,
  Smartphone,
  Mail,
  MessageSquare,
  ArrowLeft,
} from 'lucide-react';
import styles from './CreateAlertePage.module.css';

export const CreateAlertePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedDossierId = searchParams.get('dossier');
  
  useAuth(); // Hook call for auth context
  const { addNotification } = useNotification();
  const { dossiers } = useDossiers();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    titre: '',
    message: '',
    message_court: '',
    type_alerte: TypeAlerteEnum.DISPARITION_STANDARD,
    id_dossier: preselectedDossierId || '',
    rayon_km: 50,
    canaux_diffusion: ['push', 'in_app'] as string[],
    niveau_urgence_min: 1,
  });

  // Toggle canal de diffusion
  const toggleCanal = (canal: string) => {
    setFormData(prev => ({
      ...prev,
      canaux_diffusion: prev.canaux_diffusion.includes(canal)
        ? prev.canaux_diffusion.filter(c => c !== canal)
        : [...prev.canaux_diffusion, canal],
    }));
  };

  // Validation
  const validateForm = (): boolean => {
    if (!formData.titre.trim()) {
      addNotification({
        title: 'Champ requis',
        message: 'Le titre est obligatoire',
        type: 'error',
      });
      return false;
    }
    if (!formData.message.trim()) {
      addNotification({
        title: 'Champ requis',
        message: 'Le message est obligatoire',
        type: 'error',
      });
      return false;
    }
    if (!formData.id_dossier) {
      addNotification({
        title: 'Champ requis',
        message: 'Veuillez sélectionner un dossier',
        type: 'error',
      });
      return false;
    }
    return true;
  };

  // Soumission
  const handleSubmit = useCallback(async (publishNow: boolean) => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const alerte = await createAlerte({
        titre: formData.titre,
        message: formData.message,
        message_court: formData.message_court || formData.message.substring(0, 200),
        type_alerte: formData.type_alerte as any,
        id_dossier: formData.id_dossier,
        rayon_km: formData.rayon_km,
        canaux_diffusion: formData.canaux_diffusion,
        niveau_urgence_min: formData.niveau_urgence_min,
      });

      addNotification({
        title: 'Alerte créée',
        message: publishNow 
          ? 'L\'alerte a été créée et sera diffusée'
          : 'L\'alerte a été enregistrée en brouillon',
        type: 'success',
      });

      navigate(`/authority/alertes/${alerte.id}`);
    } catch (err: any) {
      addNotification({
        title: 'Erreur',
        message: err.message || 'Erreur lors de la création',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, addNotification, navigate]);

  // Dossiers actifs uniquement
  const activeDossiers = dossiers.filter((d: any) => 
    d.statut_dossier === 'en_cours' && d.diffusion_autorisee !== false
  );

  return (
    <AuthorityLayout
    >
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h1><Megaphone size={24} /> Créer une Alerte</h1>
          <p className={styles.subtitle}>
            Diffusez une alerte aux utilisateurs pour retrouver une personne disparue
          </p>
        </div>

        {/* Form */}
        <div className={styles.formContainer}>
          <div className={styles.formSection}>
            <h2><FileText size={20} /> Informations de l'alerte</h2>

            <div className={styles.formGroup}>
              <label>Dossier lié *</label>
              <select
                value={formData.id_dossier}
                onChange={(e) => setFormData({ ...formData, id_dossier: e.target.value })}
                required
              >
                <option value="">-- Sélectionner un dossier --</option>
                {activeDossiers.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.numero_dossier || `DOS-${d.id.substring(0, 6)}`} 
                    {d.personne?.nom && ` - ${d.personne.prenom} ${d.personne.nom}`}
                  </option>
                ))}
              </select>
              {activeDossiers.length === 0 && (
                <small style={{ color: '#999', marginTop: '4px' }}>
                  Aucun dossier actif avec diffusion autorisée
                </small>
              )}
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Type d'alerte *</label>
                <select
                  value={formData.type_alerte}
                  onChange={(e) => setFormData({ ...formData, type_alerte: e.target.value as any })}
                >
                  <option value={TypeAlerteEnum.DISPARITION_STANDARD}>Disparition standard</option>
                  <option value={TypeAlerteEnum.DISPARITION_ENFANT}>Disparition d'enfant</option>
                  <option value={TypeAlerteEnum.DISPARITION_ADULTE_VULNERABLE}>Disparition d'adulte vulnérable</option>
                  <option value={TypeAlerteEnum.AMBER_ALERT}>Alerte Amber</option>
                  <option value={TypeAlerteEnum.MISE_A_JOUR}>Mise à jour</option>
                  <option value={TypeAlerteEnum.PERSONNE_RETROUVEE}>Personne retrouvée</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Rayon de diffusion (km)</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={formData.rayon_km}
                  onChange={(e) => setFormData({ ...formData, rayon_km: parseInt(e.target.value) || 50 })}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Titre de l'alerte *</label>
              <input
                type="text"
                value={formData.titre}
                onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                placeholder="Ex: Disparition inquiétante à Yaoundé"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Message complet *</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Description détaillée de la disparition, signes particuliers, dernière localisation..."
                rows={6}
                required
              />
              <small>{formData.message.length} caractères</small>
            </div>

            <div className={styles.formGroup}>
              <label>Message court (pour notifications push)</label>
              <textarea
                value={formData.message_court}
                onChange={(e) => setFormData({ ...formData, message_court: e.target.value })}
                placeholder="Version courte du message (max 200 caractères)"
                rows={2}
                maxLength={200}
              />
              <small>{formData.message_court.length}/200 caractères</small>
            </div>
          </div>

          <div className={styles.formSection}>
            <h2><Radio size={20} /> Canaux de diffusion</h2>
            
            <div className={styles.canaux}>
              {[
                { id: 'push', icon: Smartphone, label: 'Push Notifications', desc: 'Notifications sur mobile' },
                { id: 'in_app', icon: Bell, label: 'In-App', desc: 'Notifications dans l\'application' },
                { id: 'email', icon: Mail, label: 'Email', desc: 'Par courrier électronique' },
                { id: 'sms', icon: MessageSquare, label: 'SMS', desc: 'Par message texte' },
              ].map(canal => {
                const Icon = canal.icon;
                return (
                  <label key={canal.id} className={styles.canalItem}>
                    <input
                      type="checkbox"
                      checked={formData.canaux_diffusion.includes(canal.id)}
                      onChange={() => toggleCanal(canal.id)}
                    />
                    <div className={styles.canalInfo}>
                      <span className={styles.canalLabel}>
                        <Icon size={16} /> {canal.label}
                      </span>
                      <span className={styles.canalDesc}>{canal.desc}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Preview */}
          {formData.titre && (
            <div className={styles.preview}>
              <h3><Eye size={18} /> Aperçu</h3>
              <div className={styles.previewCard}>
                <div className={styles.previewHeader}>
                  <span className={styles.previewType}>
                    {formData.type_alerte.toUpperCase()}
                  </span>
                  <span className={styles.previewRadius}>
                    <MapPin size={14} /> {formData.rayon_km} km
                  </span>
                </div>
                <h4>{formData.titre}</h4>
                <p>{formData.message_court || formData.message.substring(0, 200)}...</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className={styles.actions}>
            <button 
              onClick={() => navigate('/authority/alertes')}
              className={styles.cancelBtn}
              disabled={isSubmitting}
            >
              <ArrowLeft size={16} /> Annuler
            </button>
            <button 
              onClick={() => handleSubmit(false)}
              className={styles.draftBtn}
              disabled={isSubmitting}
            >
              <Save size={16} /> Enregistrer brouillon
            </button>
            <button 
              onClick={() => handleSubmit(true)}
              className={styles.publishBtn}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <><Loader2 size={16} className={styles.spinner} /> Création...</>
              ) : (
                <><Megaphone size={16} /> Créer et Publier</>
              )}
            </button>
          </div>
        </div>
      </div>
    </AuthorityLayout>
  );
};

export default CreateAlertePage;
