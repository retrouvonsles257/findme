/**
 * =====================================================
 * RETROUVONSLES - FiliationTree Component
 * Main component to display family tree
 * =====================================================
 */

import React, { useEffect } from 'react';
import { useFiliationTree } from '../hooks/useFiliationTree';
import { FiliationNode as FiliationNodeComponent } from './FiliationNode';
import styles from './FiliationTree.module.css';

export interface FiliationTreeProps {
  idPersonne: string;
  onNodeClick?: (nodeId: string) => void;
  interactive?: boolean;
}

export const FiliationTree: React.FC<FiliationTreeProps> = ({
  idPersonne,
  onNodeClick,
  interactive = true,
}) => {
  const {
    currentTree,
    loading,
    error,
    fetchTree,
    calculateTreeStats,
  } = useFiliationTree(idPersonne);

  useEffect(() => {
    if (fetchTree) {
      fetchTree();
    }
  }, [idPersonne, fetchTree]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Chargement de l'arbre généalogique...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Erreur: {error}</div>
      </div>
    );
  }

  if (!currentTree) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>Aucune données d'arbre généalogique disponible</div>
      </div>
    );
  }

  const stats = calculateTreeStats();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Arbre généalogique</h2>
        {stats && (
          <div className={styles.stats}>
            <span>{stats.totalPersonnes} personnes</span>
            <span>{stats.generations} générations</span>
            <span>{stats.liens} liens</span>
          </div>
        )}
      </div>

      <div className={styles.treeContainer}>
        <div className={styles.tree}>
          {currentTree.racine && (
            <FiliationNodeComponent
              node={currentTree.racine}
              onNodeClick={onNodeClick}
              interactive={interactive}
              isRoot={true}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default FiliationTree;
