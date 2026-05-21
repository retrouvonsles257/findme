/**
 * Nouvelle pré-déclaration citoyenne (formulaire structuré + message initial optionnel)
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../hooks';
import { useAppSelector } from '../../store/types';
import { selectUser } from '../../features/auth/store/authSelectors';
import { CitizenLayout } from './CitizenLayout';
import {
  createPreDeclarationWithConversation,
  listOrganisationsForPreDeclaration,
} from '../../features/preDeclarations/preDeclarationApi';
import { useNotification } from '../../contexts';
import { DisappearanceLocationFields } from '../../components/forms/DisappearanceLocationFields';
import styles from './PreDeclarationCommon.module.css';

const TYPES = [
  'fugue',
  'enlevement_presume',
  'accident',
  'conflit_arme',
  'migration',
  'catastrophe_naturelle',
  'disparition_volontaire',
  'inconnue',
  'autre',
] as const;

const URG = ['critique', 'urgent', 'normal', 'faible'] as const;

const SEXES = ['masculin', 'feminin', 'inconnu', 'non_precise'] as const;

export const CitizenPreDeclarationNewPage: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const currentUser = useAppSelector(selectUser);
  const userId = (currentUser as any)?.id;

  const [orgs, setOrgs] = useState<{ id: string; nom: string; region: string | null }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const lastSubmit = useRef(0);

  const [idOrganisation, setIdOrganisation] = useState('');
  const [nomPersonne, setNomPersonne] = useState('');
  const [prenomPersonne, setPrenomPersonne] = useState('');
  const [sexe, setSexe] = useState<(typeof SEXES)[number]>('masculin');
  const [dateNaissance, setDateNaissance] = useState('');
  const [nationalite, setNationalite] = useState('Camerounaise');
  const [dateDisparition, setDateDisparition] = useState(() => new Date().toISOString().split('T')[0]);
  const [lieu, setLieu] = useState('');
  const [ville, setVille] = useState('');
  const [region, setRegion] = useState('');
  const [pays, setPays] = useState('Cameroun');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [typeDisparition, setTypeDisparition] = useState<string>('inconnue');
  const [niveauUrgence, setNiveauUrgence] = useState<string>('normal');
  const [circonstances, setCirconstances] = useState('');
  const [infos, setInfos] = useState('');
  const [contactNom, setContactNom] = useState('');
  const [contactTel, setContactTel] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [messageInitial, setMessageInitial] = useState('');

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        const o = await listOrganisationsForPreDeclaration();
        if (c) return;
        setOrgs(o);
        if (o.length === 1) setIdOrganisation(o[0].id);
      } catch {
        if (!c) setErr(t('citizen.preDeclaration.orgLoadError'));
      }
    })();
    return () => {
      c = true;
    };
  }, [t]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setErr(null);
      if (!userId) {
        setErr(t('citizen.preDeclaration.mustLogin'));
        return;
      }
      if (!idOrganisation) {
        setErr(t('citizen.preDeclaration.orgRequired'));
        return;
      }
      if (!nomPersonne.trim() || !circonstances.trim()) {
        setErr(t('citizen.preDeclaration.requiredFields'));
        return;
      }
      const now = Date.now();
      if (now - lastSubmit.current < 12_000) {
        setErr(t('citizen.submitThrottled'));
        return;
      }
      lastSubmit.current = now;

      setSubmitting(true);
      try {
        const { preDeclaration } = await createPreDeclarationWithConversation(userId, {
          id_organisation: idOrganisation,
          nom_personne: nomPersonne.trim(),
          prenom_personne: prenomPersonne.trim(),
          sexe,
          date_naissance: dateNaissance || null,
          nationalite,
          date_disparition: dateDisparition,
          lieu_disparition: lieu || null,
          ville_disparition: ville || null,
          region_disparition: region || null,
          pays_disparition: pays,
          latitude_disparition: latitude,
          longitude_disparition: longitude,
          type_disparition: typeDisparition,
          niveau_urgence: niveauUrgence,
          circonstances: circonstances.trim(),
          infos_complementaires: infos.trim() || null,
          contact_nom: contactNom.trim() || null,
          contact_telephone: contactTel.trim() || null,
          contact_email: contactEmail.trim() || null,
          message_initial: messageInitial.trim() || null,
        });
        addNotification({
          title: t('citizen.preDeclaration.submitSuccessTitle'),
          message: t('citizen.preDeclaration.submitSuccessBody'),
          type: 'success',
        });
        navigate(`/citizen/pre-declarations/${preDeclaration.id}`);
      } catch (ex: any) {
        setErr(ex?.message || t('citizen.preDeclaration.submitError'));
      } finally {
        setSubmitting(false);
      }
    },
    [
      userId,
      idOrganisation,
      nomPersonne,
      prenomPersonne,
      sexe,
      dateNaissance,
      nationalite,
      dateDisparition,
      lieu,
      ville,
      region,
      pays,
      latitude,
      longitude,
      typeDisparition,
      niveauUrgence,
      circonstances,
      infos,
      contactNom,
      contactTel,
      contactEmail,
      messageInitial,
      navigate,
      addNotification,
      t,
    ],
  );

  return (
    <CitizenLayout activeNav="pre-declarations" contentVariant="flush">
      <div className={styles.pageBleed}>
        <header className={styles.pageHeaderCard}>
          <div className={styles.headerRow}>
            <div>
              <h1 className={styles.title}>{t('citizen.preDeclaration.formTitle')}</h1>
              <p className={styles.subtitle}>{t('citizen.preDeclaration.formSubtitle')}</p>
            </div>
          </div>
        </header>

        <div className={styles.privacyBanner}>{t('citizen.preDeclaration.privacyNotice')}</div>

        {err && <div className={styles.errorBox}>{err}</div>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label>{t('citizen.preDeclaration.fieldOrganisation')}</label>
            <select value={idOrganisation} onChange={(e) => setIdOrganisation(e.target.value)} required>
              <option value="">{t('citizen.preDeclaration.orgPlaceholder')}</option>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nom}
                  {o.region ? ` — ${o.region}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.grid2}>
            <div className={styles.field}>
              <label>{t('citizen.preDeclaration.fieldPrenom')}</label>
              <input value={prenomPersonne} onChange={(e) => setPrenomPersonne(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label>{t('citizen.preDeclaration.fieldNom')}</label>
              <input value={nomPersonne} onChange={(e) => setNomPersonne(e.target.value)} required />
            </div>
          </div>

          <div className={styles.grid2}>
            <div className={styles.field}>
              <label>{t('citizen.preDeclaration.fieldSexe')}</label>
              <select value={sexe} onChange={(e) => setSexe(e.target.value as any)}>
                {SEXES.map((s) => (
                  <option key={s} value={s}>
                    {t(`citizen.preDeclaration.sexe.${s}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label>{t('citizen.preDeclaration.fieldDateNaissance')}</label>
              <input type="date" value={dateNaissance} onChange={(e) => setDateNaissance(e.target.value)} />
            </div>
          </div>

          <div className={styles.field}>
            <label>{t('citizen.preDeclaration.fieldNationalite')}</label>
            <input value={nationalite} onChange={(e) => setNationalite(e.target.value)} />
          </div>

          <div className={styles.grid2}>
            <div className={styles.field}>
              <label>{t('citizen.preDeclaration.fieldDateDisparition')}</label>
              <input type="date" value={dateDisparition} onChange={(e) => setDateDisparition(e.target.value)} required />
            </div>
            <div className={styles.field}>
              <label>{t('citizen.preDeclaration.fieldNiveauUrgence')}</label>
              <select value={niveauUrgence} onChange={(e) => setNiveauUrgence(e.target.value)}>
                {URG.map((u) => (
                  <option key={u} value={u}>
                    {t(`citizen.preDeclaration.urgence.${u}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label>{t('citizen.preDeclaration.fieldTypeDisparition')}</label>
            <select value={typeDisparition} onChange={(e) => setTypeDisparition(e.target.value)}>
              {TYPES.map((ty) => (
                <option key={ty} value={ty}>
                  {t(`citizen.preDeclaration.typeDisparition.${ty}`)}
                </option>
              ))}
            </select>
          </div>

          <DisappearanceLocationFields
            value={{
              lieu_disparition: lieu,
              ville_disparition: ville,
              region_disparition: region,
              pays_disparition: pays,
              latitude_disparition: latitude,
              longitude_disparition: longitude,
            }}
            onChange={(patch) => {
              if (patch.lieu_disparition !== undefined) setLieu(patch.lieu_disparition);
              if (patch.ville_disparition !== undefined) setVille(patch.ville_disparition);
              if (patch.region_disparition !== undefined) setRegion(patch.region_disparition);
              if (patch.pays_disparition !== undefined) setPays(patch.pays_disparition);
              if (patch.latitude_disparition !== undefined) setLatitude(patch.latitude_disparition);
              if (patch.longitude_disparition !== undefined) setLongitude(patch.longitude_disparition);
            }}
          />

          <div className={styles.field}>
            <label>{t('citizen.preDeclaration.fieldCirconstances')}</label>
            <textarea value={circonstances} onChange={(e) => setCirconstances(e.target.value)} required />
          </div>

          <div className={styles.field}>
            <label>{t('citizen.preDeclaration.fieldInfos')}</label>
            <textarea value={infos} onChange={(e) => setInfos(e.target.value)} />
          </div>

          <div className={styles.grid2}>
            <div className={styles.field}>
              <label>{t('citizen.preDeclaration.fieldContactNom')}</label>
              <input value={contactNom} onChange={(e) => setContactNom(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label>{t('citizen.preDeclaration.fieldContactTel')}</label>
              <input value={contactTel} onChange={(e) => setContactTel(e.target.value)} />
            </div>
          </div>

          <div className={styles.field}>
            <label>{t('citizen.preDeclaration.fieldContactEmail')}</label>
            <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
          </div>

          <div className={styles.field}>
            <label>{t('citizen.preDeclaration.fieldMessageInitial')}</label>
            <textarea value={messageInitial} onChange={(e) => setMessageInitial(e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button type="submit" className={styles.primaryBtn} disabled={submitting}>
              {submitting ? t('common.loading') : t('citizen.preDeclaration.submit')}
            </button>
            <button type="button" className={styles.secondaryBtn} onClick={() => navigate('/citizen/pre-declarations')}>
              {t('citizen.cancel')}
            </button>
          </div>
        </form>
      </div>
    </CitizenLayout>
  );
};
