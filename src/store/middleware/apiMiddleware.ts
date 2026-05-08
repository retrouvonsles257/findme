/**
 * =====================================================
 * RETROUVONSLES - API Middleware
 * Pass-through (aucune interception console).
 * =====================================================
 */

export const apiMiddleware = (_store: any) => (next: any) => (action: any) =>
  next(action);

export const serviceMiddleware = (_store: any) => (next: any) => (action: any) =>
  next(action);

export default apiMiddleware;
