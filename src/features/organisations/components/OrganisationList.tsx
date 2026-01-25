/**
 * =====================================================
 * RETROUVONSLES - OrganisationList Component
 * Display list of organisations
 * =====================================================
 */

import React, { useEffect, useState } from 'react';
import { useOrganisations } from '../hooks/useOrganisations';
import type { Organisation, OrganisationFilter } from '../types';
import styles from './OrganisationList.module.css';

export interface OrganisationListProps {
  onSelectOrganisation?: (organisation: Organisation) => void;
  onCreateNew?: () => void;
  showFilters?: boolean;
}

/**
 * OrganisationList component
 */
export const OrganisationList: React.FC<OrganisationListProps> = ({
  onSelectOrganisation,
  onCreateNew,
  showFilters = true,
}) => {
  const { organisations, isLoading, error, pagination, fetchOrganisations } = useOrganisations();
  const [filter, setFilter] = useState<OrganisationFilter>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const newFilter: OrganisationFilter = {
      ...filter,
      search: searchTerm || undefined,
    };
    fetchOrganisations(newFilter, 1);
  }, [searchTerm, filter, fetchOrganisations]);

  const handleStatusFilter = (status: string) => {
    const newFilter: OrganisationFilter = {
      ...filter,
      status: status === 'all' ? undefined : (status as any),
    };
    setFilter(newFilter);
    fetchOrganisations(newFilter, 1);
  };

  if (isLoading && organisations.length === 0) {
    return <div className={styles.loading}>Loading organisations...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Organisations</h2>
        {onCreateNew && (
          <button className={styles.btnCreate} onClick={onCreateNew}>
            + New Organisation
          </button>
        )}
      </div>

      {showFilters && (
        <div className={styles.filters}>
          <input
            type="text"
            placeholder="Search organisations..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className={styles.statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.list}>
        {organisations.length === 0 ? (
          <div className={styles.empty}>
            <p>No organisations found</p>
          </div>
        ) : (
          organisations.map((org) => (
            <div
              key={org.id}
              className={styles.item}
              onClick={() => onSelectOrganisation?.(org)}
            >
              {org.logo_url && (
                <img src={org.logo_url} alt={org.name} className={styles.logo} />
              )}
              <div className={styles.info}>
                <h3 className={styles.name}>{org.name}</h3>
                <p className={styles.description}>{org.description}</p>
                <div className={styles.meta}>
                  <span className={styles.badge}>{org.status}</span>
                  {org.verified && <span className={styles.badgeVerified}>Verified</span>}
                  <span className={styles.members}>{org.member_count} members</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {pagination.total > pagination.pageSize && (
        <div className={styles.pagination}>
          <p>
            Showing {organisations.length} of {pagination.total}
          </p>
        </div>
      )}
    </div>
  );
};
