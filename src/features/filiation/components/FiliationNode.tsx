/**
 * =====================================================
 * RETROUVONSLES - FiliationNode Component
 * Component to display individual family tree node
 * =====================================================
 */

import React from 'react';
import type { FiliationNode as FiliationNodeType } from '../types';
import styles from './FiliationTree.module.css';

export interface FiliationNodeProps {
  node: FiliationNodeType;
  onNodeClick?: (nodeId: string) => void;
  interactive?: boolean;
  isRoot?: boolean;
}

export const FiliationNode: React.FC<FiliationNodeProps> = ({
  node,
  onNodeClick,
  interactive = true,
  isRoot = false,
}) => {
  const handleClick = () => {
    if (interactive && onNodeClick) {
      onNodeClick(node.id);
    }
  };

  const displayName = `${node.prenom || ''} ${node.nom || ''}`.trim();
  const statusColor = node.statut === 'decede' ? '#d1d5db' : '#ffffff';
  const borderColor = node.statut === 'decede' ? '#6b7280' : '#3b82f6';

  return (
    <div className={styles.nodeWrapper}>
      <div
        className={`${styles.node} ${isRoot ? styles.root : ''} ${
          interactive ? styles.interactive : ''
        }`}
        onClick={handleClick}
        style={{
          backgroundColor: statusColor,
          borderColor: borderColor,
        }}
      >
        <div className={styles.nodeContent}>
          {node.photo && (
            <img src={node.photo} alt={displayName} className={styles.nodePhoto} />
          )}
          <div className={styles.nodeInfo}>
            <div className={styles.nodeName}>{displayName}</div>
            {node.date_naissance && (
              <div className={styles.nodeDate}>{node.date_naissance}</div>
            )}
            {node.statut === 'decede' && (
              <div className={styles.nodeStatus}>Décédé</div>
            )}
            {node.dateDisparition && (
              <div className={styles.nodeDisparition}>Disparu: {node.dateDisparition}</div>
            )}
          </div>
        </div>
      </div>

      {node.enfants && node.enfants.length > 0 && (
        <div className={styles.childrenContainer}>
          {node.enfants.map((child: any) => (
            <FiliationNode
              key={child.id}
              node={child}
              onNodeClick={onNodeClick}
              interactive={interactive}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FiliationNode;
