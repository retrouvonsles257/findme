/**
 * =====================================================
 * RETROUVONSLES - Logger Middleware
 * Logs all actions and state changes
 * =====================================================
 */

/**
 * Logger middleware factory
 * Logs all dispatched actions and resulting state
 */
export const loggerMiddleware = (store: any) => (next: any) => (action: any) => {
  const currentState = store.getState();

  console.group(`[Redux] ${action.type}`);
  console.log('Previous State:', currentState);
  console.log('Action:', action);

  const result = next(action);

  const nextState = store.getState();
  console.log('Next State:', nextState);
  console.groupEnd();

  return result;
};

/**
 * Simple logger middleware for production
 * Only logs errors and important actions
 */
export const simpleLoggerMiddleware = (store: any) => (next: any) => (action: any) => {
  // Log errors and important actions only
  if (
    action.type?.includes('ERROR') ||
    action.type?.includes('SUCCESS') ||
    action.type?.includes('FAILED')
  ) {
    console.log(`[${action.type}]`, action.payload);
  }

  return next(action);
};

export default loggerMiddleware;
