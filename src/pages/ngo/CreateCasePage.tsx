import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NGOLayout } from './NGOLayout';
import { useAppSelector } from '../../store/types';
import { selectUser } from '../../features/auth/store/authSelectors';
import { supabase } from '../../config';
import { uploadFileToCloudinary } from '../../services/cloudinary';
import { NiveauUrgence, PrecisionLieu, TypeDisparition, TypePhoto, QualiteImage, StatutDossier, StatutIdentite, FiabiliteInformations, Sexe } from '../../@types/enums.types';
import styles from './CreateCasePage.module.css';

type FormState = {
  // Personne
  nom: string;
  prenom: string;
  sexe: Sexe;
  nationalite: string;
  date_naissance: string;
  signes_distinctifs: string;

  // Dossier
  date_disparition: string;
  type_disparition: TypeDisparition;
  niveau_urgence: NiveauUrgence;
  circonstances: string;
  lieu_disparition: string;
  ville_disparition: string;
  region_disparition: string;
  pays_disparition: string;
  precision_lieu: PrecisionLieu;
  visible_public: boolean;
  diffusion_autorisee: boolean;
};

export interface NGOCreateCasePageProps {
  noLayout?: boolean;
  /** Base path for links (e.g. /admin when used from admin org). Default /ngo. Admin uses segment "cas", NGO "cases". */
  basePath?: string;
}

const casesListPath = (basePath: string) => (basePath === '/admin' ? `${basePath}/cas` : `${basePath}/cases`);

export const NGOCreateCasePage: React.FC<NGOCreateCasePageProps> = ({ noLayout = false, basePath = '/ngo' }) => {
  const navigate = useNavigate();
  const currentUser = useAppSelector(selectUser);
  const userId = (currentUser as any)?.id as string | undefined;
  const organisationId = (currentUser as any)?.organisation_id as string | undefined;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormState>({
    nom: '',
    prenom: '',
    sexe: Sexe.INCONNU,
    nationalite: 'Camerounaise',
    date_naissance: '',
    signes_distinctifs: '',

    date_disparition: new Date().toISOString().split('T')[0],
    type_disparition: TypeDisparition.INCONNUE,
    niveau_urgence: NiveauUrgence.NORMAL,
    circonstances: '',
    lieu_disparition: '',
    ville_disparition: '',
    region_disparition: '',
    pays_disparition: 'Cameroun',
    precision_lieu: PrecisionLieu.APPROXIMATIVE,
    visible_public: true,
    diffusion_autorisee: true,
  });

  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return (
      !!userId &&
      form.date_disparition &&
      form.circonstances.trim().length > 0 &&
      form.lieu_disparition.trim().length > 0 &&
      form.pays_disparition.trim().length > 0 &&
      form.nationalite.trim().length > 0
    );
  }, [form, userId]);

  const onChange = (key: keyof FormState, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleUploadPhotos = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setUploadingPhotos(true);
      setError(null);

      const uploads = await Promise.all(
        files.map((file) =>
          uploadFileToCloudinary(file, {
            type: 'personnePhoto',
            tags: ['ngo-case', 'personne'],
          }),
        ),
      );

      const urls = uploads
        .filter((u) => u.success && (u.secureUrl || u.url))
        .map((u) => (u.secureUrl || u.url) as string);

      if (urls.length === 0) {
        throw new Error('Aucune photo n’a pu être uploadée');
      }

      setPhotoUrls((prev) => [...prev, ...urls]);
    } catch (err: any) {
      setError(err?.message || 'Erreur upload photos');
    } finally {
      setUploadingPhotos(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, []);

  const removePhoto = (idx: number) => {
    setPhotoUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = useCallback(async () => {
    if (!userId) {
      setError('Vous devez être connecté');
      return;
    }
    if (!canSubmit) {
      setError('Veuillez compléter les champs obligatoires');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const nomComplet =
        `${form.prenom || ''} ${form.nom || ''}`.trim() || null;

      // 1) Créer la personne
      const { data: personne, error: personneErr } = await (supabase as any)
        .from('personne')
        .insert({
          nom: form.nom || null,
          prenom: form.prenom || null,
          nom_complet: nomComplet,
          sexe: form.sexe,
          nationalite: form.nationalite,
          date_naissance: form.date_naissance || null,
          signes_distinctifs: form.signes_distinctifs || null,
          photo_principale: photoUrls[0] || null,
          statut_identite: StatutIdentite.NON_IDENTIFIE,
          fiabilite_informations: FiabiliteInformations.PROBABLE,
          cree_par: userId,
        })
        .select()
        .single();

      if (personneErr) throw personneErr;

      // 2) Enregistrer les photos (optionnel mais utile pour l’IA et l’historique)
      if (photoUrls.length > 0) {
        const photosToInsert = photoUrls.map((url, index) => ({
          url_cloudinary: url,
          type_photo: TypePhoto.PORTRAIT,
          qualite_image: QualiteImage.BONNE,
          analyse_ia_effectuee: false,
          est_principale: index === 0,
          visible_public: true,
          approuvee: true,
          id_personne: personne.id,
          uploadee_par: userId,
        }));

        await (supabase as any).from('photo').insert(photosToInsert);
      }

      // 3) Créer le dossier
      const { data: dossier, error: dossierErr } = await (supabase as any)
        .from('dossier_disparition')
        .insert({
          id_personne: personne.id,
          id_utilisateur_createur: userId,
          id_organisation_responsable: organisationId || null,

          date_disparition: new Date(form.date_disparition).toISOString(),
          lieu_disparition: form.lieu_disparition,
          ville_disparition: form.ville_disparition || null,
          region_disparition: form.region_disparition || null,
          pays_disparition: form.pays_disparition,
          precision_lieu: form.precision_lieu,

          circonstances: form.circonstances,
          type_disparition: form.type_disparition,
          niveau_urgence: form.niveau_urgence,

          statut_dossier: StatutDossier.EN_COURS,
          visible_public: form.visible_public,
          diffusion_autorisee: form.diffusion_autorisee,
          diffusion_medias: false,
          diffusion_reseaux_sociaux: false,
          rayon_diffusion_km: 50,
        })
        .select()
        .single();

      if (dossierErr) throw dossierErr;

      // 4) Journal activité (utilisé par le dashboard ONG)
      try {
        await (supabase as any).from('journal_activite').insert({
          type_action: 'creation_dossier',
          action_detaillee: 'creation_dossier_ong',
          description: `Création dossier ONG: ${dossier.numero_dossier || dossier.id}`,
          id_utilisateur: userId,
          id_dossier: dossier.id,
          date_action: new Date().toISOString(),
        });
      } catch {
        // best effort
      }

      setSuccess('Dossier créé avec succès.');
      setTimeout(() => navigate(casesListPath(basePath)), 700);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  }, [basePath, canSubmit, form, navigate, organisationId, photoUrls, userId]);

  const pageContent = (
      <div className={styles.container}>
        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        <div className={styles.card}>
          <h3>Personne</h3>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label>Prénom</label>
              <input value={form.prenom} onChange={(e) => onChange('prenom', e.target.value)} />
            </div>
            <div className={styles.field}>
              <label>Nom</label>
              <input value={form.nom} onChange={(e) => onChange('nom', e.target.value)} />
            </div>
            <div className={styles.field}>
              <label>Sexe</label>
              <select value={form.sexe} onChange={(e) => onChange('sexe', e.target.value)}>
                <option value={Sexe.MASCULIN}>Masculin</option>
                <option value={Sexe.FEMININ}>Féminin</option>
                <option value={Sexe.INCONNU}>Inconnu</option>
                <option value={Sexe.NON_PRECISE}>Non précisé</option>
              </select>
            </div>
            <div className={styles.field}>
              <label>Nationalité *</label>
              <input value={form.nationalite} onChange={(e) => onChange('nationalite', e.target.value)} />
            </div>
            <div className={styles.field}>
              <label>Date de naissance (optionnel)</label>
              <input type="date" value={form.date_naissance} onChange={(e) => onChange('date_naissance', e.target.value)} />
            </div>
            <div className={styles.field}>
              <label>Signes distinctifs (optionnel)</label>
              <input value={form.signes_distinctifs} onChange={(e) => onChange('signes_distinctifs', e.target.value)} />
            </div>
          </div>

          <div className={styles.field} style={{ marginTop: 12 }}>
            <label>Photos (optionnel)</label>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhotos || submitting}
              >
                {uploadingPhotos ? 'Upload…' : 'Ajouter des photos'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleUploadPhotos}
                style={{ display: 'none' }}
              />
            </div>
            {photoUrls.length > 0 && (
              <div className={styles.photosRow} style={{ marginTop: 10 }}>
                {photoUrls.map((url, idx) => (
                  <div key={url} className={styles.photoItem}>
                    <img src={url} alt={`photo-${idx}`} />
                    <button type="button" className={styles.removePhoto} onClick={() => removePhoto(idx)}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.card}>
          <h3>Dossier</h3>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label>Date de disparition *</label>
              <input type="date" value={form.date_disparition} onChange={(e) => onChange('date_disparition', e.target.value)} />
            </div>
            <div className={styles.field}>
              <label>Type de disparition *</label>
              <select value={form.type_disparition} onChange={(e) => onChange('type_disparition', e.target.value)}>
                {Object.values(TypeDisparition).map((v) => (
                  <option key={v} value={v}>
                    {v.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label>Niveau d’urgence *</label>
              <select value={form.niveau_urgence} onChange={(e) => onChange('niveau_urgence', e.target.value)}>
                {Object.values(NiveauUrgence).map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label>Précision du lieu *</label>
              <select value={form.precision_lieu} onChange={(e) => onChange('precision_lieu', e.target.value)}>
                {Object.values(PrecisionLieu).map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label>Pays *</label>
              <input value={form.pays_disparition} onChange={(e) => onChange('pays_disparition', e.target.value)} />
            </div>
            <div className={styles.field}>
              <label>Région</label>
              <input value={form.region_disparition} onChange={(e) => onChange('region_disparition', e.target.value)} />
            </div>
            <div className={styles.field}>
              <label>Ville</label>
              <input value={form.ville_disparition} onChange={(e) => onChange('ville_disparition', e.target.value)} />
            </div>
            <div className={styles.field}>
              <label>Lieu (adresse/zone) *</label>
              <input value={form.lieu_disparition} onChange={(e) => onChange('lieu_disparition', e.target.value)} />
            </div>
          </div>

          <div className={styles.field} style={{ marginTop: 12 }}>
            <label>Circonstances *</label>
            <textarea
              rows={4}
              value={form.circonstances}
              onChange={(e) => onChange('circonstances', e.target.value)}
              placeholder="Décrire la disparition (contexte, dernière observation, etc.)"
            />
          </div>

          <div className={styles.actions} style={{ marginTop: 12 }}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={form.visible_public}
                onChange={(e) => onChange('visible_public', e.target.checked)}
              />
              Visible au public
            </label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={form.diffusion_autorisee}
                onChange={(e) => onChange('diffusion_autorisee', e.target.checked)}
              />
              Diffusion autorisée
            </label>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.secondaryBtn} type="button" onClick={() => navigate(casesListPath(basePath))} disabled={submitting}>
            Annuler
          </button>
          <button className={styles.primaryBtn} type="button" onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting ? 'Création…' : 'Créer le dossier'}
          </button>
        </div>
      </div>
  );

  if (noLayout) return pageContent;
  return (
    <NGOLayout>
      {pageContent}
    </NGOLayout>
  );
};

