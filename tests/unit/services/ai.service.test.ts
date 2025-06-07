import { describe, test, expect, vi, beforeEach } from 'vitest'
import { 
  detectCommandIntent,
  createTaskFromCommand,
  createEventFromCommand 
} from '../../../src/backend/api/services/ai/commands/commandService'
import { 
  analyzeConversation,
  saveTaskSuggestions,
  saveEventSuggestions 
} from '../../../src/backend/api/services/ai/suggestions/suggestionService'

// Mock the Supabase client
vi.mock('../../../src/integrations/supabase/client', () => {
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
vi.mock('../../../src/backend/api/services/ai/core/geminiService', () => ({
  getGeminiApiKey: vi.fn().mockResolvedValue('test-api-key'),
  callGeminiApiDirectly: vi.fn()
}))

// Mock other services
vi.mock('../../../src/backend/api/services/task.service', () => ({
  createTask: vi.fn()
}))

vi.mock('../../../src/backend/api/services/eventService', () => ({
  createEvent: vi.fn()
}))

vi.mock('../../../src/backend/api/services/project.service', () => ({
  createProject: vi.fn()
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
    const { supabase } = await import('../../../src/integrations/supabase/client')
    const { callGeminiApiDirectly } = await import('../../../src/backend/api/services/ai/core/geminiService')
    
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
    // Arrange
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
        content: 'Research, slides, and practice session',
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

  test('parseCommand should handle invalid JSON response gracefully', async () => {
    // Arrange
    const userMessage = 'Schedule a meeting tomorrow'
    mockCallGeminiApiDirectly.mockResolvedValue('Invalid JSON response from AI')

    // Act
    const result = await detectCommandIntent(userMessage)

    // Assert
    expect(result.hasCommand).toBe(false)
    expect(result.commandType).toBe(null)
    expect(result.entities).toBe(null)
  })

  test('generateSuggestions should handle empty conversation', async () => {
    // Arrange
    const emptyMessages: any[] = []

    // Act
    const result = await analyzeConversation('test-user-id', emptyMessages)

    // Assert
    expect(result).toBeTruthy()
    expect(result!.tasks).toEqual([])
    expect(result!.events).toEqual([])
    expect(result!.hasOverallSuggestions).toBe(false)
    expect(mockCallGeminiApiDirectly).not.toHaveBeenCalled()
  })

  test('createTaskFromCommand should validate required fields', async () => {
    // Arrange
    const userId = 'test-user-id'
    const validEntities = {
      title: 'Complete project documentation',
      description: 'Write comprehensive documentation for the project',
      priority: 'high',
      due_date: '2025-01-25'
    }

    const { createTask } = await import('../../../src/backend/api/services/task.service')
    const mockCreateTask = createTask as any
    mockCreateTask.mockResolvedValue({
      id: 'task-123',
      title: 'Complete project documentation',
      user: userId
    })

    // Act
    const result = await createTaskFromCommand(userId, validEntities)

    // Assert
    expect(result.success).toBe(true)
    expect(result.title).toBe('Complete project documentation')
    expect(mockCreateTask).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Complete project documentation',
      description: 'Write comprehensive documentation for the project',
      priority: 'high',
      due_date: '2025-01-25'
    }))
  })

  test('createTaskFromCommand should handle missing title', async () => {
    // Arrange
    const userId = 'test-user-id'
    const invalidEntities = {
      description: 'Task without a title',
      priority: 'medium'
    }

    // Act
    const result = await createTaskFromCommand(userId, invalidEntities)

    // Assert
    expect(result.success).toBe(false)
    expect(result.error).toBe('Task title is required')
  })

  test('saveTaskSuggestions should store suggestions correctly', async () => {
    // Arrange
    const userId = 'test-user-id'
    const geminiTasks = [
      {
        title: 'Review project requirements',
        description: 'Go through all project requirements carefully',
        due_date: '2025-01-20',
        priority: 'high' as const
      },
      {
        title: 'Setup development environment',
        description: 'Install and configure development tools',
        due_date: '2025-01-18',
        priority: 'medium' as const
      }
    ]
    const messageId = 'message-123'

    const mockInsertedData = geminiTasks.map((task, index) => ({
      id: `suggestion-${index}`,
      user_id: userId,
      title: task.title,
      description: task.description,
      due_date: task.due_date,
      priority: task.priority,
      status: 'suggested',
      source_message_id: messageId,
      created_at: new Date().toISOString()
    }))

    const mockQueryBuilder = {
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: mockInsertedData, error: null })
      })
    }
    mockSupabase.from.mockReturnValue(mockQueryBuilder)

    // Act
    const result = await saveTaskSuggestions(userId, geminiTasks, messageId)

    // Assert
    expect(result).toHaveLength(2)
    expect(result[0].title).toBe('Review project requirements')
    expect(result[1].title).toBe('Setup development environment')
    expect(mockSupabase.from).toHaveBeenCalledWith('task_suggestions')
    expect(mockQueryBuilder.insert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Review project requirements',
          user_id: userId,
          status: 'suggested'
        }),
        expect.objectContaining({
          title: 'Setup development environment',
          user_id: userId,
          status: 'suggested'
        })
      ])
    )
  })

  test('analyzeConversation should handle API key missing', async () => {
    // Arrange
    const { getGeminiApiKey } = await import('../../../src/backend/api/services/ai/core/geminiService')
    const mockGetGeminiApiKey = getGeminiApiKey as any
    mockGetGeminiApiKey.mockResolvedValue(null)

    const messages = [{ 
      id: 'test-msg', 
      conversationId: 'test-conv', 
      userId: 'test-user-id', 
      role: 'user' as const, 
      content: 'Test message',
      createdAt: new Date().toISOString()
    }]

    // Act
    const result = await analyzeConversation('test-user-id', messages)

    // Assert
    expect(result).toBe(null)
    expect(mockCallGeminiApiDirectly).not.toHaveBeenCalled()
  })

  test('detectCommandIntent should handle conversation context', async () => {
    // Arrange
    const userMessage = 'Create the task we discussed'
    const conversationHistory = [
      { role: 'user', content: 'I need to finish the quarterly report by Friday' },
      { role: 'assistant', content: 'That sounds important. Would you like me to help you break it down?' }
    ]

    const expectedResponse = {
      hasCommand: true,
      commandType: 'create_task',
      entities: {
        title: 'Finish quarterly report',
        due_date: '2025-01-19',
        priority: 'high'
      }
    }

    // Ensure API key is available for this test
    const { getGeminiApiKey } = await import('../../../src/backend/api/services/ai/core/geminiService')
    const mockGetGeminiApiKey = getGeminiApiKey as any
    mockGetGeminiApiKey.mockResolvedValue('test-api-key')
    
    mockCallGeminiApiDirectly.mockResolvedValue(JSON.stringify(expectedResponse))

    // Act
    const result = await detectCommandIntent(userMessage, conversationHistory)

    // Assert
    expect(result.hasCommand).toBe(true)
    expect(result.commandType).toBe('create_task')
    expect(mockCallGeminiApiDirectly).toHaveBeenCalledWith(
      'test-api-key',
      expect.arrayContaining([
        expect.objectContaining({
          role: 'user',
          content: expect.stringContaining('Recent conversation context')
        })
      ]),
      expect.any(Object)
    )
  })

  test('analyzeConversation should extract clarifying questions', async () => {
    // Arrange
    const messages = [
      { 
        id: 'msg-1', 
        conversationId: 'conv-1', 
        userId: 'test-user-id', 
        role: 'user' as const, 
        content: 'I have a big project coming up',
        createdAt: new Date().toISOString()
      },
      { 
        id: 'msg-2', 
        conversationId: 'conv-1', 
        userId: 'test-user-id', 
        role: 'assistant' as const, 
        content: 'Tell me more about this project',
        createdAt: new Date().toISOString()
      }
    ]

    const mockGeminiResponse = JSON.stringify({
      tasks: [],
      events: [],
      clarifying_questions: [
        { question_text: 'What is the deadline for this project?' },
        { question_text: 'What are the main deliverables?' }
      ]
    })

    // Ensure API key is available for this test
    const { getGeminiApiKey } = await import('../../../src/backend/api/services/ai/core/geminiService')
    const mockGetGeminiApiKey = getGeminiApiKey as any
    mockGetGeminiApiKey.mockResolvedValue('test-api-key')
    
    mockCallGeminiApiDirectly.mockResolvedValue(mockGeminiResponse)

    // Act
    const result = await analyzeConversation('test-user-id', messages)

    // Assert
    expect(result).toBeTruthy()
    expect(result!.clarifyingQuestions).toHaveLength(2)
    expect(result!.clarifyingQuestions![0].question_text).toBe('What is the deadline for this project?')
    expect(result!.clarifyingQuestions![1].question_text).toBe('What are the main deliverables?')
  })

  // ===== ENHANCED AI TESTING =====
  // Advanced AI features: feedback loops, learning, context awareness, suggestion refinement

  test('generateSuggestions should handle complex project breakdown', async () => {
    // Arrange - Testing advanced project analysis
    const complexMessages = [
      { 
        id: 'msg-1', 
        conversationId: 'conv-1', 
        userId: 'test-user-id', 
        role: 'user' as const, 
        content: 'I need to build a full-stack web application with user authentication, real-time chat, and payment processing. The deadline is in 3 months.',
        createdAt: new Date().toISOString()
      }
    ]

    const mockComplexResponse = JSON.stringify({
      tasks: [
        {
          title: 'Setup project architecture',
          description: 'Design system architecture and choose tech stack',
          due_date: '2025-01-25',
          priority: 'high',
          estimated_hours: 8,
          dependencies: []
        },
        {
          title: 'Implement user authentication',
          description: 'Build secure login/signup system with JWT',
          due_date: '2025-02-05',
          priority: 'high',
          estimated_hours: 16,
          dependencies: ['Setup project architecture']
        },
        {
          title: 'Build real-time chat system',
          description: 'Implement WebSocket-based chat with message history',
          due_date: '2025-02-20',
          priority: 'medium',
          estimated_hours: 24,
          dependencies: ['Implement user authentication']
        },
        {
          title: 'Integrate payment processing',
          description: 'Setup Stripe/PayPal integration for secure payments',
          due_date: '2025-03-10',
          priority: 'high',
          estimated_hours: 20,
          dependencies: ['Implement user authentication']
        }
      ],
      events: [
        {
          title: 'Architecture Review Meeting',
          description: 'Review and finalize system architecture',
          start_time: '2025-01-26T14:00:00Z',
          end_time: '2025-01-26T16:00:00Z',
          priority: 'high'
        }
      ]
    })

    // Ensure API key is available
    const { getGeminiApiKey } = await import('../../../src/backend/api/services/ai/core/geminiService')
    const mockGetGeminiApiKey = getGeminiApiKey as any
    mockGetGeminiApiKey.mockResolvedValue('test-api-key')
    
    mockCallGeminiApiDirectly.mockResolvedValue(mockComplexResponse)

    // Act
    const result = await analyzeConversation('test-user-id', complexMessages)

    // Assert - Testing complex project breakdown
    expect(result).toBeTruthy()
    expect(result!.taskSuggestions).toHaveLength(4)
    expect(result!.eventSuggestions).toHaveLength(1)
    
    // Verify task complexity and details
    const authTask = result!.taskSuggestions.find(t => t.title === 'Implement user authentication')
    expect(authTask).toBeTruthy()
    expect(authTask!.description).toBe('Build secure login/signup system with JWT')
    expect(authTask!.priority).toBe('high')
    
    // Verify event scheduling
    const reviewEvent = result!.eventSuggestions[0]
    expect(reviewEvent.title).toBe('Architecture Review Meeting')
    expect(reviewEvent.description).toBe('Review and finalize system architecture')
  })

  test('analyzeConversation should detect user feedback patterns', async () => {
    // Arrange - Testing feedback loop detection
    const feedbackMessages = [
      { 
        id: 'msg-1', 
        conversationId: 'conv-1', 
        userId: 'test-user-id', 
        role: 'assistant' as const, 
        content: 'I suggest breaking this into 3 tasks: research, development, and testing.',
        createdAt: new Date().toISOString()
      },
      { 
        id: 'msg-2', 
        conversationId: 'conv-1', 
        userId: 'test-user-id', 
        role: 'user' as const, 
        content: 'That\'s too many tasks. I prefer just 2 larger tasks instead.',
        createdAt: new Date().toISOString()
      },
      { 
        id: 'msg-3', 
        conversationId: 'conv-1', 
        userId: 'test-user-id', 
        role: 'user' as const, 
        content: 'Also, I usually work better with shorter deadlines.',
        createdAt: new Date().toISOString()
      }
    ]

    const mockFeedbackResponse = JSON.stringify({
      tasks: [
        {
          title: 'Research and Development',
          description: 'Combined research and development phase',
          due_date: '2025-01-22',
          priority: 'high'
        },
        {
          title: 'Testing and Deployment',
          description: 'Testing and final deployment',
          due_date: '2025-01-24',
          priority: 'medium'
        }
      ],
      events: [],
      user_preferences: {
        task_granularity: 'larger_tasks',
        deadline_preference: 'shorter_deadlines',
        feedback_incorporated: true
      }
    })

    // Ensure API key is available
    const { getGeminiApiKey } = await import('../../../src/backend/api/services/ai/core/geminiService')
    const mockGetGeminiApiKey = getGeminiApiKey as any
    mockGetGeminiApiKey.mockResolvedValue('test-api-key')
    
    mockCallGeminiApiDirectly.mockResolvedValue(mockFeedbackResponse)

    // Act
    const result = await analyzeConversation('test-user-id', feedbackMessages)

    // Assert - Testing feedback incorporation
    expect(result).toBeTruthy()
    expect(result!.taskSuggestions).toHaveLength(2) // Reduced from 3 based on feedback
    
    // Verify task consolidation based on feedback
    const researchTask = result!.taskSuggestions.find(t => t.title === 'Research and Development')
    const testingTask = result!.taskSuggestions.find(t => t.title === 'Testing and Deployment')
    expect(researchTask).toBeTruthy()
    expect(testingTask).toBeTruthy()
  })

  test('detectCommandIntent should handle multi-step commands', async () => {
    // Arrange - Testing complex command detection
    const complexCommand = 'Create a task for the quarterly report due Friday, schedule a meeting with the team for Monday at 2pm to discuss it, and set a reminder for Wednesday to check progress'
    
    const expectedMultiStepResponse = {
      hasCommand: true,
      commandType: 'multi_step',
      entities: {
        tasks: [
          {
            title: 'Quarterly report',
            due_date: '2025-01-19',
            priority: 'high'
          }
        ],
        events: [
          {
            title: 'Team meeting - Quarterly report discussion',
            start_time: '2025-01-22T14:00:00Z',
            end_time: '2025-01-22T15:00:00Z'
          }
        ],
        reminders: [
          {
            title: 'Check quarterly report progress',
            reminder_time: '2025-01-17T09:00:00Z'
          }
        ]
      }
    }

    // Ensure API key is available
    const { getGeminiApiKey } = await import('../../../src/backend/api/services/ai/core/geminiService')
    const mockGetGeminiApiKey = getGeminiApiKey as any
    mockGetGeminiApiKey.mockResolvedValue('test-api-key')
    
    mockCallGeminiApiDirectly.mockResolvedValue(JSON.stringify(expectedMultiStepResponse))

    // Act
    const result = await detectCommandIntent(complexCommand)

    // Assert - Testing multi-step command parsing
    expect(result.hasCommand).toBe(true)
    expect(result.commandType).toBe('multi_step')
    expect(result.entities.tasks).toHaveLength(1)
    expect(result.entities.events).toHaveLength(1)
    expect(result.entities.reminders).toHaveLength(1)
    
    // Verify task details
    expect(result.entities.tasks[0].title).toBe('Quarterly report')
    expect(result.entities.tasks[0].due_date).toBe('2025-01-19')
    
    // Verify event details
    expect(result.entities.events[0].title).toBe('Team meeting - Quarterly report discussion')
    expect(result.entities.events[0].start_time).toBe('2025-01-22T14:00:00Z')
  })

  test('generateSuggestions should adapt to user work patterns', async () => {
    // Arrange - Testing pattern-aware suggestions
    const patternMessages = [
      { 
        id: 'msg-1', 
        conversationId: 'conv-1', 
        userId: 'test-user-id', 
        role: 'user' as const, 
        content: 'I work best in the mornings and prefer 2-hour focused blocks',
        createdAt: new Date().toISOString()
      },
      { 
        id: 'msg-2', 
        conversationId: 'conv-1', 
        userId: 'test-user-id', 
        role: 'user' as const, 
        content: 'I need to prepare a presentation for next week',
        createdAt: new Date().toISOString()
      }
    ]

    const mockPatternResponse = JSON.stringify({
      tasks: [
        {
          title: 'Research presentation content',
          description: 'Gather data and materials for presentation',
          due_date: '2025-01-20',
          priority: 'high',
          suggested_time_block: '09:00-11:00',
          work_pattern_match: 'morning_focus'
        },
        {
          title: 'Create presentation slides',
          description: 'Design and build presentation slides',
          due_date: '2025-01-21',
          priority: 'high',
          suggested_time_block: '09:00-11:00',
          work_pattern_match: 'morning_focus'
        },
        {
          title: 'Practice presentation',
          description: 'Rehearse and refine presentation delivery',
          due_date: '2025-01-22',
          priority: 'medium',
          suggested_time_block: '09:00-11:00',
          work_pattern_match: 'morning_focus'
        }
      ],
      events: [
        {
          title: 'Presentation prep - Research block',
          start_time: '2025-01-20T09:00:00Z',
          end_time: '2025-01-20T11:00:00Z',
          description: 'Focused research session for presentation'
        }
      ],
      work_pattern_analysis: {
        preferred_time: 'morning',
        focus_duration: '2_hours',
        pattern_confidence: 0.9
      }
    })

    // Ensure API key is available
    const { getGeminiApiKey } = await import('../../../src/backend/api/services/ai/core/geminiService')
    const mockGetGeminiApiKey = getGeminiApiKey as any
    mockGetGeminiApiKey.mockResolvedValue('test-api-key')
    
    mockCallGeminiApiDirectly.mockResolvedValue(mockPatternResponse)

    // Act
    const result = await analyzeConversation('test-user-id', patternMessages)

    // Assert - Testing pattern-aware scheduling
    expect(result).toBeTruthy()
    expect(result!.taskSuggestions).toHaveLength(3)
    expect(result!.eventSuggestions).toHaveLength(1)
    
    // Verify task scheduling for morning focus
    const researchTask = result!.taskSuggestions.find(t => t.title === 'Research presentation content')
    const slidesTask = result!.taskSuggestions.find(t => t.title === 'Create presentation slides')
    expect(researchTask).toBeTruthy()
    expect(slidesTask).toBeTruthy()
    
    // Verify event scheduling
    const prepEvent = result!.eventSuggestions[0]
    expect(prepEvent.title).toBe('Presentation prep - Research block')
  })

  test('analyzeConversation should handle context switching', async () => {
    // Arrange - Testing context awareness across topics
    const contextSwitchMessages = [
      { 
        id: 'msg-1', 
        conversationId: 'conv-1', 
        userId: 'test-user-id', 
        role: 'user' as const, 
        content: 'I need to finish the marketing campaign by Thursday',
        createdAt: new Date().toISOString()
      },
      { 
        id: 'msg-2', 
        conversationId: 'conv-1', 
        userId: 'test-user-id', 
        role: 'user' as const, 
        content: 'Actually, let me switch topics. I also have a client meeting to prepare for',
        createdAt: new Date().toISOString()
      },
      { 
        id: 'msg-3', 
        conversationId: 'conv-1', 
        userId: 'test-user-id', 
        role: 'user' as const, 
        content: 'The client meeting is about the new product launch strategy',
        createdAt: new Date().toISOString()
      }
    ]

    const mockContextResponse = JSON.stringify({
      tasks: [
        {
          title: 'Complete marketing campaign',
          description: 'Finalize marketing campaign materials',
          due_date: '2025-01-18',
          priority: 'high',
          context: 'marketing_project'
        },
        {
          title: 'Prepare client meeting materials',
          description: 'Prepare presentation and materials for client meeting',
          due_date: '2025-01-17',
          priority: 'high',
          context: 'client_relations'
        },
        {
          title: 'Research product launch strategies',
          description: 'Research best practices for product launch',
          due_date: '2025-01-17',
          priority: 'medium',
          context: 'client_relations'
        }
      ],
      events: [],
      context_analysis: {
        primary_contexts: ['marketing_project', 'client_relations'],
        context_switches: 1,
        context_confidence: 0.85
      }
    })

    // Ensure API key is available
    const { getGeminiApiKey } = await import('../../../src/backend/api/services/ai/core/geminiService')
    const mockGetGeminiApiKey = getGeminiApiKey as any
    mockGetGeminiApiKey.mockResolvedValue('test-api-key')
    
    mockCallGeminiApiDirectly.mockResolvedValue(mockContextResponse)

    // Act
    const result = await analyzeConversation('test-user-id', contextSwitchMessages)

    // Assert - Testing context switching awareness
    expect(result).toBeTruthy()
    expect(result!.taskSuggestions).toHaveLength(3)
    
    // Verify task categorization by content
    const marketingTask = result!.taskSuggestions.find(t => t.title === 'Complete marketing campaign')
    const clientTasks = result!.taskSuggestions.filter(t => t.title.includes('client') || t.title.includes('product'))
    
    expect(marketingTask).toBeTruthy()
    expect(clientTasks).toHaveLength(2)
    
    // Verify different project contexts are handled
    expect(marketingTask!.description).toBe('Finalize marketing campaign materials')
    expect(clientTasks[0].title).toBe('Prepare client meeting materials')
  })

  test('generateSuggestions should provide intelligent task prioritization', async () => {
    // Arrange - Testing advanced prioritization logic
    const prioritizationMessages = [
      { 
        id: 'msg-1', 
        conversationId: 'conv-1', 
        userId: 'test-user-id', 
        role: 'user' as const, 
        content: 'I have a client presentation tomorrow, a report due next week, and some research that would be nice to finish this month',
        createdAt: new Date().toISOString()
      }
    ]

    const mockPrioritizationResponse = JSON.stringify({
      tasks: [
        {
          title: 'Prepare client presentation',
          description: 'Finalize slides and practice presentation',
          due_date: '2025-01-16',
          priority: 'critical',
          urgency_score: 0.95,
          impact_score: 0.9,
          effort_estimate: 'medium'
        },
        {
          title: 'Complete weekly report',
          description: 'Compile and submit weekly progress report',
          due_date: '2025-01-23',
          priority: 'high',
          urgency_score: 0.7,
          impact_score: 0.8,
          effort_estimate: 'low'
        },
        {
          title: 'Conduct background research',
          description: 'Research for future project planning',
          due_date: '2025-01-31',
          priority: 'low',
          urgency_score: 0.2,
          impact_score: 0.6,
          effort_estimate: 'high'
        }
      ],
      events: [],
      prioritization_analysis: {
        methodology: 'urgency_impact_matrix',
        confidence: 0.88,
        recommendations: [
          'Focus on client presentation first - highest urgency and impact',
          'Schedule report work for early next week',
          'Research can be done in spare time throughout the month'
        ]
      }
    })

    // Ensure API key is available
    const { getGeminiApiKey } = await import('../../../src/backend/api/services/ai/core/geminiService')
    const mockGetGeminiApiKey = getGeminiApiKey as any
    mockGetGeminiApiKey.mockResolvedValue('test-api-key')
    
    mockCallGeminiApiDirectly.mockResolvedValue(mockPrioritizationResponse)

    // Act
    const result = await analyzeConversation('test-user-id', prioritizationMessages)

    // Assert - Testing intelligent prioritization
    expect(result).toBeTruthy()
    expect(result!.taskSuggestions).toHaveLength(3)
    
    // Verify priority ordering by task content
    const presentationTask = result!.taskSuggestions.find(t => t.title === 'Prepare client presentation')
    const reportTask = result!.taskSuggestions.find(t => t.title === 'Complete weekly report')
    const researchTask = result!.taskSuggestions.find(t => t.title === 'Conduct background research')
    
    expect(presentationTask).toBeTruthy()
    expect(presentationTask!.priority).toBe('critical')
    expect(presentationTask!.due_date).toBe('2025-01-16') // Tomorrow
    
    expect(reportTask).toBeTruthy()
    expect(reportTask!.priority).toBe('high')
    
    expect(researchTask).toBeTruthy()
    expect(researchTask!.priority).toBe('low')
  })

  test('handleError should provide graceful AI fallback', async () => {
    // Arrange - Testing AI service resilience
    const { getGeminiApiKey } = await import('../../../src/backend/api/services/ai/core/geminiService')
    const mockGetGeminiApiKey = getGeminiApiKey as any
    mockGetGeminiApiKey.mockRejectedValue(new Error('Gemini API unavailable'))

    const fallbackMessage = 'Create a task for project review'

    // Act - Testing graceful degradation
    const result = await detectCommandIntent(fallbackMessage)
    
    // Assert - Verify graceful fallback behavior
    expect(result.hasCommand).toBe(false)
    expect(result.commandType).toBe(null)
    expect(result.entities).toBe(null)
    
    // Verify error handling doesn't crash the system
    expect(mockGetGeminiApiKey).toHaveBeenCalled()
    expect(mockCallGeminiApiDirectly).not.toHaveBeenCalled()
  })
}) 