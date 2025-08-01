// Test helper utilities
export const testHelpers = {
  // Helper to wait for async operations
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Helper to create mock user
  createMockUser: (overrides: Partial<any> = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: {
      first_name: 'Test',
      last_name: 'User',
    },
    ...overrides,
  }),
  
  // Helper to create mock project
  createMockProject: (overrides: Partial<any> = {}) => ({
    id: 'test-project-id',
    title: 'Test Project',
    description: 'Test project description',
    user_id: 'test-user-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),
  
  // Helper to create mock task
  createMockTask: (overrides: Partial<any> = {}) => ({
    id: 'test-task-id',
    title: 'Test Task',
    description: 'Test task description',
    status: 'todo',
    priority: 'medium',
    user_id: 'test-user-id',
    project_id: 'test-project-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),
  
  // Helper to create mock event
  createMockEvent: (overrides: Partial<any> = {}) => ({
    id: 'test-event-id',
    title: 'Test Event',
    description: 'Test event description',
    start_time: new Date().toISOString(),
    end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    user_id: 'test-user-id',
    project_id: 'test-project-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),
  
  // Helper to create mock file
  createMockFile: (overrides: Partial<any> = {}) => ({
    id: 'test-file-id',
    name: 'test-file.txt',
    size: 1024,
    type: 'text/plain',
    user_id: 'test-user-id',
    project_id: 'test-project-id',
    created_at: new Date().toISOString(),
    ...overrides,
  }),
  
  // Helper to create mock note
  createMockNote: (overrides: Partial<any> = {}) => ({
    id: 'test-note-id',
    title: 'Test Note',
    content: 'Test note content',
    user_id: 'test-user-id',
    project_id: 'test-project-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),
  
  // Helper to mock API responses
  mockApiResponse: {
    success: (data: any) => ({ data, error: null }),
    error: (message: string) => ({ data: null, error: { message } }),
  },
  
  // Helper to generate test IDs
  generateTestId: (prefix: string = 'test') => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  
  // Helper to mock localStorage
  mockLocalStorage: () => {
    const store: Record<string, string> = {}
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => { store[key] = value },
      removeItem: (key: string) => { delete store[key] },
      clear: () => { Object.keys(store).forEach(key => delete store[key]) },
    }
  },
  
  // Helper to mock console methods
  mockConsole: () => {
    const originalConsole = { ...console }
    const mockFn = () => {}
    
    return {
      mock: () => {
        console.log = mockFn
        console.warn = mockFn
        console.error = mockFn
      },
      restore: () => {
        Object.assign(console, originalConsole)
      },
    }
  },
}

export default testHelpers 