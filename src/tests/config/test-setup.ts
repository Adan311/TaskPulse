import '@testing-library/jest-dom'
import { vi } from 'vitest'


Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), 
    removeListener: vi.fn(), 
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})


global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))


global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))


Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true,
})

// Global test utilities
export const testUtils = {
  // Helper to wait for async operations
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Helper to create mock user
  createMockUser: () => ({
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: {
      first_name: 'Test',
      last_name: 'User',
    },
  }),
  
  // Helper to create mock project
  createMockProject: () => ({
    id: 'test-project-id',
    title: 'Test Project',
    description: 'Test project description',
    user_id: 'test-user-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }),
  
  // Helper to create mock task
  createMockTask: () => ({
    id: 'test-task-id',
    title: 'Test Task',
    description: 'Test task description',
    status: 'todo',
    priority: 'medium',
    user_id: 'test-user-id',
    project_id: 'test-project-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }),
} 