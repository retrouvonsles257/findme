/**
 * =====================================================
 * RETROUVONSLES - OrganisationSettings Component
 * Organisation settings
 * =====================================================
 */

import React, { useEffect, useState } from 'react';
import { useOrganisationDetail } from '../hooks/useOrganisationDetail';

export interface OrganisationSettingsProps {
  organisationId: string;
}

/**
 * OrganisationSettings component
 */
export const OrganisationSettings: React.FC<OrganisationSettingsProps> = ({ organisationId }) => {
  const { settings, fetchSettings, updateSettings } = useOrganisationDetail();
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    fetchSettings(organisationId);
  }, [organisationId, fetchSettings]);

  useEffect(() => {
    if (settings) {
      setFormData({
        notifications_enabled: settings.notifications_enabled,
        public_profile: settings.public_profile,
        require_member_approval: settings.require_member_approval,
        allow_external_api: settings.allow_external_api,
        max_members: settings.max_members,
      });
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings(organisationId, formData);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  return (
    <div>
      <h3>Settings</h3>
      <div>
        <label>
          <input
            type="checkbox"
            checked={formData.notifications_enabled || false}
            onChange={(e) => setFormData({ ...formData, notifications_enabled: e.target.checked })}
          />
          Enable Notifications
        </label>
      </div>
      <div>
        <label>
          <input
            type="checkbox"
            checked={formData.public_profile || false}
            onChange={(e) => setFormData({ ...formData, public_profile: e.target.checked })}
          />
          Public Profile
        </label>
      </div>
      <div>
        <label>
          <input
            type="checkbox"
            checked={formData.require_member_approval || false}
            onChange={(e) => setFormData({ ...formData, require_member_approval: e.target.checked })}
          />
          Require Member Approval
        </label>
      </div>
      <div>
        <label>
          <input
            type="checkbox"
            checked={formData.allow_external_api || false}
            onChange={(e) => setFormData({ ...formData, allow_external_api: e.target.checked })}
          />
          Allow External API
        </label>
      </div>
      <div>
        <label>
          Max Members:
          <input
            type="number"
            value={formData.max_members || ''}
            onChange={(e) => setFormData({ ...formData, max_members: parseInt(e.target.value) || undefined })}
          />
        </label>
      </div>
      <button onClick={handleSave}>Save Settings</button>
    </div>
  );
};
