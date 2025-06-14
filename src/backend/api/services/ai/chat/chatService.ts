/**
 * Chat Service - Re-exports from modular chat service components
 * This file maintains backward compatibility while providing a clean modular structure.
 */

// Re-export types and functions from conversation lifecycle management
export type {
  ChatMessage,
  ChatConversation
} from './conversationLifecycle';

export {
  createConversation,
  getConversations,
  getConversation,
  generateConversationTitle,
  updateConversationTitle,
  deleteConversation
} from './conversationLifecycle';

// Re-export message handling functions
export type {
  ClarifyingQuestion
} from '../suggestions/suggestionService';

export {
  sendMessage
} from './messageHandling';

// Re-export data querying functions
export {
  handleUserDataQuery
} from './dataQuerying/queryHandlers';

