/**
 * Suggestion Service - Re-exports from modular suggestion components
 * This file serves as the main entry point for all suggestion-related functionality
 */

// Re-export types and interfaces from analysis module
export type {
  TaskSuggestion,
  EventSuggestion,
  ClarifyingQuestion,
  GeminiTaskExtraction,
  GeminiEventExtraction,
  ExtractionResult
} from './suggestionAnalysis';

// Re-export analysis functions
export {
  analyzeConversation,
  detectConversationContexts
} from './suggestionAnalysis';

// Re-export management functions and types
export {
  saveTaskSuggestions,
  saveEventSuggestions,
  getSuggestionCounts,
  getTaskSuggestions,
  getEventSuggestions,
  findProjectIdByName,
  updateTaskSuggestionStatus,
  updateEventSuggestionStatus,
  requestSuggestions,
  recordSuggestionFeedback,
  type SuggestionFeedback
} from './suggestionManagement'; 