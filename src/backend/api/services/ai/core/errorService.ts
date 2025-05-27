/**
 * Enhanced Error Handling Service for AI Features
 * Provides comprehensive error handling, logging, and user-friendly error messages
 */

export interface ErrorContext {
  userId?: string;
  conversationId?: string;
  operation?: string;
  timestamp?: string;
  additionalData?: any;
}

export interface AIError {
  code: string;
  type: 'auth' | 'api' | 'database' | 'validation' | 'network' | 'permission' | 'rate_limit' | 'ai_service';
  message: string;
  userMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  retryable: boolean;
  context?: ErrorContext;
}

export type OperationResult<T> = 
  | { success: true; data: T }
  | { success: false; error: AIError };

/**
 * Predefined error types with user-friendly messages
 */
export const ERROR_TYPES = {
  // Authentication Errors
  AUTH_NO_USER: {
    code: 'AUTH_NO_USER',
    type: 'auth' as const,
    message: 'User not authenticated',
    userMessage: 'Please log in to continue using AI features.',
    severity: 'high' as const,
    retryable: false
  },
  AUTH_INVALID_TOKEN: {
    code: 'AUTH_INVALID_TOKEN',
    type: 'auth' as const,
    message: 'Invalid authentication token',
    userMessage: 'Your session has expired. Please log in again.',
    severity: 'high' as const,
    retryable: false
  },
  
  // API Key Errors
  API_KEY_MISSING: {
    code: 'API_KEY_MISSING',
    type: 'api' as const,
    message: 'Gemini API key not configured',
    userMessage: 'Please add your Gemini API key in Settings to use AI features.',
    severity: 'high' as const,
    retryable: false
  },
  API_KEY_INVALID: {
    code: 'API_KEY_INVALID',
    type: 'api' as const,
    message: 'Invalid Gemini API key',
    userMessage: 'Your API key appears to be invalid. Please check it in Settings.',
    severity: 'high' as const,
    retryable: false
  },
  
  // AI Service Errors
  AI_SERVICE_UNAVAILABLE: {
    code: 'AI_SERVICE_UNAVAILABLE',
    type: 'ai_service' as const,
    message: 'Gemini AI service is unavailable',
    userMessage: 'The AI service is temporarily unavailable. Please try again in a few moments.',
    severity: 'medium' as const,
    retryable: true
  },
  AI_RESPONSE_ERROR: {
    code: 'AI_RESPONSE_ERROR',
    type: 'ai_service' as const,
    message: 'Failed to get response from AI service',
    userMessage: 'Failed to get AI response. Please try rephrasing your question.',
    severity: 'medium' as const,
    retryable: true
  },
  AI_RATE_LIMITED: {
    code: 'AI_RATE_LIMITED',
    type: 'rate_limit' as const,
    message: 'AI service rate limit exceeded',
    userMessage: 'Too many requests. Please wait a moment before trying again.',
    severity: 'medium' as const,
    retryable: true
  },
  
  // Database Errors
  DB_CONNECTION_ERROR: {
    code: 'DB_CONNECTION_ERROR',
    type: 'database' as const,
    message: 'Database connection failed',
    userMessage: 'Unable to connect to the database. Please try again.',
    severity: 'high' as const,
    retryable: true
  },
  DB_QUERY_ERROR: {
    code: 'DB_QUERY_ERROR',
    type: 'database' as const,
    message: 'Database query failed',
    userMessage: 'A database error occurred. Please try again.',
    severity: 'medium' as const,
    retryable: true
  },
  
  // Validation Errors
  VALIDATION_EMPTY_MESSAGE: {
    code: 'VALIDATION_EMPTY_MESSAGE',
    type: 'validation' as const,
    message: 'Empty message provided',
    userMessage: 'Please enter a message to send.',
    severity: 'low' as const,
    retryable: false
  },
  VALIDATION_MESSAGE_TOO_LONG: {
    code: 'VALIDATION_MESSAGE_TOO_LONG',
    type: 'validation' as const,
    message: 'Message exceeds maximum length',
    userMessage: 'Your message is too long. Please shorten it and try again.',
    severity: 'low' as const,
    retryable: false
  },
  VALIDATION_INVALID_COMMAND: {
    code: 'VALIDATION_INVALID_COMMAND',
    type: 'validation' as const,
    message: 'Invalid command format',
    userMessage: 'The command format is invalid. Please check and try again.',
    severity: 'low' as const,
    retryable: false
  },
  
  // Permission Errors
  PERMISSION_DENIED: {
    code: 'PERMISSION_DENIED',
    type: 'permission' as const,
    message: 'User does not have permission for this operation',
    userMessage: 'You don\'t have permission to perform this action.',
    severity: 'medium' as const,
    retryable: false
  },
  
  // Network Errors
  NETWORK_ERROR: {
    code: 'NETWORK_ERROR',
    type: 'network' as const,
    message: 'Network request failed',
    userMessage: 'Network error occurred. Please check your connection and try again.',
    severity: 'medium' as const,
    retryable: true
  },
  
  // Generic Errors
  UNKNOWN_ERROR: {
    code: 'UNKNOWN_ERROR',
    type: 'api' as const,
    message: 'An unknown error occurred',
    userMessage: 'An unexpected error occurred. Please try again.',
    severity: 'medium' as const,
    retryable: true
  }
} as const;

/**
 * Create an AIError from an error type
 */
export const createError = (
  errorType: keyof typeof ERROR_TYPES,
  context?: ErrorContext,
  overrides?: Partial<AIError>
): AIError => {
  const baseError = ERROR_TYPES[errorType];
  return {
    ...baseError,
    context: {
      timestamp: new Date().toISOString(),
      ...context
    },
    ...overrides
  };
};

/**
 * Create an AIError from a generic Error or string
 */
export const createErrorFromException = (
  error: Error | string,
  operation: string,
  context?: ErrorContext
): AIError => {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorStack = typeof error === 'object' && 'stack' in error ? error.stack : undefined;
  
  // Try to map known error patterns to specific error types
  let errorType: keyof typeof ERROR_TYPES = 'UNKNOWN_ERROR';
  
  if (errorMessage.includes('User not authenticated') || errorMessage.includes('auth')) {
    errorType = 'AUTH_NO_USER';
  } else if (errorMessage.includes('API key') || errorMessage.includes('api_key')) {
    errorType = 'API_KEY_MISSING';
  } else if (errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
    errorType = 'AI_RATE_LIMITED';
  } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    errorType = 'NETWORK_ERROR';
  } else if (errorMessage.includes('database') || errorMessage.includes('supabase')) {
    errorType = 'DB_QUERY_ERROR';
  }
  
  const aiError = createError(errorType, {
    operation,
    additionalData: { originalError: errorMessage, stack: errorStack },
    ...context
  });
  
  return aiError;
};

/**
 * Log error with appropriate level based on severity
 */
export const logError = (error: AIError): void => {
  const logData = {
    code: error.code,
    type: error.type,
    message: error.message,
    severity: error.severity,
    context: error.context,
    timestamp: new Date().toISOString()
  };
  
  switch (error.severity) {
    case 'critical':
      console.error('🚨 CRITICAL AI ERROR:', logData);
      break;
    case 'high':
      console.error('❌ HIGH AI ERROR:', logData);
      break;
    case 'medium':
      console.warn('⚠️ MEDIUM AI ERROR:', logData);
      break;
    case 'low':
      console.info('ℹ️ LOW AI ERROR:', logData);
      break;
  }
};

/**
 * Enhanced error wrapper for async operations
 */
export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  operationName: string,
  context?: ErrorContext
): Promise<OperationResult<T>> => {
  try {
    const result = await operation();
    return { success: true, data: result };
  } catch (error) {
    const aiError = createErrorFromException(error as Error, operationName, context);
    logError(aiError);
    return { success: false, error: aiError };
  }
};

/**
 * Retry logic for retryable errors
 */
export const withRetry = async <T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = 3,
  context?: ErrorContext
): Promise<OperationResult<T>> => {
  let lastError: AIError | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await withErrorHandling(
      operation,
      `${operationName} (attempt ${attempt}/${maxRetries})`,
      context
    );
    
    if (result.success) {
      return result;
    }
    
    // Handle the failure case (result is guaranteed to have error when success is false)
    const failureResult = result as { success: false; error: AIError };
    lastError = failureResult.error;
    
    // Don't retry if error is not retryable
    if (!failureResult.error.retryable) {
      break;
    }
    
    // Don't retry on last attempt
    if (attempt === maxRetries) {
      break;
    }
    
    // Exponential backoff delay
    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  return { success: false, error: lastError! };
};

/**
 * Get user-friendly error message with action suggestions
 */
export const getErrorMessageWithAction = (error: AIError): {
  message: string;
  action?: string;
  actionType?: 'retry' | 'navigate' | 'reload' | 'contact';
} => {
  let action: string | undefined;
  let actionType: 'retry' | 'navigate' | 'reload' | 'contact' | undefined;
  
  switch (error.code) {
    case 'API_KEY_MISSING':
    case 'API_KEY_INVALID':
      action = 'Go to Settings';
      actionType = 'navigate';
      break;
    case 'AI_SERVICE_UNAVAILABLE':
    case 'AI_RATE_LIMITED':
    case 'NETWORK_ERROR':
      if (error.retryable) {
        action = 'Try Again';
        actionType = 'retry';
      }
      break;
    case 'AUTH_NO_USER':
    case 'AUTH_INVALID_TOKEN':
      action = 'Log In';
      actionType = 'navigate';
      break;
    case 'DB_CONNECTION_ERROR':
      action = 'Reload Page';
      actionType = 'reload';
      break;
    default:
      if (error.retryable) {
        action = 'Try Again';
        actionType = 'retry';
      } else if (error.severity === 'critical') {
        action = 'Contact Support';
        actionType = 'contact';
      }
  }
  
  return {
    message: error.userMessage,
    action,
    actionType
  };
};

/**
 * Validate user input for common issues
 */
export const validateUserInput = (input: string): AIError | null => {
  if (!input || input.trim().length === 0) {
    return createError('VALIDATION_EMPTY_MESSAGE');
  }
  
  if (input.length > 4000) {
    return createError('VALIDATION_MESSAGE_TOO_LONG');
  }
  
  return null;
};

/**
 * Format error for API responses
 */
export const formatErrorResponse = (error: AIError) => {
  return {
    error: {
      code: error.code,
      message: error.userMessage,
      retryable: error.retryable,
      severity: error.severity,
      timestamp: error.context?.timestamp
    }
  };
}; 