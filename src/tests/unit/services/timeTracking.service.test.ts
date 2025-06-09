import { describe, test, expect, vi, beforeEach } from 'vitest'
import { 
  startTimeTracking,
  getActiveTimeLog,
  pauseTimeTracking,
  resumeTimeTracking,
  stopTimeTracking,
  cancelTimeTracking,
  getTimeLogs,
  getTimeStats,
  updateTimeLog,
  deleteTimeLog,
  getProjectTimeLogs,
  getTaskTimeLogs,
  getEventTimeLogs,
  formatDuration,
  calculateElapsedTime,
  getProjectTimeStats,
  getTimeAnalyticsByType,
  getProductivityInsights
} from '../../../backend/api/services/timeTracking/timeTrackingService'


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
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
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

// Mock UUID
vi.mock('uuid', () => ({
  v4: () => 'test-timelog-id-123'
}))

// Mock Date to have predictable timestamps
const mockDate = new Date('2025-01-16T10:30:00Z')
vi.stubGlobal('Date', class MockDate extends Date {
  constructor(...args: any[]) {
    if (args.length === 0) {
      super('2025-01-16T10:30:00Z')
    } else {
      super(...args as [])
    }
  }

  static now() {
    return mockDate.getTime()
  }

  toISOString() {
    return '2025-01-16T10:30:00.000Z'
  }
})

describe('TimeTrackingService', () => {
  let mockSupabase: any

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Get the mocked supabase instance
    const { supabase } = await import('../../../backend/database/client')
    mockSupabase = supabase
    
    // Reset auth mock to default authenticated state
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      error: null
    })
  })

  afterEach(() => {
    // Ensure all mocks are cleared after each test
    vi.clearAllMocks()
    
    // Reset auth mock to default state to prevent test pollution
    if (mockSupabase?.auth?.getUser) {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null
      })
    }
  })

  test('startTimeTracking should create new active session', async () => {
    // Arrange
    const params = {
      taskId: 'task-123',
      description: 'Working on important task',
      sessionType: 'work' as const,
      timerMode: 'pomodoro' as const
    }

    // Mock no active sessions check
    const mockActiveCheck = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null })
        })
      })
    }

    // Mock session creation
    const mockCreatedSession = {
      id: 'test-timelog-id-123',
      user_id: 'test-user-id',
      task_id: 'task-123',
      start_time: '2025-01-16T10:30:00.000Z',
      description: 'Working on important task',
      session_type: 'work',
      timer_mode: 'pomodoro',
      status: 'active'
    }

    const mockInsertQuery = {
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockCreatedSession, error: null })
        })
      })
    }


    mockSupabase.from
      .mockReturnValueOnce(mockActiveCheck)  // Check for active sessions
      .mockReturnValueOnce(mockInsertQuery)  // Insert new session

    // Act
    const result = await startTimeTracking(params)

    // Assert
    expect(result.id).toBe('test-timelog-id-123')
    expect(result.task_id).toBe('task-123')
    expect(result.session_type).toBe('work')
    expect(result.timer_mode).toBe('pomodoro')
    expect(result.status).toBe('active')
    expect(mockSupabase.from).toHaveBeenCalledWith('time_logs')
  })

  test('startTimeTracking should prevent duplicate active sessions', async () => {
    // Arrange
    const params = { taskId: 'task-123' }

    // Mock existing active session
    const mockActiveCheck = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ 
            data: [{ id: 'existing-active-session' }], 
            error: null 
          })
        })
      })
    }

    mockSupabase.from.mockReturnValue(mockActiveCheck)

    // Act & Assert
    await expect(startTimeTracking(params)).rejects.toThrow(
      'There is already an active time tracking session. Please stop it first.'
    )
  })

  test('getActiveTimeLog should return current active session', async () => {
    // Arrange
    const mockActiveSession = {
      id: 'active-session-123',
      user_id: 'test-user-id',
      task_id: 'task-456',
      start_time: '2025-01-16T09:00:00Z',
      status: 'active',
      session_type: 'work'
    }

    const mockQuery = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [mockActiveSession], error: null })
      })
    }
    mockSupabase.from.mockReturnValue(mockQuery)

    // Act
    const result = await getActiveTimeLog()

    // Assert
    expect(result?.id).toBe('active-session-123')
    expect(result?.status).toBe('active')
    expect(mockQuery.select().eq).toHaveBeenCalledWith('user_id', 'test-user-id')
    expect(mockQuery.select().eq().order).toHaveBeenCalledWith('start_time', { ascending: false })
    expect(mockQuery.select().eq().order().limit).toHaveBeenCalledWith(1)
  })



  test('pauseTimeTracking should pause active session', async () => {
    // Arrange
    const mockActiveSession = {
      id: 'active-session-123',
      user_id: 'test-user-id',
      status: 'active',
      start_time: '2025-01-16T09:00:00Z'
    }

    // Mock getting active session
    const mockSelectQuery = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [mockActiveSession], error: null })
      })
    }

    // Mock updating session to paused
    const mockUpdateQuery = {
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ data: [{ ...mockActiveSession, status: 'paused' }], error: null })
      })
    }

    mockSupabase.from
      .mockReturnValueOnce(mockSelectQuery)  // First call to get active session
      .mockReturnValueOnce(mockUpdateQuery)  // Second call to update

    // Act
    const result = await pauseTimeTracking()

    // Assert
    expect(result.status).toBe('paused')
    expect(result.id).toBe('active-session-123')
    expect(mockUpdateQuery.update).toHaveBeenCalledWith({ status: 'paused' })
  })

  test('resumeTimeTracking should resume paused session', async () => {
    // Arrange
    const mockPausedSession = {
      id: 'paused-session-123',
      user_id: 'test-user-id',
      status: 'paused',
      start_time: '2025-01-16T09:00:00Z'
    }

    // Mock getting paused session
    const mockSelectQuery = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [mockPausedSession], error: null })
      })
    }

    // Mock updating session to active
    const mockUpdateQuery = {
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { ...mockPausedSession, status: 'active' }, error: null })
          })
        })
      })
    }

    mockSupabase.from
      .mockReturnValueOnce(mockSelectQuery)  // First call to get paused session
      .mockReturnValueOnce(mockUpdateQuery)  // Second call to update

    // Act
    const result = await resumeTimeTracking()

    // Assert
    expect(result.status).toBe('active')
    expect(result.id).toBe('paused-session-123')
    expect(mockUpdateQuery.update).toHaveBeenCalledWith({ status: 'active' })
  })

  test('stopTimeTracking should complete session and calculate duration', async () => {
    // Arrange
    const mockActiveSession = {
      id: 'active-session-123',
      user_id: 'test-user-id',
      status: 'active',
      start_time: '2025-01-16T09:00:00Z'
    }

    const mockCompletedSession = {
      ...mockActiveSession,
      status: 'completed',
      end_time: '2025-01-16T10:30:00.000Z',
      duration_seconds: 5400 // 1.5 hours
    }

    // Mock getting active session
    const mockSelectQuery = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [mockActiveSession], error: null })
          })
        })
      })
    }

    // Mock updating session to completed
    const mockUpdateQuery = {
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({ data: [mockCompletedSession], error: null })
          })
        })
      })
    }

    mockSupabase.from
      .mockReturnValueOnce(mockSelectQuery)  // First call to get active session
      .mockReturnValueOnce(mockUpdateQuery)  // Second call to update

    // Act
    const result = await stopTimeTracking()

    // Assert
    expect(result.status).toBe('completed')
    expect(result.end_time).toBe('2025-01-16T10:30:00.000Z')
    expect(result.duration_seconds).toBe(5400)
    expect(mockUpdateQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'completed',
        end_time: expect.any(String)
      })
    )
  })

  test('getTimeLogs should return filtered time logs', async () => {
    // Arrange
    const mockTimeLogs = [
      {
        id: 'log-1',
        user_id: 'test-user-id',
        task_id: 'task-123',
        start_time: '2025-01-16T09:00:00Z',
        status: 'completed',
        session_type: 'work'
      },
      {
        id: 'log-2',
        user_id: 'test-user-id',
        project_id: 'project-456',
        start_time: '2025-01-15T14:00:00Z',
        status: 'completed',
        session_type: 'meeting'
      }
    ]

    const mockQuery = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockTimeLogs, error: null })
        })
      })
    }
    mockSupabase.from.mockReturnValue(mockQuery)

    // Act
    const result = await getTimeLogs()

    // Assert
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('log-1')
    expect(result[1].id).toBe('log-2')
  })

  test('getTimeStats should calculate time statistics', async () => {
    // Arrange
    const mockTimeLogs = [
      {
        duration_seconds: 3600, // 1 hour
        start_time: '2025-01-16T09:00:00Z',
        status: 'completed'
      },
      {
        duration_seconds: 1800, // 30 minutes
        start_time: '2025-01-16T14:00:00Z',
        status: 'completed'
      }
    ]


    const mockQuery = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockImplementation((field, value) => {
          if (field === 'status') {
            return { order: vi.fn().mockResolvedValue({ data: mockTimeLogs, error: null }) }
          }
          return mockQuery.select()
        })
      })
    }
    mockSupabase.from.mockReturnValue(mockQuery)

    // Act
    const result = await getTimeStats()

    // Assert
    expect(result.totalMinutes).toBe(90) // 1.5 hours total
    expect(result.totalSessions).toBe(2)
    expect(result.averageSessionMinutes).toBe(45) // 90 minutes / 2 sessions
  })

  test('updateTimeLog should modify specific fields', async () => {
    // Arrange
    const timeLogId = 'log-123'
    const updates = {
      description: 'Updated description',
      session_type: 'meeting' as const
    }

    const mockUpdatedLog = {
      id: timeLogId,
      description: 'Updated description',
      session_type: 'meeting',
      user_id: 'test-user-id'
    }

    const mockQuery = {
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockUpdatedLog, error: null })
        })
      })
    }
    mockSupabase.from.mockReturnValue(mockQuery)

    // Act
    const result = await updateTimeLog(timeLogId, updates)

    // Assert
    expect(result.description).toBe('Updated description')
    expect(result.session_type).toBe('meeting')
    expect(mockQuery.update).toHaveBeenCalledWith(updates)
    expect(mockQuery.update().eq).toHaveBeenCalledWith('id', timeLogId)
    expect(mockQuery.update().eq).toHaveBeenCalledWith('user_id', 'test-user-id')
  })

  test('deleteTimeLog should remove time log with permission check', async () => {
    // Arrange
    const timeLogId = 'log-to-delete'

    const mockQuery = {
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      })
    }

    mockSupabase.from.mockReturnValue(mockQuery)

    // Act
    await deleteTimeLog(timeLogId)

    // Assert
    expect(mockSupabase.from).toHaveBeenCalledWith('time_logs')
    expect(mockQuery.delete).toHaveBeenCalled()
  })

  test('getProjectTimeLogs should filter by project ID', async () => {
    // Arrange
    const projectId = 'project-456'
    const mockProjectLogs = [
      {
        id: 'log-1',
        project_id: projectId,
        user_id: 'test-user-id',
        duration_seconds: 3600
      }
    ]

    const mockQuery = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockProjectLogs, error: null })
      })
    }
    mockSupabase.from.mockReturnValue(mockQuery)

    // Act
    const result = await getProjectTimeLogs(projectId)

    // Assert
    expect(result).toHaveLength(1)
    expect(result[0].project_id).toBe(projectId)
    expect(mockQuery.select().eq).toHaveBeenCalledWith('user_id', 'test-user-id')
    expect(mockQuery.select().eq).toHaveBeenCalledWith('project_id', projectId)
  })





  test('getProjectTimeStats should calculate project-specific statistics', async () => {
    // Arrange
    const projectId = 'project-123'
    const mockProjectLogs = [
      {
        duration_seconds: 7200, // 2 hours
        start_time: '2025-01-16T09:00:00Z'
      },
      {
        duration_seconds: 3600, // 1 hour
        start_time: '2025-01-15T09:00:00Z'
      }
    ]

    const mockQuery = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockProjectLogs, error: null })
      })
    }
    mockSupabase.from.mockReturnValue(mockQuery)

    // Act
    const result = await getProjectTimeStats(projectId)

    // Assert
    expect(result.totalMinutes).toBe(180) // 3 hours total
    expect(result.sessionsCount).toBe(2)
    expect(result.averageSessionMinutes).toBe(90) // 180 / 2
  })

  test('getTimeAnalyticsByType should break down time by session type', async () => {
    // Arrange
    const mockAnalyticsLogs = [
      {
        session_type: 'work',
        duration_seconds: 7200, // 2 hours = 120 minutes
        start_time: '2025-01-16T09:00:00Z'
      },
      {
        session_type: 'meeting',
        duration_seconds: 1800, // 30 minutes
        start_time: '2025-01-16T14:00:00Z'
      },
      {
        session_type: 'break',
        duration_seconds: 900, // 15 minutes
        start_time: '2025-01-16T12:00:00Z'
      }
    ]

    const mockQuery = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            not: vi.fn().mockResolvedValue({ data: mockAnalyticsLogs, error: null })
          })
        })
      })
    }
    mockSupabase.from.mockReturnValue(mockQuery)

    // Act
    const result = await getTimeAnalyticsByType(7)

    // Assert
    expect(result.work).toBe(120) // 2 hours
    expect(result.meeting).toBe(30) // 30 minutes
    expect(result.break).toBe(15) // 15 minutes
    expect(result.planning).toBe(0) // No planning sessions
  })

  test('startTimeTracking should handle authentication errors', async () => {
    // Arrange
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null
    })

    // Act & Assert
    await expect(startTimeTracking({ taskId: 'task-123' }))
      .rejects.toThrow('User not authenticated')
  })





  test('getActiveTimeLog should handle unauthenticated user gracefully', async () => {
    // Arrange
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null
    })

    // Act
    const result = await getActiveTimeLog()

    // Assert
    expect(result).toBe(null)
    expect(mockSupabase.from).not.toHaveBeenCalled()
  })
}) 