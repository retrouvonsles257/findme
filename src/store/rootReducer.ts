/**
 * =====================================================
 * RETROUVONSLES - Root Reducer
 * Combines all feature reducers into a single root reducer
 * =====================================================
 */

import { combineReducers } from 'redux';

// Import all feature reducers from their respective modules
// Named exports where available from index files
import { authReducer } from '../features/auth/store';
import { dossierReducer } from '../features/dossiers/store';
import { signalementReducer } from '../features/signalements/store';
import { alerteReducer } from '../features/alertes/store';
import { donReducer } from '../features/dons/store';

// Exports from index files that re-export from slices
import { filiationReducer } from '../features/filiation/store';
import { notificationReducer } from '../features/notifications/store';
import { organisationReducer } from '../features/organisations/store';
import { personneReducer } from '../features/personnes/store';
import { geolocalisationReducer } from '../features/geolocalisation/store';

// Direct imports from slices (not exported from feature index files)
import userReducer from '../features/users/store/userSlice';
import statistiqueReducer from '../features/statistiques/store/statistiqueSlice';
import iaReducer from '../features/ia-analysis/store';

// UI State reducers for global UI and filter state
import { uiReducer } from './slices/uiSlice';
import { filterReducer } from './slices/filterSlice';

/**
 * Root reducer combines all feature and UI reducers
 */
export const rootReducer = combineReducers({
  // Feature reducers
  auth: authReducer,
  personnes: personneReducer,
  dossiers: dossierReducer,
  signalements: signalementReducer,
  filiation: filiationReducer,
  notifications: notificationReducer,
  organisations: organisationReducer,
  users: userReducer,
  geolocation: geolocalisationReducer,
  statistiques: statistiqueReducer,
  ia: iaReducer,
  alertes: alerteReducer,
  dons: donReducer,

  // Global UI state
  ui: uiReducer,
  filters: filterReducer,
});

export default rootReducer;
