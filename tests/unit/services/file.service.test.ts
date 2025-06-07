import { describe, test, expect, vi, beforeEach } from 'vitest'
import { 
  fetchFiles,
  getFileById,
  uploadFile,
  getFileDownloadUrl,
  deleteFile,
  attachFile,
  detachFile,
  canPreviewFile
} from '../../../src/backend/api/services/file.service'

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
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    then: vi.fn()
  })

  const createMockStorage = () => ({
    upload: vi.fn().mockResolvedValue({ data: { path: 'test/path.pdf' }, error: null }),
    remove: vi.fn().mockResolvedValue({ data: null, error: null }),
    getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.com/file.pdf' } })
  })

  return {
    supabase: {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id', email: 'test@example.com' } },
          error: null
        })
      },
      from: vi.fn(() => createMockQueryBuilder()),
      storage: {
        from: vi.fn(() => createMockStorage())
      }
    }
  }
})

// Mock UUID
vi.mock('uuid', () => ({
  v4: () => 'test-file-id-123'
}))

// Mock Math.random for consistent file naming
const mockMath = Object.create(global.Math)
mockMath.random = () => 0.5
global.Math = mockMath

describe('FileService', () => {
  let mockSupabase: any

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Get the mocked supabase instance
    const { supabase } = await import('../../../src/integrations/supabase/client')
    mockSupabase = supabase
    
    // Reset auth mock to default authenticated state
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      error: null
    })
  })

  test('fetchFiles should return user files with optional filtering', async () => {
    // Arrange
    const mockFiles = [
      {
        id: 'file-1',
        name: 'Project Document.pdf',
        file: 'test-user-id/doc.pdf',
        type: 'application/pdf',
        size: 1024000,
        user: 'test-user-id',
        project: 'project-123',
        uploaded_at: '2025-01-16T10:00:00Z'
      },
      {
        id: 'file-2',
        name: 'Task Image.jpg',
        file: 'test-user-id/image.jpg',
        type: 'image/jpeg',
        size: 512000,
        user: 'test-user-id',
        task: 'task-456',
        uploaded_at: '2025-01-15T10:00:00Z'
      }
    ]

    const mockQueryBuilder = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: mockFiles, error: null })
      })
    }
    mockSupabase.from.mockReturnValue(mockQueryBuilder)

    // Act
    const result = await fetchFiles()

    // Assert
    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('Project Document.pdf')
    expect(result[1].name).toBe('Task Image.jpg')
    expect(mockSupabase.from).toHaveBeenCalledWith('files')
    expect(mockQueryBuilder.select().eq).toHaveBeenCalledWith('user', 'test-user-id')
  })

  test('fetchFiles should apply project filter correctly', async () => {
    // Arrange
    const mockProjectFiles = [
      {
        id: 'file-1',
        name: 'Project Document.pdf',
        project: 'project-123',
        user: 'test-user-id'
      }
    ]

    const mockQueryBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis()
    }
    // Set up chained eq calls
    mockQueryBuilder.eq
      .mockReturnValueOnce(mockQueryBuilder) // First eq for user
      .mockResolvedValueOnce({ data: mockProjectFiles, error: null }) // Second eq for project

    mockSupabase.from.mockReturnValue(mockQueryBuilder)

    // Act
    const result = await fetchFiles({ project_id: 'project-123' })

    // Assert
    expect(result).toHaveLength(1)
    expect(result[0].project).toBe('project-123')
    expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user', 'test-user-id')
    expect(mockQueryBuilder.eq).toHaveBeenCalledWith('project', 'project-123')
  })

  test('uploadFile should upload to storage and save metadata', async () => {
    // Arrange
    const mockFile = new File(['test content'], 'test-document.pdf', { 
      type: 'application/pdf' 
    })
    Object.defineProperty(mockFile, 'size', { value: 1024 })

    const uploadParams = {
      file: mockFile,
      name: 'Test Document',
      project_id: 'project-123'
    }

    const mockCreatedFile = {
      id: 'test-file-id-123',
      name: 'Test Document',
      file: 'test-user-id/i.pdf',
      type: 'application/pdf',
      size: 1024,
      user: 'test-user-id',
      project: 'project-123',
      task: null,
      event: null,
      uploaded_at: expect.any(String)
    }

    // Create a spy for storage upload that we can track  
    const mockStorageUpload = vi.fn().mockResolvedValue({ data: { path: 'test-user-id/i.pdf' }, error: null })
    
    // Mock storage bucket
    const mockStorageBucket = {
      upload: mockStorageUpload,
      remove: vi.fn().mockResolvedValue({ data: null, error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.com/file.pdf' } })
    }
    
    // Override the storage.from mock to return our tracked bucket
    mockSupabase.storage.from.mockReturnValue(mockStorageBucket)

    // Mock database insert
    const mockQueryBuilder = {
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockCreatedFile, error: null })
        })
      })
    }
    mockSupabase.from.mockReturnValue(mockQueryBuilder)

    // Act
    const result = await uploadFile(uploadParams)

    // Assert
    expect(result.id).toBe('test-file-id-123')
    expect(result.name).toBe('Test Document')
    expect(result.project).toBe('project-123')
    expect(result.type).toBe('application/pdf')
    expect(mockStorageUpload).toHaveBeenCalledWith('test-user-id/i.pdf', mockFile)
    expect(mockQueryBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test Document',
        file: 'test-user-id/i.pdf',
        type: 'application/pdf',
        size: 1024,
        project: 'project-123'
      })
    )
  })

  test('uploadFile should handle storage upload errors', async () => {
    // Arrange
    const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' })
    const uploadParams = { file: mockFile }

    // Mock storage upload failure
    const mockStorage = mockSupabase.storage.from()
    mockStorage.upload.mockResolvedValue({ 
      data: null, 
      error: { message: 'Storage upload failed' } 
    })

    // Act & Assert
    await expect(uploadFile(uploadParams)).rejects.toThrow()
  })

  test('uploadFile should cleanup storage on database insert failure', async () => {
    // Arrange
    const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' })
    const uploadParams = { file: mockFile }

    // Mock successful storage upload
    const mockStorage = mockSupabase.storage.from()
    mockStorage.upload.mockResolvedValue({ data: { path: 'test-user-id/i.pdf' }, error: null })

    // Mock database insert failure
    const mockQueryBuilder = {
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
        })
      })
    }
    mockSupabase.from.mockReturnValue(mockQueryBuilder)

    // Act & Assert
    await expect(uploadFile(uploadParams)).rejects.toThrow()
    expect(mockStorage.remove).toHaveBeenCalledWith(['test-user-id/i.pdf'])
  })

  test('getFileById should return specific file with permission check', async () => {
    // Arrange
    const fileId = 'specific-file-id'
    const mockFile = {
      id: fileId,
      name: 'Specific File.pdf',
      file: 'test-user-id/specific.pdf',
      type: 'application/pdf',
      user: 'test-user-id'
    }

    const mockQueryBuilder = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockFile, error: null })
      })
    }
    mockSupabase.from.mockReturnValue(mockQueryBuilder)

    // Act
    const result = await getFileById(fileId)

    // Assert
    expect(result.id).toBe(fileId)
    expect(result.name).toBe('Specific File.pdf')
    expect(mockQueryBuilder.select().eq).toHaveBeenCalledWith('id', fileId)
    expect(mockQueryBuilder.select().eq).toHaveBeenCalledWith('user', 'test-user-id')
  })

  test('getFileDownloadUrl should return public URL for file', async () => {
    // Arrange
    const fileId = 'test-file-id'
    const mockFile = {
      id: fileId,
      file: 'test-user-id/document.pdf',
      user: 'test-user-id'
    }

    // Mock getFileById
    const mockQueryBuilder = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockFile, error: null })
      })
    }
    mockSupabase.from.mockReturnValue(mockQueryBuilder)

    // Mock storage getPublicUrl specifically for this test
    const mockStorageBucket = {
      upload: vi.fn(),
      remove: vi.fn(),
      getPublicUrl: vi.fn().mockReturnValue({ 
        data: { publicUrl: 'https://test.com/document.pdf' } 
      })
    }
    mockSupabase.storage.from.mockReturnValue(mockStorageBucket)

    // Act
    const result = await getFileDownloadUrl(fileId)

    // Assert
    expect(result).toBe('https://test.com/document.pdf')
    expect(mockStorageBucket.getPublicUrl).toHaveBeenCalledWith('test-user-id/document.pdf')
  })

  test('deleteFile should remove from storage and database', async () => {
    // Arrange
    const fileId = 'file-to-delete'
    const mockFile = {
      id: fileId,
      file: 'test-user-id/delete-me.pdf',
      user: 'test-user-id'
    }

    // Mock file query
    const mockSelectQuery = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockFile, error: null })
      })
    }

    // Mock file deletion
    const mockDeleteQuery = {
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      })
    }

    // Return different mocks for different calls
    mockSupabase.from
      .mockReturnValueOnce(mockSelectQuery)  // First call to get file
      .mockReturnValueOnce(mockDeleteQuery)  // Second call to delete

    // Mock storage removal
    const mockStorage = mockSupabase.storage.from()
    mockStorage.remove.mockResolvedValue({ data: null, error: null })

    // Act
    const result = await deleteFile(fileId)

    // Assert
    expect(result).toBe(true)
    expect(mockStorage.remove).toHaveBeenCalledWith(['test-user-id/delete-me.pdf'])
    expect(mockSupabase.from).toHaveBeenCalledWith('files')
  })

  test('attachFile should link file to project', async () => {
    // Arrange
    const fileId = 'test-file-id'
    const entityType = 'project'
    const entityId = 'project-123'

    const mockAttachedFile = {
      id: fileId,
      name: 'Attached File.pdf',
      project: entityId,
      user: 'test-user-id'
    }

    // Mock the file permission check first
    const mockSelectQuery = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockAttachedFile, error: null })
          })
        })
      })
    }
    
    // Mock the update query
    const mockUpdateQuery = {
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockAttachedFile, error: null })
            })
          })
        })
      })
    }
    
    // Return different mocks for different calls
    mockSupabase.from
      .mockReturnValueOnce(mockSelectQuery)  // First call for permission check
      .mockReturnValueOnce(mockUpdateQuery)  // Second call for update

    // Act
    const result = await attachFile(fileId, entityType, entityId)

    // Assert
    expect(result.project).toBe(entityId)
    expect(mockUpdateQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({ project: entityId })
    )
  })

  test('attachFile should link file to task', async () => {
    // Arrange
    const fileId = 'test-file-id'
    const entityType = 'task'
    const entityId = 'task-456'

    const mockAttachedFile = {
      id: fileId,
      task: entityId,
      user: 'test-user-id'
    }

    // Mock the file permission check first
    const mockSelectQuery = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockAttachedFile, error: null })
          })
        })
      })
    }
    
    // Mock the update query
    const mockUpdateQuery = {
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockAttachedFile, error: null })
            })
          })
        })
      })
    }
    
    // Return different mocks for different calls
    mockSupabase.from
      .mockReturnValueOnce(mockSelectQuery)  // First call for permission check
      .mockReturnValueOnce(mockUpdateQuery)  // Second call for update

    // Act
    const result = await attachFile(fileId, entityType, entityId)

    // Assert
    expect(result.task).toBe(entityId)
    expect(mockUpdateQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({ task: entityId })
    )
  })

  test('detachFile should remove file attachment from project', async () => {
    // Arrange
    const fileId = 'test-file-id'
    const entityType = 'project'

    const mockDetachedFile = {
      id: fileId,
      name: 'Detached File.pdf',
      project: null,
      user: 'test-user-id'
    }

    const mockQueryBuilder = {
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockDetachedFile, error: null })
        })
      })
    }
    mockSupabase.from.mockReturnValue(mockQueryBuilder)

    // Act
    const result = await detachFile(fileId, entityType)

    // Assert
    expect(result.project).toBe(null)
    expect(mockQueryBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({ project: null })
    )
    expect(mockQueryBuilder.update().eq).toHaveBeenCalledWith('id', fileId)
    expect(mockQueryBuilder.update().eq).toHaveBeenCalledWith('user', 'test-user-id')
  })

  test('canPreviewFile should correctly identify previewable file types', () => {
    // Act & Assert
    expect(canPreviewFile('image/jpeg')).toBe(true)
    expect(canPreviewFile('image/png')).toBe(true)
    expect(canPreviewFile('image/gif')).toBe(true)
    expect(canPreviewFile('text/plain')).toBe(true)
    expect(canPreviewFile('application/pdf')).toBe(true)
    expect(canPreviewFile('video/mp4')).toBe(true)
    expect(canPreviewFile('audio/mpeg')).toBe(true)
    
    // Non-previewable types
    expect(canPreviewFile('application/zip')).toBe(false)
    expect(canPreviewFile('application/x-binary')).toBe(false)
    expect(canPreviewFile('unknown/type')).toBe(false)
  })

  test('fetchFiles should handle unauthenticated user', async () => {
    // Arrange
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null
    })

    // Act
    const result = await fetchFiles()

    // Assert
    expect(result).toEqual([])
    expect(mockSupabase.from).not.toHaveBeenCalled()
  })

  test('uploadFile should handle authentication errors', async () => {
    // Arrange
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null
    })

    const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' })
    const uploadParams = { file: mockFile }

    // Act & Assert
    await expect(uploadFile(uploadParams)).rejects.toThrow('User not authenticated')
  })

  test('getFileById should handle file not found', async () => {
    // Arrange
    const mockQueryBuilder = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
      })
    }
    mockSupabase.from.mockReturnValue(mockQueryBuilder)

    // Act & Assert
    await expect(getFileById('non-existent-file')).rejects.toThrow()
  })

  test('deleteFile should handle file not found', async () => {
    // Arrange
    const mockQueryBuilder = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null })
      })
    }
    mockSupabase.from.mockReturnValue(mockQueryBuilder)

    // Act & Assert
    await expect(deleteFile('non-existent-file'))
      .rejects.toThrow('File not found or you don\'t have permission to delete it')
  })

  test('fetchFiles should apply multiple filters correctly', async () => {
    // Arrange
    const mockFiles = [
      {
        id: 'file-1',
        name: 'Event Document.pdf',
        event: 'event-789',
        task: 'task-456',
        user: 'test-user-id'
      }
    ]

    const mockQueryBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis()
    }
    // Set up chained eq calls
    mockQueryBuilder.eq
      .mockReturnValueOnce(mockQueryBuilder) // user filter
      .mockReturnValueOnce(mockQueryBuilder) // task filter
      .mockResolvedValueOnce({ data: mockFiles, error: null }) // event filter

    mockSupabase.from.mockReturnValue(mockQueryBuilder)

    // Act
    const result = await fetchFiles({ 
      task_id: 'task-456', 
      event_id: 'event-789' 
    })

    // Assert
    expect(result).toHaveLength(1)
    expect(result[0].task).toBe('task-456')
    expect(result[0].event).toBe('event-789')
    expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user', 'test-user-id')
    expect(mockQueryBuilder.eq).toHaveBeenCalledWith('task', 'task-456')
    expect(mockQueryBuilder.eq).toHaveBeenCalledWith('event', 'event-789')
  })
}) 