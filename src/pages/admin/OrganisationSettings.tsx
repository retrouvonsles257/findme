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
  Key,
  AlertTriangle,
  Trash2,
  Save
} from 'lucide-react';
import { useAppSelector } from '../../store/types';
import { DashboardLayout, HeaderAdminOrganisation, SidebarAdminOrganisation } from '../../components/layout';
import { Card, CardBody, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useI18n } from '../../hooks';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { NomRole } from '../../@types/enums.types';

import styles from './OrganisationSettings.module.css';

export const AdminOrganisationSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  
  const currentUser = useAppSelector(selectCurrentUser);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'team' | 'notifications' | 'security'>('general');
  const [formData, setFormData] = useState({
    organisationName: 'Police Nationale Senegal',
    email: 'admin@pns.sn',
    phone: '+221 33 824 21 00',
    address: 'Plateau, Dakar, Senegal',
    website: 'https://www.police.sn',
    description: 'Police Nationale du Senegal',
  });
  const [notificationSettings, setNotificationSettings] = useState({
    emailNewDossier: true,
    emailNewReport: true,
    emailAlerts: true,
    smsUrgent: true,
    slackNotifications: false,
  });

  useEffect(() => {
    if (!currentUser || currentUser.role !== NomRole.ADMIN_ORGANISATION) {
      navigate('/auth/login');
      return;
    }
  }, [currentUser, navigate]);

  const navigationItems = [
    { label: t('common.dashboard'), href: '/admin/dashboard', icon: '📊' },
    { label: t('admin.dossiers'), href: '/admin/dossiers', icon: '📁' },
    { label: t('admin.rapports'), href: '/admin/rapports', icon: '📋' },
    { label: t('admin.utilisateurs'), href: '/admin/utilisateurs', icon: '👥' },
    { label: t('admin.statistiques'), href: '/admin/statistiques', icon: '📈' },
    {
      label: t('admin.parametres'),
      href: '/admin/parametres',
      icon: '⚙️',
      isActive: true,
    },
  ];

  const handleSaveChanges = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Paramètres sauvegardés avec succès');
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

  const tabs = [
    { id: 'general', label: t('admin.general'), icon: Building },
    { id: 'team', label: t('admin.team'), icon: Users },
    { id: 'notifications', label: t('admin.notifications'), icon: Bell },
    { id: 'security', label: t('admin.security'), icon: Shield },
  ];

  return (
    <DashboardLayout
      sidebar={
        <SidebarAdminOrganisation
          navigationItems={navigationItems}
          currentUser={currentUser}
        />
      }
      header={
        <HeaderAdminOrganisation
          currentUser={currentUser}
          onLogout={() => navigate('/auth/login')}
        />
      }
    >
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
                  defaultValue="50"
                  min="1"
                />
              </div>

              <div className={styles.settings__settingItem}>
                <div>
                  <h4>{t('admin.autoAssignDossiers')}</h4>
                  <p className={styles.settings__description}>
                    {t('admin.autoAssignDossiersDescription')}
                  </p>
                </div>
                <input type="checkbox" defaultChecked className={styles.settings__checkbox} />
              </div>

              <div className={styles.settings__settingItem}>
                <div>
                  <h4>{t('admin.requireApproval')}</h4>
                  <p className={styles.settings__description}>
                    {t('admin.requireApprovalDescription')}
                  </p>
                </div>
                <input type="checkbox" defaultChecked className={styles.settings__checkbox} />
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
                <button className={styles.settings__btnSecondary}>
                  {t('admin.enable')}
                </button>
              </div>

              <div className={styles.settings__securityItem}>
                <Key className={styles.settings__securityIcon} />
                <div>
                  <h4>{t('admin.apiKeys')}</h4>
                  <p className={styles.settings__description}>
                    {t('admin.manageApiKeys')}
                  </p>
                </div>
                <button
                  className={styles.settings__btnSecondary}
                  onClick={() => navigate('/admin/api-keys')}
                >
                  {t('admin.manageApiKeys')}
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
                    className={styles.settings__btnDanger}
                    onClick={() => alert('Confirmation requise')}
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
    </DashboardLayout>
  );
};

export default AdminOrganisationSettingsPage;