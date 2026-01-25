/**
 * =====================================================
 * RETROUVONSLES - API Middleware
 * Handles API calls and service integration
 * =====================================================
 */

/**
 * API Middleware factory
 * Intercepts API-related actions and handles service calls
 */
export const apiMiddleware = (store: any) => (next: any) => (action: any) => {
  // Log API action
  if (action.type?.includes('api/')) {
    console.log('[API Middleware]', action.type, action.payload);
  }

  // Pass through to next middleware
  const result = next(action);

  return result;
};

/**
 * Service middleware
 * Handles calls to external services (Supabase, Firebase, etc.)
 */
export const serviceMiddleware = (store: any) => (next: any) => (action: any) => {
  // Pass through
  const result = next(action);

  // Handle service actions post-dispatch
  if (action.type?.includes('service/')) {
    console.log('[Service Middleware]', action.type, action.payload);
  }

  return result;
};

export default apiMiddleware;
