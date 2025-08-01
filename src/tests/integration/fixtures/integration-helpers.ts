import { v4 as uuidv4 } from 'uuid'
import { mockSupabaseClient } from '../setup'

// Use the mock client instead of the real one
const supabase = mockSupabaseClient

export interface TestUser {
  id: string
  email: string
  metadata: {
    first_name: string
    last_name: string
  }
}

export interface TestProject {
  id: string
  name: string
  description: string
  user: string
  status: 'active' | 'completed' | 'on-hold'
  color?: string
  priority: 'low' | 'medium' | 'high'
  progress: number
  created_at: string
  updated_at: string
}

export interface TestTask {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  due_date?: string
  user: string
  project?: string
  archived: boolean
  created_at: string
  updated_at: string
}

export interface TestEvent {
  id: string
  title: string
  start_time: string
  end_time: string
  color?: string
  user: string
  project?: string
  description?: string
}

export interface TestNote {
  id: string
  content?: string
  last_updated: string
  user: string
  project?: string
  pinned: boolean
}


export const createTestUser = (): TestUser => ({
  id: uuidv4(),
  email: `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
  metadata: {
    first_name: 'Test',
    last_name: 'User'
  }
})

export const createTestProject = (userId: string): TestProject => ({
  id: uuidv4(),
  name: `Test Project ${Date.now()}`,
  description: 'Test project description',
  user: userId,
  status: 'active',
  color: '#3b82f6',
  priority: 'medium',
  progress: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
})

export const createTestTask = (userId: string, projectId?: string): TestTask => ({
  id: uuidv4(),
  title: `Test Task ${Date.now()}`,
  description: 'Test task description',
  status: 'todo',
  priority: 'medium',
  user: userId,
  project: projectId,
  archived: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
})

export const createTestEvent = (userId: string, projectId?: string): TestEvent => {
  const start = new Date()
  const end = new Date(start.getTime() + 60 * 60 * 1000) // 1 hour later
  
  return {
    id: uuidv4(),
    title: `Test Event ${Date.now()}`,
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    color: '#10b981',
    user: userId,
    project: projectId,
    description: 'Test event description'
  }
}

export const createTestNote = (userId: string, projectId?: string): TestNote => ({
  id: uuidv4(),
  content: `Test note content ${Date.now()}`,
  last_updated: new Date().toISOString(),
  user: userId,
  project: projectId,
  pinned: false
})

// Helper function to create a mock File object for testing
export function createMockFile(
  name: string,
  size: number = 1024,
  type: string = 'application/pdf',
  content: string = 'mock file content'
): File {
  const blob = new Blob([content], { type });
  const file = new File([blob], name, { type });
  
  // Override the size property since File constructor doesn't set it correctly in tests
  Object.defineProperty(file, 'size', {
    value: size,
    writable: false
  });
  
  return file;
}

// Database Cleanup Utilities
export class DatabaseCleaner {
  private static createdUsers: string[] = []
  private static createdProjects: string[] = []
  private static createdTasks: string[] = []
  private static createdEvents: string[] = []
  private static createdNotes: string[] = []
  private static createdFiles: string[] = []

  static trackUser(userId: string) {
    this.createdUsers.push(userId)
  }

  static trackProject(projectId: string) {
    this.createdProjects.push(projectId)
  }

  static trackTask(taskId: string) {
    this.createdTasks.push(taskId)
  }

  static trackEvent(eventId: string) {
    this.createdEvents.push(eventId)
  }

  static trackNote(noteId: string) {
    this.createdNotes.push(noteId)
  }

  static trackFile(fileId: string) {
    this.createdFiles.push(fileId)
  }

  // Clean up all test data created during tests
  static async cleanAll() {
    try {
      console.log('🧹 Cleaning up test data...')
      
      // Import Supabase client directly like the rest of the app
      const { supabase } = await import('../../../backend/database/client')

      // Clean in reverse order of dependencies
      
      // 1. Clean files
      if (this.createdFiles.length > 0) {
        const { error } = await supabase
          .from('files')
          .delete()
          .in('id', this.createdFiles)
        if (error) console.error('Error cleaning files:', error)
        else console.log(`✅ Cleaned ${this.createdFiles.length} files`)
        this.createdFiles = []
      }

      // 2. Clean notes
      if (this.createdNotes.length > 0) {
        const { error } = await supabase
          .from('notes')
          .delete()
          .in('id', this.createdNotes)
        if (error) console.error('Error cleaning notes:', error)
        else console.log(`✅ Cleaned ${this.createdNotes.length} notes`)
        this.createdNotes = []
      }

      // 3. Clean events
      if (this.createdEvents.length > 0) {
        const { error } = await supabase
          .from('events')
          .delete()
          .in('id', this.createdEvents)
        if (error) console.error('Error cleaning events:', error)
        else console.log(`✅ Cleaned ${this.createdEvents.length} events`)
        this.createdEvents = []
      }

      // 4. Clean tasks
      if (this.createdTasks.length > 0) {
        const { error } = await supabase
          .from('tasks')
          .delete()
          .in('id', this.createdTasks)
        if (error) console.error('Error cleaning tasks:', error)
        else console.log(`✅ Cleaned ${this.createdTasks.length} tasks`)
        this.createdTasks = []
      }

      // 5. Clean projects
      if (this.createdProjects.length > 0) {
        const { error } = await supabase
          .from('projects')
          .delete()
          .in('id', this.createdProjects)
        if (error) console.error('Error cleaning projects:', error)
        else console.log(`✅ Cleaned ${this.createdProjects.length} projects`)
        this.createdProjects = []
      }

      if (this.createdUsers.length > 0) {
        console.log(`⚠️ Skipping user cleanup for safety (${this.createdUsers.length} users tracked)`)
        this.createdUsers = []
      }

      console.log('🎉 Test data cleanup completed!')
    } catch (error) {
      console.error('❌ Error during cleanup:', error)
      // Reset arrays even if cleanup fails to prevent accumulation
      this.createdUsers = []
      this.createdProjects = []
      this.createdTasks = []
      this.createdEvents = []
      this.createdNotes = []
      this.createdFiles = []
    }
  }

  // Clean specific entity type
  static async cleanProjects() {
    if (this.createdProjects.length === 0) return
    
    try {
      const { supabase } = await import('../../../backend/database/client')
      
      const { error } = await supabase
        .from('projects')
        .delete()
        .in('id', this.createdProjects)
        
      if (error) console.error('Error cleaning projects:', error)
      else console.log(`✅ Cleaned ${this.createdProjects.length} projects`)
      this.createdProjects = []
    } catch (error) {
      console.error('❌ Error cleaning projects:', error)
    }
  }

  static async cleanTasks() {
    if (this.createdTasks.length === 0) return
    
    try {
      const { supabase } = await import('../../../backend/database/client')
      
      const { error } = await supabase
        .from('tasks')
        .delete()
        .in('id', this.createdTasks)
        
      if (error) console.error('Error cleaning tasks:', error)
      else console.log(`✅ Cleaned ${this.createdTasks.length} tasks`)
      this.createdTasks = []
    } catch (error) {
      console.error('❌ Error cleaning tasks:', error)
    }
  }
}

// Test Environment Utilities
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error | null = null
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      if (i < maxRetries - 1) {
        console.log(`⚠️ Operation failed, retrying in ${delay}ms... (attempt ${i + 1}/${maxRetries})`)
        await waitFor(delay)
      }
    }
  }
  
  throw lastError || new Error('Operation failed after retries')
}

// Test Assertions
export const assertDatabaseRecord = async (
  table: string,
  id: string,
  expectedFields: Record<string, any>
) => {
  const { supabase } = await import('../../../backend/database/client')
  
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .single()
  
  if (error || !data) {
    throw new Error(`No record found in ${table} with id ${id}`)
  }
  
  for (const [field, expectedValue] of Object.entries(expectedFields)) {
    if (data[field] !== expectedValue) {
      throw new Error(
        `Field ${field} mismatch in ${table}. Expected: ${expectedValue}, Got: ${data[field]}`
      )
    }
  }
  
  return data
}

export const assertUserDataIsolation = async (
  table: string,
  userId: string,
  shouldNotContainIds: string[]
) => {
  const { supabase } = await import('../../../backend/database/client')
  
  const userColumn = table === 'projects' ? 'user' : 'user'
  const { data, error } = await supabase
    .from(table)
    .select('id')
    .eq(userColumn, userId)
  
  if (error) {
    throw new Error(`Error querying ${table}: ${error.message}`)
  }
  
  const userRecordIds = (data || []).map((r: any) => r.id)
  
  for (const forbiddenId of shouldNotContainIds) {
    if (userRecordIds.includes(forbiddenId)) {
      throw new Error(
        `User ${userId} has access to ${table} record ${forbiddenId} they shouldn't see`
      )
    }
  }
} 