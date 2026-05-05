/**
 * =====================================================
 * RETROUVONSLES - Admin Organisation Settings Page
 * Configuration et paramètres de l'organisation
 * =====================================================
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  Building,
  Users,
  Bell,
  Shield,
  Lock,
  AlertTriangle,
  Trash2,
  Save,
  MapPin,
  Plus,
  Award,
  Cpu,
} from 'lucide-react';
import { useAppSelector } from '../../store/types';
import { AdminOrganisationLayout } from './AdminOrganisationLayout';
import { useI18n } from '../../hooks';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { NomRole } from '../../@types/enums.types';
import {
  getAdminOrganisation,
  updateAdminOrganisation,
  type ZoneCompetence,
  type CertificationAccreditation,
  type IAConfigOrganisation,
} from '../../features/admin-organisation/services';
import { logActivity } from '../../services/audit/auditService';
import { TypeAction } from '../../@types/enums.types';

import { AdminDetailSkeleton } from './skeletons';
import styles from './OrganisationSettings.module.css';

export const AdminOrganisationSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  
  const currentUser = useAppSelector(selectCurrentUser);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'team' | 'notifications' | 'zones' | 'certifications' | 'ia' | 'security'>('general');
  const [formData, setFormData] = useState({
    organisationName: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    description: '',
  });
  const [notificationSettings, setNotificationSettings] = useState({
    emailNewDossier: true,
    emailNewReport: true,
    emailAlerts: true,
    smsUrgent: true,
    slackNotifications: false,
  });
  const [teamSettings, setTeamSettings] = useState({
    maxMembers: 50,
    autoAssign: true,
    requireApproval: true,
  });
  const [zones, setZones] = useState<ZoneCompetence[]>([]);
  const [certifications, setCertifications] = useState<CertificationAccreditation[]>([]);
  const [iaConfig, setIaConfig] = useState<IAConfigOrganisation>({
    seuil_reconnaissance_faciale: 0.85,
    analyse_auto_activee: true,
    priorite_analyse: 'normale',
  });

  const getMergedParametres = () => ({
    team: teamSettings,
    notifications: notificationSettings,
    zones_competence: zones,
    certifications,
    ia_config: iaConfig,
  });

  useEffect(() => {
    if (!currentUser || currentUser.role !== NomRole.ADMIN_SYSTEME) {
      navigate('/auth/login');
      return;
    }
    const orgId = currentUser.organisation_id;
    if (!orgId) {
      setSettingsLoading(false);
      return;
    }
    setLoadError(null);
    getAdminOrganisation(orgId)
      .then((org) => {
        if (org) {
          setFormData({
            organisationName: org.nom || '',
            email: org.email || '',
            phone: org.telephone || '',
            address: org.adresse || '',
            website: org.site_web || '',
            description: '',
          });
          const p = (org as { parametres_organisation?: { team?: { maxMembers?: number; autoAssign?: boolean; requireApproval?: boolean }; notifications?: Record<string, boolean> } }).parametres_organisation;
          if (p?.team) {
            setTeamSettings(prev => ({
              maxMembers: p.team?.maxMembers ?? prev.maxMembers,
              autoAssign: p.team?.autoAssign ?? prev.autoAssign,
              requireApproval: p.team?.requireApproval ?? prev.requireApproval,
            }));
          }
          if (p?.notifications) {
            setNotificationSettings(prev => ({
              ...prev,
              ...p.notifications,
            }));
          }
          if (Array.isArray((p as { zones_competence?: ZoneCompetence[] })?.zones_competence)) {
            setZones((p as { zones_competence: ZoneCompetence[] }).zones_competence);
          }
          if (Array.isArray((p as { certifications?: CertificationAccreditation[] })?.certifications)) {
            setCertifications((p as { certifications: CertificationAccreditation[] }).certifications);
          }
          const ia = (p as { ia_config?: IAConfigOrganisation })?.ia_config;
          if (ia && typeof ia === 'object') {
            setIaConfig(prev => ({ ...prev, ...ia }));
          }
        }
        setLoadError(null);
      })
      .catch((err) => {
        setLoadError(err?.message || t('common.error'));
      })
      .finally(() => setSettingsLoading(false));
  }, [currentUser, navigate, t]);

  const handleSaveChanges = async () => {
    const orgId = currentUser?.organisation_id;
    if (!orgId) return;
    try {
      setLoading(true);
      await updateAdminOrganisation(orgId, {
        nom: formData.organisationName,
        email: formData.email,
        telephone: formData.phone,
        adresse: formData.address,
        site_web: formData.website,
      });
      logActivity({
        type_action: TypeAction.AUTRE,
        action_detaillee: 'configuration_organisation_infos',
        description: 'Modification des informations générales de l\'organisation',
        id_utilisateur: currentUser.id ?? undefined,
      }).catch(() => {});
      alert(t('admin.successSaved'));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTeamAndNotifications = async () => {
    const orgId = currentUser?.organisation_id;
    if (!orgId) return;
    try {
      setLoading(true);
      await updateAdminOrganisation(orgId, {
        parametres_organisation: getMergedParametres(),
      });
      logActivity({
        type_action: TypeAction.AUTRE,
        action_detaillee: 'configuration_organisation_equipe_notifications',
        description: 'Modification équipe et notifications',
        id_utilisateur: currentUser.id ?? undefined,
      }).catch(() => {});
      alert(t('admin.successSaved'));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveZones = async () => {
    const orgId = currentUser?.organisation_id;
    if (!orgId) return;
    try {
      setLoading(true);
      await updateAdminOrganisation(orgId, {
        parametres_organisation: getMergedParametres(),
      });
      logActivity({
        type_action: TypeAction.AUTRE,
        action_detaillee: 'configuration_organisation_zones',
        description: 'Modification des zones géographiques de compétence',
        id_utilisateur: currentUser.id ?? undefined,
      }).catch(() => {});
      alert(t('admin.successSaved'));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setLoading(false);
    }
  };

  const addZone = () => {
    setZones(prev => [
      ...prev,
      { id: crypto.randomUUID(), nom: '', region: '', departement: '', codes_postaux: '' },
    ]);
  };

  const removeZone = (id: string) => {
    setZones(prev => prev.filter(z => z.id !== id));
  };

  const updateZone = (id: string, field: keyof ZoneCompetence, value: string) => {
    setZones(prev =>
      prev.map(z => (z.id === id ? { ...z, [field]: value } : z))
    );
  };

  const addCertification = () => {
    setCertifications(prev => [
      ...prev,
      { id: crypto.randomUUID(), nom: '', reference: '', date_expiration: '' },
    ]);
  };
  const removeCertification = (id: string) => {
    setCertifications(prev => prev.filter(c => c.id !== id));
  };
  const updateCertification = (id: string, field: keyof CertificationAccreditation, value: string) => {
    setCertifications(prev =>
      prev.map(c => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleSaveCertifications = async () => {
    const orgId = currentUser?.organisation_id;
    if (!orgId) return;
    try {
      setLoading(true);
      await updateAdminOrganisation(orgId, {
        parametres_organisation: getMergedParametres(),
      });
      logActivity({
        type_action: TypeAction.AUTRE,
        action_detaillee: 'configuration_organisation_certifications',
        description: 'Modification des certifications / accréditations',
        id_utilisateur: currentUser.id ?? undefined,
      }).catch(() => {});
      alert(t('admin.successSaved'));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveIAConfig = async () => {
    const orgId = currentUser?.organisation_id;
    if (!orgId) return;
    try {
      setLoading(true);
      await updateAdminOrganisation(orgId, {
        parametres_organisation: getMergedParametres(),
      });
      logActivity({
        type_action: TypeAction.AUTRE,
        action_detaillee: 'configuration_organisation_ia',
        description: 'Modification des paramètres IA de l\'organisation',
        id_utilisateur: currentUser.id ?? undefined,
      }).catch(() => {});
      alert(t('admin.successSaved'));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNotificationChange = (field: string, value: boolean) => {
    setNotificationSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleTeamChange = (field: 'maxMembers' | 'autoAssign' | 'requireApproval', value: number | boolean) => {
    setTeamSettings(prev => ({ ...prev, [field]: value }));
  };

  const tabs = [
    { id: 'general', label: t('admin.general'), icon: Building },
    { id: 'team', label: t('admin.team'), icon: Users },
    { id: 'notifications', label: t('admin.notifications'), icon: Bell },
    { id: 'zones', label: t('admin.zonesCompetence'), icon: MapPin },
    { id: 'certifications', label: t('admin.certifications'), icon: Award },
    { id: 'ia', label: t('admin.iaParams'), icon: Cpu },
    { id: 'security', label: t('admin.security'), icon: Shield },
  ];

  if (settingsLoading) {
    return (
      <AdminOrganisationLayout title={t('admin.organisationSettings')} activeNav="parametres">
        <div className={styles.settings__skeletonWrap}>
          <AdminDetailSkeleton blockCount={3} linesPerBlock={4} />
        </div>
      </AdminOrganisationLayout>
    );
  }

  if (loadError) {
    return (
      <AdminOrganisationLayout title={t('admin.organisationSettings')} activeNav="parametres">
        <div className={styles.settings__errorBanner} role="alert">
          <p>{loadError}</p>
        </div>
      </AdminOrganisationLayout>
    );
  }

  return (
    <AdminOrganisationLayout title={t('admin.organisationSettings')} activeNav="parametres">
      <div className={styles.settings}>
        {/* Header */}
        <div className={styles.settings__header}>
          <div>
            <h1 className={styles.settings__title}>
              <Settings className={styles.settings__titleIcon} />
              {t('admin.organisationSettings')}
            </h1>
            <p className={styles.settings__subtitle}>
              {t('admin.manageOrganisationConfiguration')}
            </p>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className={styles.settings__tabsContainer}>
          {tabs.map(tab => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                className={`${styles.settings__tab} ${activeTab === tab.id ? styles['settings__tab--active'] : ''}`}
                onClick={() => setActiveTab(tab.id as any)}
              >
                <IconComponent className={styles.settings__tabIcon} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* General Tab */}
        {activeTab === 'general' && (
          <div className={styles.settings__card}>
            <div className={styles.settings__cardHeader}>
              <h3>{t('admin.generalInfo')}</h3>
            </div>
            <div className={styles.settings__cardBody}>
              <div className={styles.settings__formGroup}>
                <label className={styles.settings__label}>
                  {t('admin.organisationName')}
                </label>
                <input
                  type="text"
                  className={styles.settings__input}
                  value={formData.organisationName}
                  onChange={e => handleFormChange('organisationName', e.target.value)}
                  placeholder={t('admin.enterOrganisationName')}
                />
              </div>

              <div className={styles.settings__formGroup}>
                <label className={styles.settings__label}>{t('admin.email')}</label>
                <input
                  type="email"
                  className={styles.settings__input}
                  value={formData.email}
                  onChange={e => handleFormChange('email', e.target.value)}
                  placeholder={t('admin.enterEmail')}
                />
              </div>

              <div className={styles.settings__formGroup}>
                <label className={styles.settings__label}>{t('admin.phone')}</label>
                <input
                  type="tel"
                  className={styles.settings__input}
                  value={formData.phone}
                  onChange={e => handleFormChange('phone', e.target.value)}
                  placeholder={t('admin.enterPhone')}
                />
              </div>

              <div className={styles.settings__formGroup}>
                <label className={styles.settings__label}>{t('admin.address')}</label>
                <input
                  type="text"
                  className={styles.settings__input}
                  value={formData.address}
                  onChange={e => handleFormChange('address', e.target.value)}
                  placeholder={t('admin.enterAddress')}
                />
              </div>

              <div className={styles.settings__formGroup}>
                <label className={styles.settings__label}>{t('admin.website')}</label>
                <input
                  type="url"
                  className={styles.settings__input}
                  value={formData.website}
                  onChange={e => handleFormChange('website', e.target.value)}
                  placeholder={t('admin.enterWebsite')}
                />
              </div>

              <div className={styles.settings__formGroup}>
                <label className={styles.settings__label}>{t('admin.description')}</label>
                <textarea
                  className={styles.settings__textarea}
                  value={formData.description}
                  onChange={e => handleFormChange('description', e.target.value)}
                  placeholder={t('admin.enterDescription')}
                  rows={4}
                />
              </div>

              <div className={styles.settings__actions}>
                <button
                  className={styles.settings__btnPrimary}
                  onClick={handleSaveChanges}
                  disabled={loading}
                >
                  <Save className={styles.settings__btnIcon} />
                  {loading ? t('admin.saving') : t('admin.saveChanges')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Team Tab */}
        {activeTab === 'team' && (
          <div className={styles.settings__card}>
            <div className={styles.settings__cardHeader}>
              <h3>{t('admin.teamSettings')}</h3>
            </div>
            <div className={styles.settings__cardBody}>
              <div className={styles.settings__settingItem}>
                <div>
                  <h4>{t('admin.maxTeamMembers')}</h4>
                  <p className={styles.settings__description}>
                    {t('admin.limitTeamMembersDescription')}
                  </p>
                </div>
                <input
                  type="number"
                  className={styles.settings__numberInput}
                  value={teamSettings.maxMembers}
                  onChange={e => handleTeamChange('maxMembers', parseInt(e.target.value, 10) || 1)}
                  min={1}
                />
              </div>

              <div className={styles.settings__settingItem}>
                <div>
                  <h4>{t('admin.autoAssignDossiers')}</h4>
                  <p className={styles.settings__description}>
                    {t('admin.autoAssignDossiersDescription')}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={teamSettings.autoAssign}
                  onChange={e => handleTeamChange('autoAssign', e.target.checked)}
                  className={styles.settings__checkbox}
                />
              </div>

              <div className={styles.settings__settingItem}>
                <div>
                  <h4>{t('admin.requireApproval')}</h4>
                  <p className={styles.settings__description}>
                    {t('admin.requireApprovalDescription')}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={teamSettings.requireApproval}
                  onChange={e => handleTeamChange('requireApproval', e.target.checked)}
                  className={styles.settings__checkbox}
                />
              </div>

              <div className={styles.settings__actions}>
                <button
                  className={styles.settings__btnPrimary}
                  onClick={handleSaveTeamAndNotifications}
                  disabled={loading}
                >
                  <Save className={styles.settings__btnIcon} />
                  {loading ? t('admin.saving') : t('admin.saveChanges')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className={styles.settings__card}>
            <div className={styles.settings__cardHeader}>
              <h3>{t('admin.notificationPreferences')}</h3>
            </div>
            <div className={styles.settings__cardBody}>
              <div className={styles.settings__notificationItem}>
                <div>
                  <h4>{t('admin.newDossierNotifications')}</h4>
                  <p className={styles.settings__description}>
                    {t('admin.receiveNotificationNewDossier')}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.emailNewDossier}
                  onChange={e => handleNotificationChange('emailNewDossier', e.target.checked)}
                  className={styles.settings__checkbox}
                />
              </div>

              <div className={styles.settings__notificationItem}>
                <div>
                  <h4>{t('admin.newReportNotifications')}</h4>
                  <p className={styles.settings__description}>
                    {t('admin.receiveNotificationNewReport')}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.emailNewReport}
                  onChange={e => handleNotificationChange('emailNewReport', e.target.checked)}
                  className={styles.settings__checkbox}
                />
              </div>

              <div className={styles.settings__notificationItem}>
                <div>
                  <h4>{t('admin.alertNotifications')}</h4>
                  <p className={styles.settings__description}>
                    {t('admin.receiveNotificationAlerts')}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.emailAlerts}
                  onChange={e => handleNotificationChange('emailAlerts', e.target.checked)}
                  className={styles.settings__checkbox}
                />
              </div>

              <div className={styles.settings__notificationItem}>
                <div>
                  <h4>{t('admin.urgentSmsNotifications')}</h4>
                  <p className={styles.settings__description}>
                    {t('admin.receiveUrgentSMS')}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.smsUrgent}
                  onChange={e => handleNotificationChange('smsUrgent', e.target.checked)}
                  className={styles.settings__checkbox}
                />
              </div>

              <div className={styles.settings__notificationItem}>
                <div>
                  <h4>{t('admin.slackIntegration')}</h4>
                  <p className={styles.settings__description}>
                    {t('admin.integrateSlackChannel')}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.slackNotifications}
                  onChange={e =>
                    handleNotificationChange('slackNotifications', e.target.checked)
                  }
                  className={styles.settings__checkbox}
                />
              </div>

              <div className={styles.settings__actions}>
                <button
                  className={styles.settings__btnPrimary}
                  onClick={handleSaveChanges}
                  disabled={loading}
                >
                  <Save className={styles.settings__btnIcon} />
                  {loading ? t('admin.saving') : t('admin.saveChanges')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Zones Tab */}
        {activeTab === 'zones' && (
          <div className={styles.settings__card}>
            <div className={styles.settings__cardHeader}>
              <h3>{t('admin.zonesCompetence')}</h3>
              <p className={styles.settings__description} style={{ marginTop: 4 }}>
                {t('admin.zonesCompetenceDescription')}
              </p>
            </div>
            <div className={styles.settings__cardBody}>
              {zones.map(zone => (
                <div key={zone.id} className={styles.settings__settingItem} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className={styles.settings__label}>{t('admin.zone')} #{zones.indexOf(zone) + 1}</span>
                    <button
                      type="button"
                      className={styles.settings__btnDanger}
                      style={{ padding: '4px 8px', fontSize: 12 }}
                      onClick={() => removeZone(zone.id)}
                      title={t('admin.remove')}
                      aria-label={t('admin.remove')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className={styles.settings__formGroup}>
                      <label className={styles.settings__label}>{t('admin.zoneName')}</label>
                      <input
                        type="text"
                        className={styles.settings__input}
                        value={zone.nom}
                        onChange={e => updateZone(zone.id, 'nom', e.target.value)}
                        placeholder={t('admin.zoneNamePlaceholder')}
                      />
                    </div>
                    <div className={styles.settings__formGroup}>
                      <label className={styles.settings__label}>{t('admin.zoneRegion')}</label>
                      <input
                        type="text"
                        className={styles.settings__input}
                        value={zone.region ?? ''}
                        onChange={e => updateZone(zone.id, 'region', e.target.value)}
                        placeholder={t('admin.zoneRegionPlaceholder')}
                      />
                    </div>
                    <div className={styles.settings__formGroup}>
                      <label className={styles.settings__label}>{t('admin.zoneDepartement')}</label>
                      <input
                        type="text"
                        className={styles.settings__input}
                        value={zone.departement ?? ''}
                        onChange={e => updateZone(zone.id, 'departement', e.target.value)}
                        placeholder={t('admin.zoneDepartementPlaceholder')}
                      />
                    </div>
                    <div className={styles.settings__formGroup}>
                      <label className={styles.settings__label}>{t('admin.zoneCodesPostaux')}</label>
                      <input
                        type="text"
                        className={styles.settings__input}
                        value={zone.codes_postaux ?? ''}
                        onChange={e => updateZone(zone.id, 'codes_postaux', e.target.value)}
                        placeholder={t('admin.zoneCodesPostauxPlaceholder')}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className={styles.settings__btnSecondary}
                onClick={addZone}
                style={{ marginBottom: 16 }}
              >
                <Plus className={styles.settings__btnIcon} />
                {t('admin.addZone')}
              </button>
              <div className={styles.settings__actions}>
                <button
                  className={styles.settings__btnPrimary}
                  onClick={handleSaveZones}
                  disabled={loading}
                >
                  <Save className={styles.settings__btnIcon} />
                  {loading ? t('admin.saving') : t('admin.saveChanges')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Certifications Tab */}
        {activeTab === 'certifications' && (
          <div className={styles.settings__card}>
            <div className={styles.settings__cardHeader}>
              <h3>{t('admin.certifications')}</h3>
              <p className={styles.settings__description} style={{ marginTop: 4 }}>
                {t('admin.certificationsDescription')}
              </p>
            </div>
            <div className={styles.settings__cardBody}>
              {certifications.map(cert => (
                <div key={cert.id} className={styles.settings__settingItem} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className={styles.settings__label}>{t('admin.certification')} #{certifications.indexOf(cert) + 1}</span>
                    <button
                      type="button"
                      className={styles.settings__btnDanger}
                      style={{ padding: '4px 8px', fontSize: 12 }}
                      onClick={() => removeCertification(cert.id)}
                      title={t('admin.remove')}
                      aria-label={t('admin.remove')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className={styles.settings__formGroup}>
                      <label className={styles.settings__label}>{t('admin.certificationName')}</label>
                      <input
                        type="text"
                        className={styles.settings__input}
                        value={cert.nom}
                        onChange={e => updateCertification(cert.id, 'nom', e.target.value)}
                        placeholder={t('admin.certificationNamePlaceholder')}
                      />
                    </div>
                    <div className={styles.settings__formGroup}>
                      <label className={styles.settings__label}>{t('admin.certificationReference')}</label>
                      <input
                        type="text"
                        className={styles.settings__input}
                        value={cert.reference ?? ''}
                        onChange={e => updateCertification(cert.id, 'reference', e.target.value)}
                        placeholder={t('admin.certificationReferencePlaceholder')}
                      />
                    </div>
                    <div className={styles.settings__formGroup}>
                      <label className={styles.settings__label}>{t('admin.certificationExpiry')}</label>
                      <input
                        type="date"
                        className={styles.settings__input}
                        value={cert.date_expiration ?? ''}
                        onChange={e => updateCertification(cert.id, 'date_expiration', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className={styles.settings__btnSecondary}
                onClick={addCertification}
                style={{ marginBottom: 16 }}
              >
                <Plus className={styles.settings__btnIcon} />
                {t('admin.addCertification')}
              </button>
              <div className={styles.settings__actions}>
                <button
                  className={styles.settings__btnPrimary}
                  onClick={handleSaveCertifications}
                  disabled={loading}
                >
                  <Save className={styles.settings__btnIcon} />
                  {loading ? t('admin.saving') : t('admin.saveChanges')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Paramètres IA Tab */}
        {activeTab === 'ia' && (
          <div className={styles.settings__card}>
            <div className={styles.settings__cardHeader}>
              <h3>{t('admin.iaParams')}</h3>
              <p className={styles.settings__description} style={{ marginTop: 4 }}>
                {t('admin.iaParamsDescription')}
              </p>
            </div>
            <div className={styles.settings__cardBody}>
              <div className={styles.settings__settingItem}>
                <div>
                  <h4>{t('admin.iaSeuilReconnaissance')}</h4>
                  <p className={styles.settings__description}>
                    {t('admin.iaSeuilReconnaissanceDesc')}
                  </p>
                </div>
                <input
                  type="number"
                  className={styles.settings__numberInput}
                  min={0}
                  max={1}
                  step={0.05}
                  value={iaConfig.seuil_reconnaissance_faciale ?? 0.85}
                  onChange={e => setIaConfig(prev => ({ ...prev, seuil_reconnaissance_faciale: parseFloat(e.target.value) || 0.85 }))}
                />
              </div>
              <div className={styles.settings__settingItem}>
                <div>
                  <h4>{t('admin.iaAnalyseAuto')}</h4>
                  <p className={styles.settings__description}>
                    {t('admin.iaAnalyseAutoDesc')}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={iaConfig.analyse_auto_activee ?? true}
                  onChange={e => setIaConfig(prev => ({ ...prev, analyse_auto_activee: e.target.checked }))}
                  className={styles.settings__checkbox}
                />
              </div>
              <div className={styles.settings__settingItem}>
                <div>
                  <h4>{t('admin.iaPriorite')}</h4>
                  <p className={styles.settings__description}>
                    {t('admin.iaPrioriteDesc')}
                  </p>
                </div>
                <select
                  className={styles.settings__input}
                  value={iaConfig.priorite_analyse ?? 'normale'}
                  onChange={e => setIaConfig(prev => ({ ...prev, priorite_analyse: e.target.value as 'haute' | 'normale' | 'basse' }))}
                >
                  <option value="haute">{t('admin.iaPrioriteHaute')}</option>
                  <option value="normale">{t('admin.iaPrioriteNormale')}</option>
                  <option value="basse">{t('admin.iaPrioriteBasse')}</option>
                </select>
              </div>
              <div className={styles.settings__actions}>
                <button
                  className={styles.settings__btnPrimary}
                  onClick={handleSaveIAConfig}
                  disabled={loading}
                >
                  <Save className={styles.settings__btnIcon} />
                  {loading ? t('admin.saving') : t('admin.saveChanges')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className={styles.settings__card}>
            <div className={styles.settings__cardHeader}>
              <h3>{t('admin.securitySettings')}</h3>
            </div>
            <div className={styles.settings__cardBody}>
              <div className={styles.settings__securityItem}>
                <Lock className={styles.settings__securityIcon} />
                <div>
                  <h4>{t('admin.changePassword')}</h4>
                  <p className={styles.settings__description}>
                    {t('admin.updateYourPassword')}
                  </p>
                </div>
                <button className={styles.settings__btnSecondary}>
                  {t('admin.changePassword')}
                </button>
              </div>

              <div className={styles.settings__securityItem}>
                <Shield className={styles.settings__securityIcon} />
                <div>
                  <h4>{t('admin.twoFactorAuthentication')}</h4>
                  <p className={styles.settings__description}>
                    {t('admin.enableTwoFactorAuth')}
                  </p>
                </div>
                <button type="button" className={styles.settings__btnSecondary} title={t('admin.enable')} aria-label={t('admin.enable')}>
                  {t('admin.enable')}
                </button>
              </div>

              <div className={styles.settings__dangerZone}>
                <div className={styles.settings__dangerHeader}>
                  <AlertTriangle className={styles.settings__dangerIcon} />
                  <h3>{t('admin.dangerZone')}</h3>
                </div>
                <div className={styles.settings__dangerItem}>
                  <div>
                    <h4>{t('admin.deleteOrganisation')}</h4>
                    <p className={styles.settings__description}>
                      {t('admin.deleteOrganisationWarning')}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={styles.settings__btnDanger}
                    onClick={() => alert(t('admin.confirmDeleteOrganisation'))}
                    title={t('admin.delete')}
                    aria-label={t('admin.delete')}
                  >
                    <Trash2 className={styles.settings__btnIcon} />
                    {t('admin.delete')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminOrganisationLayout>
  );
};

export default AdminOrganisationSettingsPage;