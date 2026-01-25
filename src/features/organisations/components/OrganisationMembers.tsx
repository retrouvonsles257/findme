/**
 * =====================================================
 * RETROUVONSLES - OrganisationMembers Component
 * Manage organisation members
 * =====================================================
 */

import React, { useEffect, useState } from 'react';
import { useOrganisationMembers } from '../hooks/useOrganisationMembers';
import type { OrganisationMemberCreatePayload, OrganisationMemberUpdatePayload } from '../types';

export interface OrganisationMembersProps {
  organisationId: string;
}

/**
 * OrganisationMembers component
 */
export const OrganisationMembers: React.FC<OrganisationMembersProps> = ({ organisationId }) => {
  const { members, isLoading, error, statistics, fetchMembers, addMember, updateMember, removeMember } =
    useOrganisationMembers();
  const [newMemberId, setNewMemberId] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'admin' | 'moderator' | 'member' | 'viewer'>('member');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchMembers(organisationId);
  }, [organisationId, fetchMembers]);

  const handleAddMember = async () => {
    if (!newMemberId) return;

    try {
      const payload: OrganisationMemberCreatePayload = {
        user_id: newMemberId,
        role: newMemberRole,
      };
      await addMember(organisationId, payload);
      setNewMemberId('');
      setNewMemberRole('member');
      setShowAddForm(false);
    } catch (err) {
      console.error('Failed to add member:', err);
    }
  };

  const handleUpdateMember = async (memberId: string, role: string) => {
    try {
      const payload: OrganisationMemberUpdatePayload = {
        role: role as any,
      };
      await updateMember(memberId, payload);
    } catch (err) {
      console.error('Failed to update member:', err);
    }
  };

  if (isLoading) return <div>Loading members...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h3>Members ({statistics.total})</h3>

      <div>
        <h4>Role Distribution</h4>
        <p>Admin: {statistics.admin}</p>
        <p>Moderator: {statistics.moderator}</p>
        <p>Member: {statistics.member}</p>
        <p>Viewer: {statistics.viewer}</p>
      </div>

      {showAddForm && (
        <div>
          <input
            type="text"
            placeholder="User ID"
            value={newMemberId}
            onChange={(e) => setNewMemberId(e.target.value)}
          />
          <select value={newMemberRole} onChange={(e) => setNewMemberRole(e.target.value as any)}>
            <option value="member">Member</option>
            <option value="moderator">Moderator</option>
            <option value="admin">Admin</option>
          </select>
          <button onClick={handleAddMember}>Add Member</button>
          <button onClick={() => setShowAddForm(false)}>Cancel</button>
        </div>
      )}

      {!showAddForm && (
        <button onClick={() => setShowAddForm(true)}>+ Add Member</button>
      )}

      <div>
        {members.map((member) => (
          <div key={member.id}>
            <div>
              <p><strong>{member.user_name || member.user_id}</strong></p>
              <p>{member.user_email}</p>
            </div>
            <select
              value={member.role}
              onChange={(e) => handleUpdateMember(member.id, e.target.value)}
            >
              <option value="viewer">Viewer</option>
              <option value="member">Member</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Admin</option>
            </select>
            <button onClick={() => removeMember(member.id)}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
};
