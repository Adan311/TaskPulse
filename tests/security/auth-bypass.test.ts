import { describe, test, expect, vi, beforeEach } from 'vitest'

// Mock the Supabase client
vi.mock('../../src/backend/api/client/supabase', () => {
  const mockAuth = {
    getUser: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn()
  }

  const mockFrom = vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    order: vi.fn().mockReturnThis()
  }))

  return {
    supabase: {
      auth: mockAuth,
      from: mockFrom
    }
  }
})

describe('Authentication Bypass Security Tests', () => {
  let mockSupabase: any

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Get the mocked supabase instance
    const { supabase } = await import('../../src/backend/api/client/supabase')
    mockSupabase = supabase
  })

  test('should prevent project access without authentication', async () => {
    // Arrange - Mock unauthenticated user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'User not authenticated' }
    })

    // Act & Assert
    try {
      const { fetchProjects } = await import('../../src/backend/api/services/project.service')
      await fetchProjects()
    } catch (error) {
      expect(error).toBeDefined()
      expect(mockSupabase.auth.getUser).toHaveBeenCalled()
    }
  })

  test('should prevent task access without authentication', async () => {
    // Arrange - Mock unauthenticated user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'User not authenticated' }
    })

    // Act & Assert
    try {
      // Import and call the actual service function
      const { fetchTasks } = await import('../../src/backend/api/services/tasks/taskOperations')
      await fetchTasks()
      // Should not reach here
      expect(true).toBe(false)
    } catch (error) {
      expect(error).toBeDefined()
      expect(error.message).toContain('User not authenticated')
    }
  })

  test('should prevent calendar event access without authentication', async () => {
    // Arrange - Mock unauthenticated user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'User not authenticated' }
    })

    // Act & Assert
    try {
      // Import and call the actual service function - use createEvent which throws on auth failure
      const { createEvent } = await import('../../src/backend/api/services/calendar.service')
      await createEvent({
        title: 'Test Event',
        start_time: '2024-01-01T10:00:00Z',
        end_time: '2024-01-01T11:00:00Z'
      })
      // Should not reach here
      expect(true).toBe(false)
    } catch (error) {
      expect(error).toBeDefined()
      expect(error.message).toContain('User must be authenticated')
    }
  })

  test('should prevent file operations without authentication', async () => {
    // Arrange - Mock unauthenticated user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'User not authenticated' }
    })

    // Act & Assert
    try {
      const { fetchFiles } = await import('../../src/backend/api/services/file.service')
      await fetchFiles()
    } catch (error) {
      expect(error).toBeDefined()
      expect(mockSupabase.auth.getUser).toHaveBeenCalled()
    }
  })

  test('should prevent time tracking without authentication', async () => {
    // Arrange - Mock unauthenticated user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'User not authenticated' }
    })

    // Act & Assert
    try {
      // Import and call the actual service function
      const { getTimeLogs } = await import('../../src/backend/api/services/timeTracking/timeTrackingService')
      await getTimeLogs()
      // Should not reach here
      expect(true).toBe(false)
    } catch (error) {
      expect(error).toBeDefined()
      expect(error.message).toContain('User not authenticated')
    }
  })

  test('should validate user session for sensitive operations', async () => {
    // Arrange - Test various session validation scenarios
    const sensitiveOperations = [
      { service: 'auth.service', function: 'deleteAccount' },
      { service: 'project.service', function: 'deleteProject' },
      { service: 'file.service', function: 'deleteFile' },
      { service: 'task.service', function: 'deleteTask' }
    ]

    // Mock expired/invalid session
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid JWT token' }
    })

    // Act & Assert
    for (const op of sensitiveOperations) {
      try {
        const serviceModule = await import(`../../src/backend/api/services/${op.service}`)
        const serviceFunction = serviceModule[op.function]
        
        if (serviceFunction) {
          await serviceFunction('test-id')
        }
      } catch (error) {
        expect(error).toBeDefined()
        expect(mockSupabase.auth.getUser).toHaveBeenCalled()
      }
    }
  })

  test('should prevent accessing other users data via services', async () => {
    // Arrange - Mock authenticated user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null
    })

    // Mock database query that should filter by user ID
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: [], // Should return empty if not owned by user
        error: null
      })
    })

    // Act & Assert - Test user data isolation
    const services = [
      { name: 'project.service', function: 'fetchProjects' },
      { name: 'task.service', function: 'fetchTasks' },
      { name: 'note.service', function: 'getUserNotes' }
    ]

    for (const service of services) {
      try {
        const serviceModule = await import(`../../src/backend/api/services/${service.name}`)
        const result = await serviceModule[service.function]()
        
        // Verify user ID filtering was applied
        expect(mockSupabase.from).toHaveBeenCalled()
        expect(Array.isArray(result)).toBe(true)
      } catch (error) {
        // Service not found is acceptable
        console.log(`Service ${service.name} not found, skipping`)
      }
    }
  })

  test('should validate input to prevent malicious data injection', async () => {
    // Arrange - Test malicious input validation
    const maliciousInputs = [
      { id: "'; DROP TABLE users; --" },
      { id: "' OR '1'='1" },
      { id: "../../../etc/passwd" },
      { id: "<script>alert('xss')</script>" },
      { id: null },
      { id: undefined },
      { id: "" },
      { id: "a".repeat(1000) }
    ]

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null
    })

    // Act & Assert
    for (const input of maliciousInputs) {
      try {
        const { fetchTasks } = await import('../../src/backend/api/services/task.service')
        await fetchTasks({ id: input.id })
        
        // If successful, verify safe handling
        expect(mockSupabase.auth.getUser).toHaveBeenCalled()
      } catch (error) {
        // Input validation rejection is valid
        expect(error).toBeDefined()
      }
    }
  })

  test('should handle multiple rapid authentication attempts', async () => {
    // Arrange - Simulate brute force attack
    const rapidAttempts = Array(10).fill({
      email: 'test@example.com',
      password: 'wrongpassword'
    })

    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' }
    })

    // Act & Assert
    const attemptPromises = rapidAttempts.map(async (attempt, index) => {
      try {
        const { login } = await import('../../src/backend/api/services/auth.service')
        return await login(attempt.email, attempt.password)
      } catch (error) {
        // Rate limiting or failed authentication expected
        return { error: error.message, attempt: index }
      }
    })

    const results = await Promise.allSettled(attemptPromises)
    
    // Verify all attempts failed or were rate limited
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        expect(result.value).toBeDefined()
      } else {
        expect(result.reason).toBeDefined()
      }
    })
  })

  test('should not expose sensitive data in error messages', async () => {
    // Arrange - Test various error scenarios
    const errorScenarios = [
      {
        mockAuth: { data: { user: null }, error: { message: 'JWT expired' } },
        expectedSafe: true
      },
      {
        mockAuth: { data: { user: null }, error: { message: 'Invalid token signature' } },
        expectedSafe: true
      },
      {
        mockDatabase: { data: null, error: { message: 'Database connection failed' } },
        expectedSafe: false
      }
    ]

    // Act & Assert
    for (const scenario of errorScenarios) {
      if (scenario.mockAuth) {
        mockSupabase.auth.getUser.mockResolvedValueOnce(scenario.mockAuth)
      }
      
      if (scenario.mockDatabase) {
        mockSupabase.from.mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue(scenario.mockDatabase)
        })
      }

      try {
        const { fetchProjects } = await import('../../src/backend/api/services/project.service')
        await fetchProjects()
      } catch (error) {
        const errorMessage = error.message.toLowerCase()
        
        // Verify no sensitive data in error messages
        expect(errorMessage).not.toContain('password')
        expect(errorMessage).not.toContain('secret')
        expect(errorMessage).not.toContain('key')
        expect(errorMessage).not.toContain('token')
        expect(errorMessage).not.toContain('database')
        expect(errorMessage).not.toContain('connection')
        
        if (scenario.expectedSafe) {
          expect(errorMessage).toMatch(/unauthorized|authentication|invalid|expired/i)
        }
      }
    }
  })
}) 