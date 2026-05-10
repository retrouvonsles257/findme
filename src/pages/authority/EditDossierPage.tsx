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
import { patchDossierAndNotify } from '../../features/dossiers/services/dossierAPI';
import { AuthorityLayout } from '../../components/layout';
import { useI18n } from '../../hooks';
import { AdminDetailSkeleton } from 'components/skeletons';
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
  Clipboard
} from 'lucide-react';
import styles from './EditDossierPage.module.css';

export const EditDossierPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  useAuth(); // Hook call for auth context
  const { addNotification } = useNotification();
  const { t } = useI18n();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [dossier, setDossier] = useState<any>(null);
  const [personne, setPersonne] = useState<any>(null);
  const [initialInternalNotes, setInitialInternalNotes] = useState<string>('');

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
    contact_email: '',
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

        // Charger la dernière note interne (commentaire confidentiel de type note_enquete)
        const { data: note } = await (supabase as any)
          .from('commentaire')
          .select('id, contenu')
          .eq('id_dossier', id)
          .eq('type_commentaire', 'note_enquete')
          .eq('confidentiel', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const loadedNote = (note?.contenu as string | undefined) || '';
        setInitialInternalNotes(loadedNote);

        setFormData({
          niveau_urgence: dossierData.niveau_urgence || 'normal',
          statut_dossier: dossierData.statut_dossier || 'en_cours',
          lieu_disparition: dossierData.lieu_disparition || '',
          ville_disparition: dossierData.ville_disparition || '',
          circonstances: dossierData.circonstances || '',
          // Les vêtements / objets sont sur la table personne (schéma SQL)
          vetements_portes: dossierData.personne?.derniers_vetements_portes || '',
          objets_personnels: dossierData.personne?.accessoires || '',
          derniere_activite_connue: dossierData.derniere_activite_connue || '',
          visible_public: dossierData.visible_public ?? true,
          diffusion_autorisee: dossierData.diffusion_autorisee ?? true,
          // Schéma SQL: contact_famille_principale / telephone_contact / email_contact
          contact_nom: dossierData.contact_famille_principale || '',
          contact_telephone: dossierData.telephone_contact || '',
          contact_email: dossierData.email_contact || '',
          // Notes internes via table commentaire
          notes_internes: loadedNote,
        });
      } catch (err: any) {
        // Erreur gérée par la notification
        addNotification({
          title: t('authority.editDossier.messages.error'),
          message: t('authority.editDossier.messages.loadError'),
          type: 'error',
        });
        navigate('/authority/dossiers');
      } finally {
        setIsLoading(false);
      }
    };

    loadDossier();
  }, [id, addNotification, navigate, t]);

  // Sauvegarder les modifications
  const handleSave = useCallback(async () => {
    if (!id) return;

    setIsSaving(true);
    try {
      const nowIso = new Date().toISOString();
      const status = formData.statut_dossier;
      const shouldSetResolution = status.includes('retrouve') || status === 'classe_sans_suite';

      // 1) Mettre à jour le dossier + notifications push si le statut change
      await patchDossierAndNotify(id, {
        niveau_urgence: formData.niveau_urgence,
        statut_dossier: formData.statut_dossier,
        lieu_disparition: formData.lieu_disparition,
        ville_disparition: formData.ville_disparition,
        circonstances: formData.circonstances,
        derniere_activite_connue: formData.derniere_activite_connue,
        visible_public: formData.visible_public,
        diffusion_autorisee: formData.diffusion_autorisee,
        contact_famille_principale: formData.contact_nom,
        telephone_contact: formData.contact_telephone,
        email_contact: formData.contact_email,
        updated_at: nowIso,
        date_resolution: shouldSetResolution ? (dossier?.date_resolution || nowIso) : null,
      });

      // 2) Mettre à jour la personne liée (vêtements / accessoires)
      const personneId = dossier?.id_personne as string | undefined;
      if (personneId) {
        const { error: personneError } = await (supabase as any)
          .from('personne')
          .update({
            derniers_vetements_portes: formData.vetements_portes,
            accessoires: formData.objets_personnels,
            updated_at: nowIso,
          })
          .eq('id', personneId);
        if (personneError) throw personneError;
      }

      // 3) Notes internes (commentaire confidentiel) si changé
      if ((formData.notes_internes || '').trim() !== (initialInternalNotes || '').trim()) {
        const user = (await supabase.auth.getUser()).data.user;
        const contenu = (formData.notes_internes || '').trim();
        if (contenu) {
          const { error: noteError } = await (supabase as any).from('commentaire').insert({
            contenu,
            type_commentaire: 'note_enquete',
            confidentiel: true,
            modifie: true,
            id_dossier: id,
            id_utilisateur: user?.id,
            created_at: nowIso,
            updated_at: nowIso,
          });
          if (noteError) throw noteError;
        }
      }

      addNotification({
        title: t('authority.editDossier.messages.saved'),
        message: t('authority.editDossier.messages.updated'),
        type: 'success',
      });

      navigate(`/authority/dossiers/${id}`);
    } catch (err: any) {
      addNotification({
        title: t('authority.editDossier.messages.error'),
        message: err.message || t('authority.editDossier.messages.saveError'),
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  }, [id, formData, addNotification, navigate, t, dossier?.id_personne, dossier?.date_resolution, initialInternalNotes]);

  if (isLoading) {
    return (
      <AuthorityLayout>
        <div className={styles.skeletonWrap}>
          <AdminDetailSkeleton blockCount={3} linesPerBlock={4} />
        </div>
      </AuthorityLayout>
    );
  }

  if (!dossier) {
    return (
      <AuthorityLayout>
        <div className={styles.emptyState}>
          <AlertTriangle size={48} />
          <p>{t('authority.editDossier.notFound')}</p>
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
            <h1>{t('authority.editDossier.title')}</h1>
            <p className={styles.subtitle}>
              {dossier.numero_dossier} - {personne?.prenom} {personne?.nom}
            </p>
          </div>
          <button 
            onClick={() => navigate(`/authority/dossiers/${id}`)}
            className={styles.backBtn}
          >
            <ArrowLeft size={18} /> {t('authority.editDossier.backToDossier')}
          </button>
        </div>

        {/* Personne Info (lecture seule) */}
        <div className={styles.infoCard}>
          <h3><User size={18} /> {t('authority.editDossier.personInfo.title')}</h3>
          <div className={styles.infoGrid}>
            <p><strong>{t('authority.editDossier.personInfo.name')}:</strong> {personne?.prenom} {personne?.nom}</p>
            <p><strong>{t('authority.editDossier.personInfo.birthDate')}:</strong> {personne?.date_naissance || t('authority.editDossier.personInfo.notAvailable')}</p>
            <p><strong>{t('authority.editDossier.personInfo.gender')}:</strong> {personne?.sexe || t('authority.editDossier.personInfo.notAvailable')}</p>
          </div>
        </div>

        {/* Formulaire */}
        <div className={styles.formContainer}>
          <h2><FileText size={20} /> {t('authority.editDossier.form.detailsTitle')}</h2>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>{t('authority.editDossier.form.status')}</label>
              <select
                value={formData.statut_dossier}
                onChange={(e) => setFormData({ ...formData, statut_dossier: e.target.value })}
              >
                <option value="en_cours">{t('authority.dossiers.status.en_cours')}</option>
                <option value="suspendu">{t('authority.dossiers.status.suspendu')}</option>
                <option value="retrouve_vivant">{t('authority.dossiers.status.retrouve_vivant')}</option>
                <option value="retrouve_decede">{t('authority.dossiers.status.retrouve_decede')}</option>
                <option value="classe_sans_suite">{t('authority.dossiers.status.classe_sans_suite')}</option>
                <option value="transfere">{t('authority.dossiers.status.transfere')}</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>{t('authority.editDossier.form.urgency')}</label>
              <select
                value={formData.niveau_urgence}
                onChange={(e) => setFormData({ ...formData, niveau_urgence: e.target.value })}
                className={styles.urgenceSelect}
              >
                <option value="critique">{t('authority.dossiers.urgency.critique')}</option>
                <option value="urgent">{t('authority.dossiers.urgency.urgent')}</option>
                <option value="normal">{t('authority.dossiers.urgency.normal')}</option>
                <option value="faible">{t('authority.dossiers.urgency.faible')}</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>{t('authority.editDossier.form.disappearanceLocation')}</label>
              <input
                type="text"
                value={formData.lieu_disparition}
                onChange={(e) => setFormData({ ...formData, lieu_disparition: e.target.value })}
                placeholder={t('authority.editDossier.form.locationPlaceholder')}
              />
            </div>

            <div className={styles.formGroup}>
              <label>{t('authority.editDossier.form.city')}</label>
              <input
                type="text"
                value={formData.ville_disparition}
                onChange={(e) => setFormData({ ...formData, ville_disparition: e.target.value })}
              />
            </div>

            <div className={styles.formGroupFull}>
              <label>{t('authority.editDossier.form.circonstances')}</label>
              <textarea
                value={formData.circonstances}
                onChange={(e) => setFormData({ ...formData, circonstances: e.target.value })}
                rows={4}
              />
            </div>

            <div className={styles.formGroup}>
              <label>{t('authority.editDossier.form.clothing')}</label>
              <textarea
                value={formData.vetements_portes}
                onChange={(e) => setFormData({ ...formData, vetements_portes: e.target.value })}
                rows={3}
              />
            </div>

            <div className={styles.formGroup}>
              <label>{t('authority.editDossier.form.personalItems')}</label>
              <textarea
                value={formData.objets_personnels}
                onChange={(e) => setFormData({ ...formData, objets_personnels: e.target.value })}
                rows={3}
              />
            </div>

            <div className={styles.formGroupFull}>
              <label>{t('authority.editDossier.form.lastKnownActivity')}</label>
              <textarea
                value={formData.derniere_activite_connue}
                onChange={(e) => setFormData({ ...formData, derniere_activite_connue: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <h3 style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Phone size={18} /> {t('authority.editDossier.form.contactTitle')}
          </h3>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>{t('authority.editDossier.form.contactName')}</label>
              <input
                type="text"
                value={formData.contact_nom}
                onChange={(e) => setFormData({ ...formData, contact_nom: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label>{t('authority.editDossier.form.phone')}</label>
              <input
                type="tel"
                value={formData.contact_telephone}
                onChange={(e) => setFormData({ ...formData, contact_telephone: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label>{t('authority.dossierDetail.fields.email')}</label>
              <input
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              />
            </div>
          </div>

          <h3 style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={18} /> {t('authority.editDossier.form.optionsTitle')}
          </h3>
          <div className={styles.checkboxGroup}>
            <label>
              <input
                type="checkbox"
                checked={formData.visible_public}
                onChange={(e) => setFormData({ ...formData, visible_public: e.target.checked })}
              />
              {t('authority.editDossier.form.visiblePublic')}
            </label>
            <label>
              <input
                type="checkbox"
                checked={formData.diffusion_autorisee}
                onChange={(e) => setFormData({ ...formData, diffusion_autorisee: e.target.checked })}
              />
              {t('authority.editDossier.form.diffusionAuthorized')}
            </label>
          </div>

          <h3 style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clipboard size={18} /> {t('authority.editDossier.form.internalNotesTitle')}
          </h3>
          <textarea
            value={formData.notes_internes}
            onChange={(e) => setFormData({ ...formData, notes_internes: e.target.value })}
            placeholder={t('authority.editDossier.form.internalNotesPlaceholder')}
            rows={4}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
          />

          {/* Actions */}
          <div className={styles.formActions}>
            <button 
              onClick={() => navigate(`/authority/dossiers/${id}`)}
              className={styles.cancelBtn}
            >
              {t('authority.editDossier.actions.cancel')}
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className={styles.saveBtn}
            >
              {isSaving ? <><Loader2 size={16} className={styles.spinner} /> {t('authority.editDossier.actions.saving')}</> : <><Save size={16} /> {t('authority.editDossier.actions.save')}</>}
            </button>
          </div>
        </div>
      </div>
    </AuthorityLayout>
  );
};

export default EditDossierPage;
