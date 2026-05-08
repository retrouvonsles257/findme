import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Building, Users, Bell, Shield, Lock, AlertTriangle, Trash2, Save, MapPin, Plus, Award, Cpu } from 'lucide-react';
import { useAppSelector } from '../../store/types';
import { useI18n } from '../../hooks';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { getAdminOrganisation, updateAdminOrganisation, type ZoneCompetence, type CertificationAccreditation, type IAConfigOrganisation } from '../../features/authority/services';
import { logActivity } from '../../services/audit/auditService';
import { NomRole, TypeAction } from '../../@types/enums.types';
import { AdminDetailSkeleton } from 'components/skeletons';
import styles from './organisation/OrganisationSettings.module.css';

export const OrganisationSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const currentUser = useAppSelector(selectCurrentUser);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'team' | 'notifications' | 'zones' | 'certifications' | 'ia' | 'security'>('general');
  const [formData, setFormData] = useState({ organisationName: '', email: '', phone: '', address: '', website: '', description: '' });
  const [notificationSettings, setNotificationSettings] = useState({ emailNewDossier: true, emailNewReport: true, emailAlerts: true, smsUrgent: true, slackNotifications: false });
  const [teamSettings, setTeamSettings] = useState({ maxMembers: 50, autoAssign: true, requireApproval: true });
  const [zones, setZones] = useState<ZoneCompetence[]>([]);
  const [certifications, setCertifications] = useState<CertificationAccreditation[]>([]);
  const [iaConfig, setIaConfig] = useState<IAConfigOrganisation>({ seuil_reconnaissance_faciale: 0.85, analyse_auto_activee: true, priorite_analyse: 'normale' });

  const getMergedParametres = () => ({ team: teamSettings, notifications: notificationSettings, zones_competence: zones, certifications, ia_config: iaConfig });

  useEffect(() => {
    if (!currentUser?.organisation_id || currentUser.role !== NomRole.AUTORITE) {
      navigate('/auth/login');
      return;
    }
    getAdminOrganisation(currentUser.organisation_id)
      .then(org => {
        if (!org) return;
        setFormData({
          organisationName: org.nom || '',
          email: org.email || '',
          phone: org.telephone || '',
          address: org.adresse || '',
          website: org.site_web || '',
          description: '',
        });
      })
      .catch(err => setLoadError(err?.message || t('common.error')))
      .finally(() => setSettingsLoading(false));
  }, [currentUser, navigate, t]);

  const handleSaveChanges = async () => {
    const orgId = currentUser?.organisation_id;
    if (!orgId) return;
    try {
      setLoading(true);
      await updateAdminOrganisation(orgId, { nom: formData.organisationName, email: formData.email, telephone: formData.phone, adresse: formData.address, site_web: formData.website });
      logActivity({ type_action: TypeAction.AUTRE, action_detaillee: 'configuration_organisation_infos', description: "Modification des informations générales de l'organisation", id_utilisateur: currentUser.id ?? undefined }).catch(() => {});
      alert(t('admin.successSaved'));
    } finally {
      setLoading(false);
    }
  };

  if (settingsLoading) return <div className={styles.settings__skeletonWrap}><AdminDetailSkeleton blockCount={3} linesPerBlock={4} /></div>;
  if (loadError) return <div className={styles.settings__errorBanner} role="alert"><p>{loadError}</p></div>;

  const tabs = [
    { id: 'general', label: t('admin.general'), icon: Building },
    { id: 'team', label: t('admin.team'), icon: Users },
    { id: 'notifications', label: t('admin.notifications'), icon: Bell },
    { id: 'zones', label: t('admin.zonesCompetence'), icon: MapPin },
    { id: 'certifications', label: t('admin.certifications'), icon: Award },
    { id: 'ia', label: t('admin.iaParams'), icon: Cpu },
    { id: 'security', label: t('admin.security'), icon: Shield },
  ] as const;

  return (
    <div className={styles.settings}>
      <div className={styles.settings__header}>
        <h1 className={styles.settings__title}><Settings className={styles.settings__titleIcon} />{t('admin.organisationSettings')}</h1>
      </div>
      <div className={styles.settings__tabsContainer}>
        {tabs.map(tab => {
          const IconComponent = tab.icon;
          return (
            <button key={tab.id} className={`${styles.settings__tab} ${activeTab === tab.id ? styles['settings__tab--active'] : ''}`} onClick={() => setActiveTab(tab.id)}>
              <IconComponent className={styles.settings__tabIcon} />
              {tab.label}
            </button>
          );
        })}
      </div>
      {activeTab === 'general' && (
        <div className={styles.settings__card}>
          <div className={styles.settings__cardBody}>
            <input type="text" className={styles.settings__input} value={formData.organisationName} onChange={e => setFormData(prev => ({ ...prev, organisationName: e.target.value }))} placeholder={t('admin.enterOrganisationName')} />
            <input type="email" className={styles.settings__input} value={formData.email} onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))} placeholder={t('admin.enterEmail')} />
            <input type="tel" className={styles.settings__input} value={formData.phone} onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))} placeholder={t('admin.enterPhone')} />
            <div className={styles.settings__actions}>
              <button className={styles.settings__btnPrimary} onClick={handleSaveChanges} disabled={loading}>
                <Save className={styles.settings__btnIcon} />
                {loading ? t('admin.saving') : t('admin.saveChanges')}
              </button>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'security' && (
        <div className={styles.settings__card}>
          <div className={styles.settings__securityItem}>
            <Lock className={styles.settings__securityIcon} />
            <h4>{t('admin.changePassword')}</h4>
          </div>
          <div className={styles.settings__dangerZone}>
            <div className={styles.settings__dangerHeader}>
              <AlertTriangle className={styles.settings__dangerIcon} />
              <h3>{t('admin.dangerZone')}</h3>
            </div>
            <button type="button" className={styles.settings__btnDanger} onClick={() => alert(t('admin.confirmDeleteOrganisation'))}>
              <Trash2 className={styles.settings__btnIcon} />
              {t('admin.delete')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganisationSettingsPage;
