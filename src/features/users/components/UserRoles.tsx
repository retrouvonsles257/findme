/**
 * =====================================================
 * UserRoles Component
 * =====================================================
 */

import React from 'react';
import type { UserRolesProps } from '../types';

export const UserRoles: React.FC<UserRolesProps> = ({ editable = false }) => {
  const styles: React.CSSProperties = {
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  };

  const titleStyles: React.CSSProperties = {
    marginTop: 0,
    marginBottom: 16,
    fontSize: '16px',
    fontWeight: 600,
    color: '#333',
  };

  const roleItemStyles: React.CSSProperties = {
    padding: '12px',
    marginBottom: '8px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const roleTagStyles: React.CSSProperties = {
    backgroundColor: '#e7f3ff',
    color: '#0056b3',
    padding: '4px 8px',
    borderRadius: '3px',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
  };

  return (
    <div style={styles}>
      <h3 style={titleStyles}>Rôles et permissions</h3>
      <div style={roleItemStyles}>
        <span>Administrateur</span>
        <span style={roleTagStyles}>ADMIN</span>
      </div>
      {editable && (
        <button
          style={{
            width: '100%',
            padding: '8px 16px',
            marginTop: '16px',
            backgroundColor: '#0056b3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          Gérer les rôles
        </button>
      )}
    </div>
  );
};
