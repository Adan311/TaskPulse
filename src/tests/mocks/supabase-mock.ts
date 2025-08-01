import { vi } from 'vitest'


export const mockSupabaseClient = {
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          user_metadata: {
            first_name: 'Test',
            last_name: 'User',
          },
        },
      },
      error: null,
    }),
    signInWithPassword: vi.fn().mockImplementation(({ email, password }: { email: string; password: string }) => {
      if (email === 'test@example.com' && password === 'password') {
        return Promise.resolve({ data: { user: { id: 'test-user-id', email } }, error: null })
      }
      return Promise.resolve({ data: { user: null }, error: { message: 'Invalid credentials' } })
    }),
    signUp: vi.fn().mockResolvedValue({ 
      data: { user: { id: 'new-user-id', email: 'test@example.com' } }, 
      error: null 
    }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    }),
  },
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      filter: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
      limit: vi.fn().mockReturnThis(),
    }),
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'new-id', created_at: new Date().toISOString() },
          error: null,
        }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'updated-id', updated_at: new Date().toISOString() },
          error: null,
        }),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'deleted-id' },
          error: null,
        }),
      }),
    }),
  }),
  storage: {
    from: vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({
        data: { path: 'test-path' },
        error: null,
      }),
      download: vi.fn().mockResolvedValue({
        data: new Blob(['test file content']),
        error: null,
      }),
      remove: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    }),
  },
}

export default mockSupabaseClient 