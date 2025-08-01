import { beforeAll, afterAll, vi, beforeEach, afterEach } from 'vitest'
import { DatabaseCleaner } from './fixtures/integration-helpers'

// Global test setup
beforeAll(async () => {
  console.log('🚀 Starting integration tests...')
  
  // Ensure we're using test environment
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'test'
  }
  
  console.log('✅ Integration test environment initialized')
})

// Global test cleanup
afterAll(async () => {
  // Final cleanup to ensure no test data is left behind
  await DatabaseCleaner.cleanAll()
  
  console.log('🎉 Integration tests completed!')
})

// Create a comprehensive mock for the Supabase client
const createMockSupabaseClient = () => ({
  auth: {
    getUser: vi.fn(),
    getSession: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn()
  },
  from: vi.fn((table: string) => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: vi.fn().mockResolvedValue({ data: [], error: null })
  })),
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn().mockResolvedValue({ data: null, error: null }),
      remove: vi.fn().mockResolvedValue({ data: null, error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'mock-url' } })
    }))
  }
})

// Export the mock client for use in tests
export const mockSupabaseClient = createMockSupabaseClient()

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
  
  // Reset the mock client to default state
  Object.assign(mockSupabaseClient, createMockSupabaseClient())
})

afterEach(async () => {
  vi.clearAllMocks()
  
  // Clean up any test data after each test to prevent pollution
  try {
    await DatabaseCleaner.cleanAll()
  } catch (error) {
    console.warn('Warning: Could not clean test data after test:', error)
  }
}) 