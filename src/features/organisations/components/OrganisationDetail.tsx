/**
 * =====================================================
 * RETROUVONSLES - OrganisationDetail Component
 * Display organisation details
 * =====================================================
 */

import React, { useEffect, useState } from 'react';
import { useOrganisationDetail } from '../hooks/useOrganisationDetail';
import type { Organisation, OrganisationUpdatePayload } from '../types';
import styles from './OrganisationDetail.module.css';

export interface OrganisationDetailProps {
  organisationId: string;
  onUpdate?: (organisation: Organisation) => void;
}

/**
 * OrganisationDetail component
 */
export const OrganisationDetail: React.FC<OrganisationDetailProps> = ({
  organisationId,
  onUpdate,
}) => {
  const { organisation, stats, isLoading, error, fetchOrganisation, updateOrganisation, fetchStats } =
    useOrganisationDetail();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<OrganisationUpdatePayload>({});

  useEffect(() => {
    fetchOrganisation(organisationId);
    fetchStats(organisationId);
  }, [organisationId, fetchOrganisation, fetchStats]);

  useEffect(() => {
    if (organisation) {
      setFormData({
        name: organisation.name,
        description: organisation.description,
        website: organisation.website,
        phone: organisation.phone,
        address: organisation.address,
        city: organisation.city,
        country: organisation.country,
      });
    }
  }, [organisation]);

  const handleSave = async () => {
    try {
      await updateOrganisation(organisationId, formData);
      setIsEditing(false);
      if (organisation) {
        onUpdate?.({ ...organisation, ...formData });
      }
    } catch (err) {
      console.error('Failed to update organisation:', err);
    }
  };

  if (isLoading) return <div className={styles.loading}>Loading...</div>;
  if (!organisation) return <div className={styles.error}>Organisation not found</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          {organisation.logo_url && (
            <img src={organisation.logo_url} alt={organisation.name} className={styles.logo} />
          )}
          <div>
            <h1 className={styles.title}>{organisation.name}</h1>
            <p className={styles.status}>{organisation.status}</p>
          </div>
        </div>
        <button
          className={styles.btnEdit}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      <div className={styles.content}>
        {isEditing ? (
          <div className={styles.form}>
            <div className={styles.formGroup}>
              <label>Name</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Website</label>
              <input
                type="url"
                value={formData.website || ''}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Phone</label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Address</label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>City</label>
                <input
                  type="text"
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Country</label>
                <input
                  type="text"
                  value={formData.country || ''}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>
            </div>
            <button className={styles.btnSave} onClick={handleSave}>
              Save Changes
            </button>
          </div>
        ) : (
          <div className={styles.info}>
            <section className={styles.section}>
              <h3>Description</h3>
              <p>{organisation.description || 'No description'}</p>
            </section>

            <section className={styles.section}>
              <h3>Contact Information</h3>
              <div className={styles.contactInfo}>
                <p><strong>Email:</strong> {organisation.email}</p>
                {organisation.website && <p><strong>Website:</strong> <a href={organisation.website} target="_blank" rel="noopener noreferrer">{organisation.website}</a></p>}
                {organisation.phone && <p><strong>Phone:</strong> {organisation.phone}</p>}
                {organisation.address && <p><strong>Address:</strong> {organisation.address}</p>}
                {organisation.city && <p><strong>City:</strong> {organisation.city}</p>}
                {organisation.country && <p><strong>Country:</strong> {organisation.country}</p>}
              </div>
            </section>

            {stats && (
              <section className={styles.section}>
                <h3>Statistics</h3>
                <div className={styles.stats}>
                  <div className={styles.stat}>
                    <span className={styles.label}>Members</span>
                    <span className={styles.value}>{stats.total_members}</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.label}>Cases</span>
                    <span className={styles.value}>{stats.total_cases}</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.label}>Sightings</span>
                    <span className={styles.value}>{stats.total_sightings}</span>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
