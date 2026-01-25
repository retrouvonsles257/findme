/**
 * =====================================================
 * RETROUVONSLES - Middleware Configuration
 * Central middleware setup and export
 * =====================================================
 */

import { apiMiddleware, serviceMiddleware } from './middleware/apiMiddleware';
import { errorMiddleware } from './middleware/errorMiddleware';
import { loggerMiddleware, simpleLoggerMiddleware } from './middleware/loggerMiddleware';

/**
 * All middleware for development
 */
export const developmentMiddleware = [
  errorMiddleware,
  apiMiddleware,
  serviceMiddleware,
  loggerMiddleware,
];

/**
 * Middleware for production
 */
export const productionMiddleware = [
  errorMiddleware,
  apiMiddleware,
  serviceMiddleware,
  simpleLoggerMiddleware,
];

/**
 * Get appropriate middleware based on environment
 */
export const getMiddleware = () => {
  return process.env.NODE_ENV === 'development'
    ? developmentMiddleware
    : productionMiddleware
};

const middlewareConfig = {
  developmentMiddleware,
  productionMiddleware,
  getMiddleware,
};

export default middlewareConfig;
