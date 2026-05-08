/**
 * =====================================================
 * RETROUVONSLES - Error Middleware
 * Handles errors from actions and services
 * =====================================================
 */

/**
 * Error middleware factory
 * Catches and handles errors from actions
 */
export const errorMiddleware = (store: any) => (next: any) => (action: any) => {
  try {
    // If action has error type, dispatch notification
    if (action.type?.includes('ERROR') || action.type?.includes('FAILED')) {
      console.error('[Error Middleware]', action.type, action.payload);

      // Could dispatch an error notification here
      // store.dispatch({ type: 'ui/addNotification', payload: { ... } });
    }

    return next(action);
  } catch (error) {
    console.error('[Error Middleware] Uncaught error:', error);

    // Dispatch error action
    store.dispatch({
      type: 'error/uncaught',
      payload: {
        message: error instanceof Error ? error.message : 'Unknown error',
        error,
      },
    });

    throw error;
  }
};

export default errorMiddleware;
