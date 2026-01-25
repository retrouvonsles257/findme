/**
 * =====================================================
 * RETROUVONSLES - Redux Store Configuration
 * Creates and configures the Redux store with middleware
 * =====================================================
 */

import { legacy_createStore as createStore, applyMiddleware, compose } from 'redux';
import { thunk } from 'redux-thunk';
import { rootReducer } from './rootReducer';
import { errorMiddleware } from './middleware/errorMiddleware';
import { apiMiddleware } from './middleware/apiMiddleware';
import { loggerMiddleware } from './middleware/loggerMiddleware';

/**
 * Redux store instance
 * Uses legacy store API with custom middleware + thunk
 */
const middlewares = [
  thunk,
  errorMiddleware,
  apiMiddleware,
  ...(process.env.NODE_ENV === 'development' ? [loggerMiddleware] : [])
];

const composeEnhancers = 
  (typeof window !== 'undefined' && (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || 
  compose;

const enhancer = composeEnhancers(applyMiddleware(...middlewares));

/**
 * Create the Redux store
 */
export const store = createStore(rootReducer, enhancer);

/**
 * Store type exports
 */
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

/**
 * Configure store thunk timeout
 */
if (typeof (store as any).dispatch === 'function') {
  (store as any).subscribe(() => {
    // Called whenever state changes
  });
}

export default store;
