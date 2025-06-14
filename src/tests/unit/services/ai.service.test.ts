import { describe, test, expect, vi, beforeEach } from 'vitest'
import { 
  detectCommandIntent,
  createTaskFromCommand,
  createEventFromCommand 
} from '../../../backend/api/services/ai/commands/commandService'
import { 
  analyzeConversation,
  saveTaskSuggestions,
  saveEventSuggestions 
} from '../../../backend/api/services/ai/suggestions/suggestionService'


vi.mock('../../../backend/database/client', () => {
  const createMockQueryBuilder = () => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn(),
    then: vi.fn()
  })

  return {
    supabase: {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id', email: 'test@example.com' } },
          error: null
        })
      },
      from: vi.fn(() => createMockQueryBuilder())
    }
  }
})

// Mock Gemini service
vi.mock('../../../backend/api/services/ai/core/geminiService', () => ({
  getGeminiApiKey: vi.fn().mockResolvedValue('test-api-key'),
  callGeminiApiDirectly: vi.fn()
}))

// Mock other services
vi.mock('../../../backend/api/services/task.service', () => ({
  createTask: vi.fn()
}))

// Mock event service
vi.mock('../../../backend/api/services/event.service', () => ({
  createEvent: vi.fn()
}))

// Mock UUID
vi.mock('uuid', () => ({
  v4: () => 'test-suggestion-id-123'
}))

describe('AIService', () => {
  let mockSupabase: any
  let mockCallGeminiApiDirectly: any

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Get the mocked instances
    const { supabase } = await import('../../../backend/database/client')
    const { callGeminiApiDirectly } = await import('../../../backend/api/services/ai/core/geminiService')
    
    mockSupabase = supabase
    mockCallGeminiApiDirectly = callGeminiApiDirectly
    
    // Reset auth mock to default authenticated state
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      error: null
    })
  })

  test('parseCommand should extract task details from natural language', async () => {
    // Arrange
    const userMessage = 'Create a task to finish the report by Friday with high priority'
    const expectedResponse = {
      hasCommand: true,
      commandType: 'create_task',
      entities: {
        title: 'Finish the report',
        description: 'Task to finish the report',
        due_date: '2025-01-19',
        priority: 'high'
      }
    }

    mockCallGeminiApiDirectly.mockResolvedValue(JSON.stringify(expectedResponse))

    // Act
    const result = await detectCommandIntent(userMessage)

    // Assert
    expect(result.hasCommand).toBe(true)
    expect(result.commandType).toBe('create_task')
    expect(result.entities.title).toBe('Finish the report')
    expect(result.entities.priority).toBe('high')
    expect(mockCallGeminiApiDirectly).toHaveBeenCalledWith(
      'test-api-key',
      expect.arrayContaining([
        expect.objectContaining({
          role: 'user',
          content: expect.stringContaining('Create a task to finish the report by Friday with high priority')
        })
      ]),
      expect.objectContaining({
        temperature: 0.1,
        maxOutputTokens: 1024
      })
    )
  })

  test('generateSuggestions should return valid task breakdowns', async () => {
    // Arrange - Use actionable conversation that will trigger suggestions
    const conversationMessages = [
      { 
        id: 'msg-1', 
        conversationId: 'conv-1', 
        userId: 'test-user-id', 
        role: 'user' as const, 
        content: 'I need to prepare for the presentation next week',
        createdAt: new Date().toISOString()
      },
      { 
        id: 'msg-2', 
        conversationId: 'conv-1', 
        userId: 'test-user-id', 
        role: 'assistant' as const, 
        content: 'What aspects do you need to prepare?',
        createdAt: new Date().toISOString()
      },
      { 
        id: 'msg-3', 
        conversationId: 'conv-1', 
        userId: 'test-user-id', 
        role: 'user' as const, 
        content: 'I need to do research, slides, and practice session',
        createdAt: new Date().toISOString()
      }
    ]

    const mockGeminiResponse = JSON.stringify({
      tasks: [
        {
          title: 'Research presentation topics',
          description: 'Gather information and data for the presentation',
          due_date: '2025-01-22',
          priority: 'high'
        },
        {
          title: 'Create presentation slides',
          description: 'Design and build the presentation slides',
          due_date: '2025-01-23',
          priority: 'medium'
        },
        {
          title: 'Practice presentation',
          description: 'Rehearse the presentation delivery',
          due_date: '2025-01-24',
          priority: 'medium'
        }
      ],
      events: [],
      clarifying_questions: []
    })

    mockCallGeminiApiDirectly.mockResolvedValue(mockGeminiResponse)

    // Act
    const result = await analyzeConversation('test-user-id', conversationMessages)

    // Assert
    expect(result).toBeTruthy()
    expect(result!.tasks).toHaveLength(3)
    expect(result!.tasks[0].title).toBe('Research presentation topics')
    expect(result!.tasks[1].title).toBe('Create presentation slides')
    expect(result!.tasks[2].title).toBe('Practice presentation')
    expect(result!.hasOverallSuggestions).toBe(true)
    expect(mockCallGeminiApiDirectly).toHaveBeenCalledWith(
      'test-api-key',
      expect.arrayContaining([
        expect.objectContaining({
          role: 'user',
          content: expect.stringContaining('Conversation to analyze')
        })
      ]),
      expect.objectContaining({
        temperature: 0.2,
        maxOutputTokens: 1500
      })
    )
  })

  test('handleError should gracefully fallback to manual input', async () => {
    // Arrange - Mock API failure
    const userMessage = 'Create a task for project review'
    mockCallGeminiApiDirectly.mockRejectedValue(new Error('Gemini API unavailable'))

    // Act
    const result = await detectCommandIntent(userMessage)

    // Assert - Should return safe fallback
    expect(result.hasCommand).toBe(false)
    expect(result.commandType).toBe(null)
    expect(result.entities).toBe(null)
    expect(mockCallGeminiApiDirectly).toHaveBeenCalled()
  })

  test('analyzeConversation should handle API key missing', async () => {
    // Arrange
    const { getGeminiApiKey } = await import('../../../backend/api/services/ai/core/geminiService')
    const mockGetGeminiApiKey = getGeminiApiKey as any
    mockGetGeminiApiKey.mockResolvedValue(null)

    // Use an actionable message that would normally trigger suggestions
    const messages = [{ 
      id: 'test-msg', 
      conversationId: 'test-conv', 
      userId: 'test-user-id', 
      role: 'user' as const, 
      content: 'I need to create a task for this project',
      createdAt: new Date().toISOString()
    }]

    // Act
    const result = await analyzeConversation('test-user-id', messages)

    // Assert
    expect(result).toBe(null)
    expect(mockCallGeminiApiDirectly).not.toHaveBeenCalled()
  })
}) 