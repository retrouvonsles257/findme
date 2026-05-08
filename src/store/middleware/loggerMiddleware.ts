/**
 * =====================================================
 * RETROUVONSLES - Logger Middleware
 * Pass-through (pas de journalisation console en dev/prod).
 * =====================================================
 */

export const loggerMiddleware = (_store: any) => (next: any) => (action: any) =>
  next(action);

export const simpleLoggerMiddleware = (_store: any) => (next: any) => (action: any) =>
  next(action);

export default loggerMiddleware;
