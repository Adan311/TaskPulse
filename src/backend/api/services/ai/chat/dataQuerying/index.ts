/**
 * Data Querying Services - Re-exports from modular data querying components
 * This file maintains backward compatibility while providing a clean modular structure.
 */

// Re-export query handling functions
export {
  handleUserDataQuery
} from './queryHandlers';

// Re-export parsing utilities and constants
export {
  QUERY_KEYWORDS,
  STATUS_KEYWORDS,
  MONTH_NAMES,
  MONTH_DISPLAY_NAMES,
  QUESTION_WORDS,
  PROJECT_PATTERNS,
  extractProjectInfo,
  parseDateFromQuery,
  hasTimeReference,
  formatFileSize
} from './queryParser'; 