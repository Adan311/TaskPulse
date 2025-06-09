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
} from '../../../backend/api/services/file.service'


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
    const { supabase } = await import('../../../backend/database/client')
    mockSupabase = supabase
    
    // Reset auth mock to default authenticated state
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      error: null
    })
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


    const mockStorage = mockSupabase.storage.from()
    mockStorage.upload.mockResolvedValue({ data: { path: 'test-user-id/i.pdf' }, error: null })

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


}) 