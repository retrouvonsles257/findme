/**
 * =====================================================
 * RETROUVONSLES - Middleware Index
 * Exports all middleware functions
 * =====================================================
 */

export { apiMiddleware, serviceMiddleware } from './apiMiddleware';
export { errorMiddleware } from './errorMiddleware';
export { loggerMiddleware, simpleLoggerMiddleware } from './loggerMiddleware';

import { apiMiddleware } from './apiMiddleware';
import { errorMiddleware } from './errorMiddleware';
import { loggerMiddleware } from './loggerMiddleware';

/**
 * All middleware combined
 */
export const allMiddleware = [
  errorMiddleware,
  apiMiddleware,
  loggerMiddleware,
];

/**
 * Production middleware (without logger)
 */
export const productionMiddleware = [
  errorMiddleware,
  apiMiddleware,
];

export default allMiddleware;
