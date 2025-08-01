import { describe, test, expect, vi, beforeEach } from 'vitest'
import { 
  login,
  register,
  logout,
  getCurrentUser,
  setupAuthListener,
  updatePassword,
  updateProfile,
  deleteAccount
} from '../../../backend/api/services/auth.service'


vi.mock('../../../backend/database/client', () => {
  const mockAuth = {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    getUser: vi.fn(),
    updateUser: vi.fn(),
    onAuthStateChange: vi.fn()
  }

  return {
    supabase: {
      auth: mockAuth,
      from: vi.fn(() => ({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      }))
    }
  }
})

describe('AuthService', () => {
  let mockSupabase: any

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Get the mocked supabase instance
    const { supabase } = await import('../../../backend/database/client')
    mockSupabase = supabase
  })

  afterEach(async () => {
    vi.clearAllMocks()
    
    // Ensure auth mock is reset to authenticated state after each test
    // This prevents test pollution from unauthenticated user tests
    if (mockSupabase?.auth?.getUser) {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null
      })
    }
  })

  test('login should authenticate user with email and password', async () => {
    // Arrange
    const email = 'test@example.com'
    const password = 'password123'

    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: 'user-123', email }, session: { access_token: 'token' } },
      error: null
    })

    // Act
    const result = await login(email, password)

    // Assert
    expect(result).toBe(true)
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email,
      password
    })
  })

  test('login should handle authentication errors', async () => {
    // Arrange
    const email = 'invalid@example.com'
    const password = 'wrongpassword'

    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' }
    })

    // Act & Assert
    await expect(login(email, password)).rejects.toThrow()
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email,
      password
    })
  })

  test('register should create new user account', async () => {
    // Arrange
    const email = 'newuser@example.com'
    const password = 'securepassword123'
    const name = 'John Doe'

    mockSupabase.auth.signUp.mockResolvedValue({
      data: { 
        user: { id: 'new-user-123', email }, 
        session: null 
      },
      error: null
    })

    // Act
    const result = await register(email, password, name)

    // Assert
    expect(result).toBe(true)
    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email,
      password,
      options: {
        data: {
          first_name: name
        }
      }
    })
  })

  test('register should handle registration errors', async () => {
    // Arrange
    const email = 'existing@example.com'
    const password = 'password123'
    const name = 'Jane Doe'

    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'User already registered' }
    })

    // Act & Assert
    await expect(register(email, password, name)).rejects.toThrow()
  })

  test('logout should sign out current user', async () => {
    // Arrange
    mockSupabase.auth.signOut.mockResolvedValue({
      error: null
    })

    // Act
    const result = await logout()

    // Assert
    expect(result).toBe(true)
    expect(mockSupabase.auth.signOut).toHaveBeenCalled()
  })

  test('logout should handle sign out errors', async () => {
    // Arrange
    mockSupabase.auth.signOut.mockResolvedValue({
      error: { message: 'Failed to sign out' }
    })

    // Act & Assert
    await expect(logout()).rejects.toThrow()
  })

  test('getCurrentUser should return authenticated user', async () => {
    // Arrange
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      user_metadata: { first_name: 'John' }
    }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })

    // Act
    const result = await getCurrentUser()

    // Assert
    expect(result).toEqual(mockUser)
    expect(mockSupabase.auth.getUser).toHaveBeenCalled()
  })

  test('getCurrentUser should return null on error', async () => {
    // Arrange
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' }
    })

    // Act
    const result = await getCurrentUser()

    // Assert
    expect(result).toBe(null)
  })



  test('updatePassword should verify current password and update', async () => {
    // Arrange
    const currentPassword = 'oldpassword123'
    const newPassword = 'newpassword456'
    const mockUser = { id: 'user-123', email: 'test@example.com' }

    // Mock getting current user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })

    // Mock password verification
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: mockUser, session: { access_token: 'token' } },
      error: null
    })

    // Mock password update
    mockSupabase.auth.updateUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })

    // Act
    const result = await updatePassword(currentPassword, newPassword)

    // Assert
    expect(result.success).toBe(true)
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: mockUser.email,
      password: currentPassword
    })
    expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
      password: newPassword
    })
  })

  test('updatePassword should handle incorrect current password', async () => {
    // Arrange
    const currentPassword = 'wrongpassword'
    const newPassword = 'newpassword456'
    const mockUser = { id: 'user-123', email: 'test@example.com' }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })

    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' }
    })

    // Act & Assert
    await expect(updatePassword(currentPassword, newPassword))
      .rejects.toThrow('Current password is incorrect')
  })

  test('updateProfile should update user name and email', async () => {
    // Arrange
    const profileData = {
      name: 'Updated Name',
      email: 'newemail@example.com'
    }

    mockSupabase.auth.updateUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: profileData.email } },
      error: null
    })

    // Act
    const result = await updateProfile(profileData)

    // Assert
    expect(result.success).toBe(true)
    expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
      data: { first_name: profileData.name },
      email: profileData.email
    })
  })



  test('updateProfile should handle update errors', async () => {
    // Arrange
    const profileData = { name: 'Updated Name' }

    mockSupabase.auth.updateUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Update failed' }
    })

    // Act & Assert
    await expect(updateProfile(profileData)).rejects.toThrow()
  })

  test('deleteAccount should verify password and delete user data', async () => {
    // Arrange
    const password = 'userpassword123'
    const mockUser = { id: 'user-123', email: 'test@example.com' }

    // Mock user authentication check
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })

    // Mock password verification
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: mockUser, session: { access_token: 'token' } },
      error: null
    })


    const mockDeleteBuilder = {
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null })
      })
    }
    mockSupabase.from.mockReturnValue(mockDeleteBuilder)

    // Mock sign out
    mockSupabase.auth.signOut.mockResolvedValue({ error: null })

    // Act
    const result = await deleteAccount(password)

    // Assert
    expect(result.success).toBe(true)
    expect(result.message).toBe('Account data deleted and signed out')
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: mockUser.email,
      password
    })
    expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    

    expect(mockSupabase.from).toHaveBeenCalledWith('notes')
    expect(mockSupabase.from).toHaveBeenCalledWith('tasks')
    expect(mockSupabase.from).toHaveBeenCalledWith('events')
    expect(mockSupabase.from).toHaveBeenCalledWith('projects')
    expect(mockSupabase.from).toHaveBeenCalledWith('files')
    expect(mockSupabase.from).toHaveBeenCalledWith('ai_conversations')
    expect(mockSupabase.from).toHaveBeenCalledWith('time_logs')
  })

  test('deleteAccount should handle incorrect password', async () => {
    // Arrange
    const password = 'wrongpassword'
    const mockUser = { id: 'user-123', email: 'test@example.com' }

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })

    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' }
    })

    // Act & Assert
    await expect(deleteAccount(password))
      .rejects.toThrow('Password is incorrect')
  })

  test('deleteAccount should handle unauthenticated user', async () => {
    // Arrange
    const password = 'password123'

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null
    })

    // Act & Assert
    await expect(deleteAccount(password))
      .rejects.toThrow('User not authenticated')
  })


}) 