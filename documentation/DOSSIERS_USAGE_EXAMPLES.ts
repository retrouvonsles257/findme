/**
 * =====================================================
 * RETROUVONSLES - Dossiers Feature Usage Examples
 * Practical examples for implementing Dossiers in pages
 * =====================================================
 * 
 * This file contains code examples showing how to use
 * the dossiers feature throughout the application.
 */

// ==============================================================================
// EXAMPLE 1: List Page with Filters
// ==============================================================================

/*
import React, { useState } from 'react';
import { useDossiers } from '@/features/dossiers';
import { DossierList, DossierFilters } from '@/features/dossiers';

export function DossiersPage() {
  const {
    dossiers,
    isLoading,
    error,
    filters,
    setFilters,
    currentPage,
    totalPages,
    goToPage,
  } = useDossiers();

  return (
    <div>
      <h1>Dossiers de Disparition</h1>
      
      <DossierFilters
        onApplyFilters={setFilters}
        initialFilters={filters}
      />

      <DossierList
        dossiers={dossiers}
        isLoading={isLoading}
        error={error}
      />

      <Pagination
        current={currentPage}
        total={totalPages}
        onPageChange={goToPage}
      />
    </div>
  );
}
*/

// ==============================================================================
// EXAMPLE 2: Create Dossier Form
// ==============================================================================

/*
import React from 'react';
import { useDossierCreate } from '@/features/dossiers';
import { useNotification } from '@/contexts';
import { DossierForm } from '@/features/dossiers/components';

export function CreateDossierPage() {
  const { formData, errors, isSubmitting, submitForm, resetForm } =
    useDossierCreate();
  const { showNotification } = useNotification();

  const handleSubmit = async () => {
    try {
      await submitForm();
      showNotification('Dossier créé avec succès', 'success');
    } catch (err) {
      showNotification('Erreur lors de la création', 'error');
    }
  };

  return (
    <div>
      <h1>Créer un nouveau dossier</h1>
      <DossierForm
        onSubmit={handleSubmit}
        onCancel={() => window.history.back()}
        errors={errors}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
*/

// ==============================================================================
// EXAMPLE 3: Detail Page
// ==============================================================================

/*
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDossierDetail, useDossierUpdate } from '@/features/dossiers';
import {
  DossierDetail,
  DossierTimeline,
  DossierStatistics,
} from '@/features/dossiers';

export function DossierDetailPage() {
  const { dossierId } = useParams<{ dossierId: string }>();
  const { dossier, isLoading, error, fetchDossier } = useDossierDetail();
  const { updateStatus, isUpdating } = useDossierUpdate();

  useEffect(() => {
    if (dossierId) {
      fetchDossier(dossierId);
    }
  }, [dossierId, fetchDossier]);

  if (isLoading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;
  if (!dossier) return <div>Dossier non trouvé</div>;

  return (
    <div>
      <DossierDetail dossier={dossier} />
      <DossierTimeline dossierId={dossier.id} />
      <DossierStatistics dossierId={dossier.id} />
    </div>
  );
}
*/

// ==============================================================================
// EXAMPLE 4: Redux Integration
// ==============================================================================

/*
import { useSelector, useDispatch } from 'react-redux';
import {
  selectFilteredDossiers,
  selectUrgentDossiers,
  selectStatistics,
  selectIsLoading,
  DOSSIER_ACTIONS,
} from '@/features/dossiers';

export function DossiersReduxExample() {
  const dispatch = useDispatch();
  const dossiers = useSelector(selectFilteredDossiers);
  const urgent = useSelector(selectUrgentDossiers);
  const stats = useSelector(selectStatistics);
  const isLoading = useSelector(selectIsLoading);

  return (
    <div>
      <h2>Dossiers Urgents: {urgent.length}</h2>
      <p>Total: {stats?.total_dossiers}</p>
      <p>Taux de résolution: {stats?.taux_resolution}%</p>
    </div>
  );
}
*/

// ==============================================================================
// EXAMPLE 5: Custom Hook Usage
// ==============================================================================

/*
import {
  useDossiers,
  useDossierCreate,
  useDossierUpdate,
  useDossierDelete,
} from '@/features/dossiers';
import { useNotification } from '@/contexts';

export function DossiersManagement() {
  const { dossiers, fetchDossiers, setFilters } = useDossiers();
  const { updateStatus } = useDossierUpdate();
  const { deleteDossier } = useDossierDelete();
  const { showNotification } = useNotification();

  const handleChangeStatus = async (
    dossierId: string,
    newStatus: StatutDossier
  ) => {
    try {
      await updateStatus(dossierId, newStatus);
      showNotification('Statut mis à jour', 'success');
      fetchDossiers();
    } catch (error) {
      showNotification('Erreur de mise à jour', 'error');
    }
  };

  const handleDelete = async (dossierId: string) => {
    if (window.confirm('Êtes-vous sûr?')) {
      try {
        await deleteDossier(dossierId);
        showNotification('Dossier supprimé', 'success');
        fetchDossiers();
      } catch (error) {
        showNotification('Erreur de suppression', 'error');
      }
    }
  };

  return (
    <div>
      {dossiers.map((d) => (
        <div key={d.id}>
          <h3>{d.numero_dossier}</h3>
          <button onClick={() => handleChangeStatus(d.id, 'resolu')}>
            Marquer comme résolu
          </button>
          <button onClick={() => handleDelete(d.id)}>Supprimer</button>
        </div>
      ))}
    </div>
  );
}
*/

// ==============================================================================
// EXAMPLE 6: Map Integration
// ==============================================================================

/*
import { useDossiers } from '@/features/dossiers';
import { DossierMap } from '@/features/dossiers';
import type { DossierDisplayData } from '@/features/dossiers';

export function DossiersMapPage() {
  const { dossiers } = useDossiers();

  const mapData = dossiers
    .filter((d) => d.latitude_disparition && d.longitude_disparition)
    .map((d) => ({
      id: d.id,
      latitude: d.latitude_disparition!,
      longitude: d.longitude_disparition!,
      label: d.numero_dossier,
      color: d.is_urgent ? 'red' : 'blue',
    }));

  return (
    <div>
      <h1>Carte des Disparitions</h1>
      <DossierMap
        markers={mapData}
        onMarkerClick={(id) => {
          // Navigate to dossier detail
        }}
      />
    </div>
  );
}
*/

// ==============================================================================
// EXAMPLE 7: Statistics Dashboard
// ==============================================================================

/*
import React from 'react';
import { useSelector } from 'react-redux';
import {
  selectStatistics,
  selectUrgentDossiers,
  selectRecentDossiers,
  selectOpenDossiers,
} from '@/features/dossiers';
import { DossierStatistics } from '@/features/dossiers';

export function StatisticsDashboard() {
  const stats = useSelector(selectStatistics);
  const urgent = useSelector(selectUrgentDossiers);
  const recent = useSelector(selectRecentDossiers);
  const open = useSelector(selectOpenDossiers);

  return (
    <div>
      <h1>Tableau de Bord</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Dossiers</h3>
          <p>{stats?.total_dossiers}</p>
        </div>
        
        <div className="stat-card">
          <h3>Taux Résolution</h3>
          <p>{stats?.taux_resolution.toFixed(1)}%</p>
        </div>
        
        <div className="stat-card">
          <h3>Dossiers Urgents</h3>
          <p>{urgent.length}</p>
        </div>
        
        <div className="stat-card">
          <h3>Dossiers Ouverts</h3>
          <p>{open.length}</p>
        </div>
      </div>

      <DossierStatistics />
    </div>
  );
}
*/

// ==============================================================================
// EXAMPLE 8: Route Configuration
// ==============================================================================

/*
import { DossiersPage, DossierDetailPage, CreateDossierPage } from '@/pages';

export const dossiersRoutes = [
  {
    path: '/dossiers',
    element: <DossiersPage />,
    name: 'Dossiers',
    icon: 'folder',
  },
  {
    path: '/dossiers/nouveau',
    element: <CreateDossierPage />,
    name: 'Nouveau dossier',
    requiredRole: ['admin', 'officier'],
  },
  {
    path: '/dossiers/:dossierId',
    element: <DossierDetailPage />,
    name: 'Détail du dossier',
  },
];
*/

export const DOSSIERS_FEATURE_EXAMPLES = `
Les exemples ci-dessus montrent comment:
1. Afficher une liste de dossiers avec filtres
2. Créer un nouveau dossier
3. Afficher les détails d'un dossier
4. Intégrer avec Redux
5. Utiliser les custom hooks
6. Intégrer une carte
7. Afficher un tableau de bord
8. Configurer les routes
`;
