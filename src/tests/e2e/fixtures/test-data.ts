
export const testProjects = [
  {
    name: 'E2E Test Project',
    description: 'Project created during E2E testing',
    color: 'blue',
    tasks: [
      {
        title: 'Setup project structure',
        description: 'Create initial project files and folders',
        priority: 'high',
        status: 'todo'
      },
      {
        title: 'Implement core features',
        description: 'Build the main functionality',
        priority: 'medium',
        status: 'in_progress'
      },
      {
        title: 'Write documentation',
        description: 'Create user guides and API docs',
        priority: 'low',
        status: 'todo'
      }
    ]
  },
  {
    name: 'AI Integration Project',
    description: 'Testing AI features and integrations',
    color: 'green',
    tasks: [
      {
        title: 'Test AI chat functionality',
        description: 'Verify AI responses and suggestions',
        priority: 'high',
        status: 'todo'
      }
    ]
  }
]

export const testEvents = [
  {
    title: 'Project Kickoff Meeting',
    description: 'Initial meeting to discuss project goals',
    startTime: '2025-01-25T10:00:00',
    endTime: '2025-01-25T11:00:00',
    color: '#FF5722'
  },
  {
    title: 'Daily Standup',
    description: 'Daily team sync meeting',
    startTime: '2025-01-26T09:00:00',
    endTime: '2025-01-26T09:30:00',
    color: '#2196F3',
    recurring: true
  },
  {
    title: 'Sprint Review',
    description: 'Review completed work and plan next sprint',
    startTime: '2025-01-30T14:00:00',
    endTime: '2025-01-30T16:00:00',
    color: '#4CAF50'
  }
]

export const testNotes = [
  {
    content: '# Project Ideas\n\n- Implement dark mode\n- Add mobile responsiveness\n- Integrate with third-party APIs',
    pinned: true
  },
  {
    content: '# Meeting Notes\n\n## Attendees\n- John Doe\n- Jane Smith\n\n## Action Items\n- [ ] Review requirements\n- [ ] Create mockups',
    pinned: false
  }
]

export const aiTestMessages = [
  {
    message: 'Create a task to implement user authentication',
    expectedSuggestions: ['task']
  },
  {
    message: 'Schedule a meeting with the team for tomorrow at 2 PM',
    expectedSuggestions: ['event']
  },
  {
    message: 'Break down the mobile app development project into smaller tasks',
    expectedSuggestions: ['task', 'project']
  },
  {
    message: 'I need to organize my work for next week',
    expectedSuggestions: ['task', 'event']
  }
]

export const performanceTestData = {
  largeTasks: Array.from({ length: 100 }, (_, i) => ({
    title: `Performance Test Task ${i + 1}`,
    description: `This is a test task created for performance testing purposes. Task number ${i + 1}.`,
    priority: ['low', 'medium', 'high'][i % 3],
    status: ['todo', 'in_progress', 'completed'][i % 3]
  })),
  
  largeEvents: Array.from({ length: 50 }, (_, i) => ({
    title: `Performance Test Event ${i + 1}`,
    description: `This is a test event created for performance testing purposes. Event number ${i + 1}.`,
    startTime: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + i * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString()
  }))
}

export const testFiles = [
  {
    name: 'test-document.pdf',
    type: 'application/pdf',
    size: 1024 * 1024, // 1MB
    content: 'Mock PDF content for testing'
  },
  {
    name: 'test-image.jpg',
    type: 'image/jpeg',
    size: 512 * 1024, // 512KB
    content: 'Mock image content for testing'
  },
  {
    name: 'test-spreadsheet.xlsx',
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 256 * 1024, // 256KB
    content: 'Mock spreadsheet content for testing'
  }
]

// User scenarios for comprehensive testing
export const userScenarios = {
  newUser: {
    email: 'newuser@test.com',
    password: 'NewUser123!',
    name: 'New Test User',
    workflow: [
      'register',
      'complete_onboarding',
      'create_first_project',
      'add_tasks',
      'schedule_events',
      'use_ai_chat',
      'upload_files',
      'start_timer'
    ]
  },
  
  powerUser: {
    email: 'poweruser@test.com',
    password: 'PowerUser123!',
    name: 'Power Test User',
    workflow: [
      'login',
      'manage_multiple_projects',
      'bulk_task_operations',
      'advanced_calendar_features',
      'ai_project_breakdown',
      'file_organization',
      'time_tracking_analysis',
      'export_reports'
    ]
  },
  
  mobileUser: {
    email: 'mobileuser@test.com',
    password: 'MobileUser123!',
    name: 'Mobile Test User',
    device: 'mobile',
    workflow: [
      'mobile_login',
      'touch_navigation',
      'mobile_task_creation',
      'mobile_calendar_view',
      'mobile_ai_chat',
      'mobile_file_upload'
    ]
  }
} 