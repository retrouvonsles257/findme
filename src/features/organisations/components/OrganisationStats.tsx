/**
 * =====================================================
 * RETROUVONSLES - OrganisationStats Component
 * Display organisation statistics
 * =====================================================
 */

import React from 'react';
import { useOrganisationDetail } from '../hooks/useOrganisationDetail';

export interface OrganisationStatsProps {}

/**
 * OrganisationStats component
 */
export const OrganisationStats: React.FC<OrganisationStatsProps> = () => {
  const { stats } = useOrganisationDetail();

  if (!stats) {
    return <div>No statistics available</div>;
  }

  const resolutionRate = stats.total_cases > 0 ? Math.round((stats.resolved_cases / stats.total_cases) * 100) : 0;
  const verificationRate = stats.total_sightings > 0 ? Math.round((stats.verified_sightings / stats.total_sightings) * 100) : 0;

  return (
    <div>
      <h3>Statistics</h3>

      <div>
        <h4>Members</h4>
        <p>Total: {stats.total_members}</p>
        <p>Active: {stats.active_members}</p>
      </div>

      <div>
        <h4>Cases</h4>
        <p>Total: {stats.total_cases}</p>
        <p>Resolved: {stats.resolved_cases}</p>
        <p>Resolution Rate: {resolutionRate}%</p>
      </div>

      <div>
        <h4>Sightings</h4>
        <p>Total: {stats.total_sightings}</p>
        <p>Verified: {stats.verified_sightings}</p>
        <p>Verification Rate: {verificationRate}%</p>
      </div>

      <p>Last Updated: {new Date(stats.updated_at).toLocaleString()}</p>
    </div>
  );
};
