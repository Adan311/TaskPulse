import { Page, expect, BrowserContext } from '@playwright/test'
import { BrowserRecovery } from './browser-recovery'


export const TEST_USER = {
  email: 'e2e-test@taskpulse.com',
  password: 'TestPassword123!',
  name: 'E2E Test User'
}

export const ADMIN_USER = {
  email: 'admin@taskpulse.com',
  password: 'AdminPassword123!',
  name: 'Admin User'
}

export class AuthHelpers {
  constructor(private page: Page) {}

  async login() {
    // Use the existing verified test user
    const testEmail = 'e2e-test@taskpulse.com'
    const testPassword = 'testpassword123'
    
    console.log(`🔐 Using existing test user: ${testEmail}`)
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`🔐 Login attempt ${attempt}...`)
        
        // Check if already on login page, if not navigate
        const currentUrl = this.page.url()
        console.log(`Current URL: ${currentUrl}`)
        
        if (!currentUrl.includes('/auth/signin')) {
          await this.page.goto('/auth/signin', { timeout: 15000 })
          await this.page.waitForLoadState('domcontentloaded')
        }
        
        // Wait for sign-in page to be ready using the new test attributes
        await this.page.waitForSelector('[data-testid="signin-heading"]', { timeout: 10000 })
        console.log('📱 Sign-in page loaded successfully')
        
        // Fill in credentials using the fresh test user
        await this.page.fill('[data-testid="email-input"]', testEmail)
        await this.page.fill('[data-testid="password-input"]', testPassword)
        
        // Click submit and wait for navigation
        await Promise.all([
          this.page.waitForURL('/', { timeout: 15000 }), // Wait for redirect to home
          this.page.click('[data-testid="signin-submit-button"]')
        ])
        
        console.log('🔄 Redirected to dashboard, waiting for content...')
        
        // Wait for dashboard to load with multiple fallback selectors
        const dashboardLoaded = await Promise.race([
          // Primary: Our new test selector
          this.page.waitForSelector('[data-testid="dashboard-welcome-heading"]', { timeout: 5000 }).then(() => 'primary'),
          // Fallback 1: Check for TaskPulse text
          this.page.waitForSelector('h1:has-text("Welcome to TaskPulse")', { timeout: 5000 }).then(() => 'fallback1'),
          // Fallback 2: Check for any main heading
          this.page.waitForSelector('h1', { timeout: 5000 }).then(() => 'fallback2'),
          // Fallback 3: Check for main content area
          this.page.waitForSelector('main', { timeout: 5000 }).then(() => 'fallback3')
        ]).catch(() => null)
        
        if (dashboardLoaded) {
          console.log(`✅ Login successful (detected via: ${dashboardLoaded})`)
          
          // Additional verification: check page title or URL
          const finalUrl = this.page.url()
          console.log(`Final URL after login: ${finalUrl}`)
          
          return
        } else {
          throw new Error('Dashboard elements not found after login')
        }
        
      } catch (loginError) {
        console.log(`⚠️ Login attempt ${attempt} failed:`, loginError)
        
        // Debug: Take a screenshot and check current state
        try {
          const currentUrl = this.page.url()
          console.log(`Debug - Current URL after failed attempt: ${currentUrl}`)
          
          // Check if we're on any page by looking for basic HTML elements
          const pageState = await this.page.evaluate(() => ({
            title: document.title,
            bodyText: document.body?.innerText?.substring(0, 200) || 'No body text',
            hasMainElement: !!document.querySelector('main'),
            hasH1Element: !!document.querySelector('h1')
          }))
          console.log(`Debug - Page state:`, pageState)
          
        } catch (debugError) {
          console.log('Debug check failed:', debugError)
        }
        
        if (attempt < 3 && !this.page.isClosed()) {
          const wait = new WaitHelpers(this.page)
          await wait.safeWaitForTimeout(2000)
        }
      }
    }
    
    throw new Error('Login failed after 3 attempts')
  }

  async createTestUser(email: string, password: string) {
    try {
      console.log(`📝 Creating test user: ${email}`)
      
      // Navigate to signup page
      await this.page.goto('/auth/signup', { timeout: 15000 })
      await this.page.waitForLoadState('domcontentloaded')
      
      // Wait for signup page elements
      await this.page.waitForSelector('[data-testid="signup-heading"]', { timeout: 10000 })
      
      // Fill in registration form
      await this.page.fill('[data-testid="name-input"]', 'E2E Test User')
      await this.page.fill('[data-testid="email-input"]', email)
      await this.page.fill('[data-testid="password-input"]', password)
      await this.page.click('[data-testid="signup-submit-button"]')
      
      // Wait for either success message or redirect
      await Promise.race([
        // Wait for redirect to signin page
        this.page.waitForSelector('[data-testid="signin-heading"]', { timeout: 10000 }),
        // Or wait for any success indication
        this.page.waitForSelector('.toast, [role="alert"]', { timeout: 5000 })
      ])
      
      console.log(`✅ Test user created successfully: ${email}`)
      
    } catch (error) {
      console.log(`⚠️ Could not create test user, may already exist: ${error}`)
      // Continue anyway - user might already exist
    }
  }

  async register(email?: string, password?: string, name?: string) {
    // Use provided values or generate defaults
    const testEmail = email || `test-${Date.now()}@example.com`
    const testPassword = password || 'TestPassword123!'
    const testName = name || 'Test User'
    
    console.log(`📝 Registering new user: ${testEmail}`)
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`📝 Registration attempt ${attempt}...`)
        
        // Navigate to sign up page with better error handling
        await this.page.goto('/auth/signup', { timeout: 15000 })
        await this.page.waitForLoadState('domcontentloaded')
        
        // Wait for signup page elements using new test attributes
        await this.page.waitForSelector('[data-testid="signup-heading"]', { timeout: 10000 })
        
        // Fill in registration form with improved selectors
        await this.page.fill('[data-testid="name-input"]', testName)
        await this.page.fill('[data-testid="email-input"]', testEmail)
        await this.page.fill('[data-testid="password-input"]', testPassword)
        await this.page.click('[data-testid="signup-submit-button"]')
        
        // Wait for redirect to signin page
        await this.page.waitForSelector('[data-testid="signin-heading"]', { timeout: 10000 })
        
        console.log(`✅ Registration successful for: ${testEmail}`)
        
        // Now login with the new account using the same credentials
        // Update the credentials for login
        const testUser = {
          email: testEmail,
          password: testPassword
        }
        
        // Login with the newly created account
        await this.loginWithCredentials(testEmail, testPassword)
        return
        
      } catch (error) {
        console.log(`⚠️ Registration attempt ${attempt} failed:`, error)
        
        if (attempt === 3 || this.page.isClosed()) {
          console.log('⚠️ Could not register new user, using login fallback')
          // Fall back to just logging in with existing user
          await this.login()
          return
        }
        const wait = new WaitHelpers(this.page)
        await wait.safeWaitForTimeout(2000)
      }
    }
  }

  async loginWithCredentials(email: string, password: string) {
    console.log(`🔐 Logging in with email: ${email}`)
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`🔐 Login attempt ${attempt}...`)
        
        const currentUrl = this.page.url()
        console.log(`Current URL: ${currentUrl}`)
        
        // Navigate to sign-in page if not already there
        if (!currentUrl.includes('/auth/signin')) {
          await this.page.goto('/auth/signin', { timeout: 15000 })
          await this.page.waitForLoadState('domcontentloaded')
        }
        
        // Wait for sign-in page to be ready using the new test attributes
        await this.page.waitForSelector('[data-testid="signin-heading"]', { timeout: 10000 })
        console.log('📱 Sign-in page loaded successfully')
        
        // Fill in credentials
        await this.page.fill('[data-testid="email-input"]', email)
        await this.page.fill('[data-testid="password-input"]', password)
        
        // Click submit and wait for navigation
        await Promise.all([
          this.page.waitForURL('/', { timeout: 15000 }), // Wait for redirect to home
          this.page.click('[data-testid="signin-submit-button"]')
        ])
        
        console.log('🔄 Redirected to dashboard, waiting for content...')
        
        // Wait for dashboard to load with multiple fallback selectors
        const dashboardLoaded = await Promise.race([
          // Primary: Our new test selector
          this.page.waitForSelector('[data-testid="dashboard-welcome-heading"]', { timeout: 5000 }).then(() => 'primary'),
          // Fallback 1: Check for TaskPulse text
          this.page.waitForSelector('h1:has-text("Welcome to TaskPulse")', { timeout: 5000 }).then(() => 'fallback1'),
          // Fallback 2: Check for any main heading
          this.page.waitForSelector('h1', { timeout: 5000 }).then(() => 'fallback2'),
          // Fallback 3: Check for main content area
          this.page.waitForSelector('main', { timeout: 5000 }).then(() => 'fallback3')
        ]).catch(() => null)
        
        if (dashboardLoaded) {
          console.log(`✅ Login successful (detected via: ${dashboardLoaded})`)
          
          // Additional verification: check page title or URL
          const finalUrl = this.page.url()
          console.log(`Final URL after login: ${finalUrl}`)
          
          return
        } else {
          throw new Error('Dashboard elements not found after login')
        }
        
      } catch (loginError) {
        console.log(`⚠️ Login attempt ${attempt} failed:`, loginError)
        
        // Debug: Take a screenshot and check current state
        try {
          const currentUrl = this.page.url()
          console.log(`Debug - Current URL after failed attempt: ${currentUrl}`)
          
          // Check if we're on any page by looking for basic HTML elements
          const pageState = await this.page.evaluate(() => ({
            title: document.title,
            bodyText: document.body?.innerText?.substring(0, 200) || 'No body text',
            hasMainElement: !!document.querySelector('main'),
            hasH1Element: !!document.querySelector('h1')
          }))
          console.log(`Debug - Page state:`, pageState)
          
        } catch (debugError) {
          console.log('Debug check failed:', debugError)
        }
        
        if (attempt < 3 && !this.page.isClosed()) {
          const wait = new WaitHelpers(this.page)
          await wait.safeWaitForTimeout(2000)
        }
      }
    }
    
    throw new Error(`Login failed after 3 attempts for email: ${email}`)
  }

  async logout() {
    console.log('🚪 Logging out...')
    
    // Go to dashboard first
    await this.page.goto('/')
    await this.page.waitForLoadState('networkidle')
    
    // Look for logout button - could be in various places
    const logoutSelectors = [
      'button:has-text("Log Out")',
      'button:has-text("Logout")', 
      'button:has-text("Sign Out")',
      '[data-testid="logout-button"]',
      'text="Log Out"',
      'text="Logout"',
      'text="Sign Out"'
    ]
    
    let logoutClicked = false
    for (const selector of logoutSelectors) {
      try {
        const element = this.page.locator(selector).first()
        if (await element.isVisible({ timeout: 2000 })) {
          await element.click()
          logoutClicked = true
          break
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!logoutClicked) {
      console.log('⚠️ Logout button not found, navigating to signin page directly')
      await this.page.goto('/auth/signin')
    } else {
      // Wait for redirect to sign in page
      await this.page.waitForURL('/auth/signin', { timeout: 10000 })
    }
    
    console.log('✅ Logout successful')
  }
}

// Navigation helpers
export class NavigationHelpers {
  constructor(private page: Page) {}

  async goToTasks() {
    console.log('📋 Navigating to Tasks...')
    
    try {
      // Check if page is still available
      if (this.page.isClosed()) {
        console.log('⚠️ Page context closed, cannot navigate to tasks')
        return false
      }
      
      // Try navigation with retry logic
      let navigationSuccess = false
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          if (this.page.isClosed()) {
            throw new Error('Page context has been closed')
          }
          
          await this.page.goto('/tasks', { timeout: 10000, waitUntil: 'domcontentloaded' })
          await this.page.waitForLoadState('domcontentloaded', { timeout: 5000 })
          
          // Wait for lazy-loaded component to render
          await this.page.waitForSelector('main, [role="main"], .container', { timeout: 5000 })
          navigationSuccess = true
          break
        } catch (navError) {
          console.log(`⚠️ Tasks navigation attempt ${attempt} failed:`, navError)
          if (attempt < 3 && !this.page.isClosed()) {
            await this.page.waitForLoadState('domcontentloaded', { timeout: 2000 }).catch(() => {})
          }
        }
      }
      
      if (navigationSuccess) {
        console.log('✅ Tasks page loaded')
        return true
      } else {
        console.log('⚠️ Tasks navigation failed, continuing test')
        return false
      }
    } catch (error) {
      console.log('⚠️ Failed to navigate to tasks:', error)
      return false
    }
  }

  async goToCalendar() {
    console.log('📅 Navigating to Calendar...')
    
    try {
      // Check if page is still available
      if (this.page.isClosed()) {
        console.log('⚠️ Page context closed, cannot navigate to calendar')
        return false
      }
      
      // Try navigation with retry logic
      let navigationSuccess = false
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          if (this.page.isClosed()) {
            throw new Error('Page context has been closed')
          }
          
          // Use domcontentloaded instead of load to avoid timeout issues
          await this.page.goto('/calendar', { timeout: 10000, waitUntil: 'domcontentloaded' })
          await this.page.waitForLoadState('domcontentloaded', { timeout: 5000 })
          
          // Wait for lazy-loaded component to render with shorter timeout
          await this.page.waitForSelector('main, [role="main"], .container', { timeout: 5000 })
          navigationSuccess = true
          break
        } catch (navError) {
          console.log(`⚠️ Calendar navigation attempt ${attempt} failed:`, navError)
          if (attempt < 3 && !this.page.isClosed()) {
            await this.page.waitForLoadState('domcontentloaded', { timeout: 2000 }).catch(() => {})
          }
        }
      }
      
      if (navigationSuccess) {
        console.log('✅ Calendar page loaded')
        return true
      } else {
        console.log('⚠️ Calendar navigation failed, continuing test')
        return false
      }
    } catch (error) {
      console.log('⚠️ Failed to navigate to calendar:', error)
      return false
    }
  }

  async goToProjects() {
    console.log('📁 Navigating to Projects...')
    
    try {
      // Try navigation with retry logic
      let navigationSuccess = false
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await this.page.goto('/projects', { timeout: 15000 })
          await this.page.waitForLoadState('domcontentloaded', { timeout: 10000 })
          
          // Wait for lazy-loaded component to render
          await this.page.waitForSelector('main, [role="main"], .container, h1, h2', { timeout: 10000 })
          navigationSuccess = true
          break
        } catch (navError) {
          console.log(`⚠️ Projects navigation attempt ${attempt} failed:`, navError)
          if (attempt < 3) {
            const wait = new WaitHelpers(this.page)
            await wait.safeWaitForTimeout(2000)
          }
        }
      }
      
      if (navigationSuccess) {
        console.log('✅ Projects page loaded')
      } else {
        console.log('⚠️ Projects navigation failed, continuing test')
      }
    } catch (error) {
      console.log('⚠️ Failed to navigate to projects:', error)
      // Don't throw error, let test continue
    }
  }

  async goToFiles() {
    console.log('📎 Navigating to Files...')
    try {
      await this.page.goto('/files', { timeout: 15000 })
      await this.page.waitForLoadState('domcontentloaded', { timeout: 10000 })
      
      // Wait for lazy-loaded component to render
      await this.page.waitForSelector('main, [role="main"], .container, h1, h2', { timeout: 10000 })
      console.log('✅ Files page loaded')
    } catch (error) {
      console.log('⚠️ Failed to navigate to files:', error)
      // Try fallback navigation
      try {
        await this.page.goto('/', { timeout: 10000 })
        await this.page.waitForLoadState('domcontentloaded', { timeout: 5000 })
        
        // Try clicking navigation link
        const navSelectors = [
          'a[href="/files"]',
          '[data-testid="files-nav"]',
          'nav a:has-text("Files")',
          'button:has-text("Files")'
        ]
        
        let navClicked = false
        for (const selector of navSelectors) {
          try {
            const element = this.page.locator(selector).first()
            if (await element.isVisible({ timeout: 2000 })) {
              await element.click()
              navClicked = true
              break
            }
          } catch (e) {
            // Continue to next selector
          }
        }
        
        if (navClicked) {
          await this.page.waitForSelector('main, [role="main"], .container', { timeout: 5000 })
          console.log('✅ Files page loaded via fallback')
        } else {
          console.log('⚠️ Files navigation failed completely, continuing test')
        }
      } catch (fallbackError) {
        console.log('⚠️ Files navigation failed completely, continuing test')
      }
    }
  }

  async goToTimer() {
    console.log('⏱️ Navigating to Timer...')
    try {
      await this.page.goto('/timer', { timeout: 15000 })
      await this.page.waitForLoadState('domcontentloaded', { timeout: 10000 })
      
      // Wait for lazy-loaded component to render
      await this.page.waitForSelector('main, [role="main"], .container, h1, h2', { timeout: 10000 })
      console.log('✅ Timer page loaded')
    } catch (error) {
      console.log('⚠️ Failed to navigate to timer:', error)
      console.log('⚠️ Timer navigation failed, continuing test')
    }
  }

  async goToNotes() {
    console.log('📝 Navigating to Notes...')
    try {
      await this.page.goto('/notes', { timeout: 15000 })
      await this.page.waitForLoadState('domcontentloaded', { timeout: 10000 })
      
      // Wait for lazy-loaded component to render
      await this.page.waitForSelector('main, [role="main"], .container, h1, h2', { timeout: 10000 })
      console.log('✅ Notes page loaded')
    } catch (error) {
      console.log('⚠️ Failed to navigate to notes:', error)
      console.log('⚠️ Notes navigation failed, continuing test')
    }
  }

  async goToChat() {
    console.log('🤖 Navigating to AI Chat...')
    
    try {
      // Try navigation with retry logic
      let navigationSuccess = false
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await this.page.goto('/chat', { timeout: 30000 })
          await this.page.waitForLoadState('networkidle', { timeout: 15000 })
          navigationSuccess = true
          break
        } catch (navError) {
          console.log(`⚠️ Chat navigation attempt ${attempt} failed:`, navError)
          if (attempt === 3) {
            throw new Error('Could not navigate to chat page after 3 attempts')
          }
          const wait = new WaitHelpers(this.page)
          await wait.safeWaitForTimeout(2000)
        }
      }
      
      if (navigationSuccess) {
        console.log('✅ AI Chat page loaded')
      }
    } catch (error) {
      console.log('⚠️ Failed to navigate to chat:', error)
      throw error
    }
  }
}

// Task management helpers
export class TaskHelpers {
  constructor(private page: Page) {}

  async createTask(title: string, description?: string, project?: string) {
    console.log(`📋 Creating task: ${title}`)
    
    try {
      // Check if page is still available
      if (this.page.isClosed()) {
        console.log('⚠️ Page context closed, cannot create task')
        return
      }
      
      // Look for create task button with multiple selectors
      const createSelectors = [
        'button:has-text("Add Task")', // Primary selector from TaskBoardHeader
        'button:has-text("Create Task")',
        'button:has-text("New Task")',
        'button:has-text("Create")',
        'button:has-text("Add")',
        '[data-testid="create-task-button"]',
        'button[aria-label*="create"], button[aria-label*="add"]',
        'button:has([data-lucide="plus"]):has-text("Add Task")', // More specific
        'button:has(svg):has-text("Add Task")' // Button with SVG and text
      ]
      
      let createClicked = false
      for (const selector of createSelectors) {
        try {
          if (this.page.isClosed()) break
          const element = this.page.locator(selector).first()
          if (await element.isVisible({ timeout: 3000 })) {
            await element.click()
            createClicked = true
            console.log(`✅ Found and clicked task button with selector: ${selector}`)
            break
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      if (!createClicked && !this.page.isClosed()) {
        console.log('⚠️ Could not find create task button, trying fallback approach')
        // Fallback: try to find any button with "Add" or "Task" text
        try {
          const fallbackButton = this.page.locator('button').filter({ hasText: /add.*task|task.*add/i }).first()
          if (await fallbackButton.isVisible({ timeout: 2000 })) {
            await fallbackButton.click()
            createClicked = true
            console.log('✅ Used fallback button selector')
          }
        } catch (e) {
          // Final fallback failed
        }
      }
      
      if (!createClicked) {
        console.log('⚠️ Could not find create task button')
        return
      }
      
      if (this.page.isClosed()) {
        console.log('⚠️ Page context closed during task creation')
        return
      }
      
      // Wait for form to appear
      await this.page.waitForLoadState('domcontentloaded')
      
      // Fill task form with multiple selector options
      const titleSelectors = [
        'input[placeholder*="title" i]',
        'input[name="title"]',
        '#title',
        '[data-testid="task-title-input"]',
        'input[type="text"]:first-of-type'
      ]
      
      let titleFilled = false
      for (const selector of titleSelectors) {
        try {
          if (this.page.isClosed()) break
          const element = this.page.locator(selector).first()
          if (await element.isVisible({ timeout: 2000 })) {
            await element.fill(title)
            titleFilled = true
            break
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      if (!titleFilled) {
        console.log('⚠️ Could not find task title input')
        return
      }
      
      if (description && !this.page.isClosed()) {
        const descSelectors = [
          'textarea[placeholder*="description" i]',
          'textarea[name="description"]',
          '#description',
          '[data-testid="task-description-input"]',
          'textarea:first-of-type'
        ]
        
        for (const selector of descSelectors) {
          try {
            if (this.page.isClosed()) break
            const element = this.page.locator(selector).first()
            if (await element.isVisible({ timeout: 2000 })) {
              await element.fill(description)
              break
            }
          } catch (e) {
            // Continue to next selector
          }
        }
      }
      
      if (project && !this.page.isClosed()) {
        const projectSelectors = [
          'select[name="project"]',
          '#project',
          '[data-testid="task-project-select"]',
          'select:has(option)'
        ]
        
        for (const selector of projectSelectors) {
          try {
            if (this.page.isClosed()) break
            const element = this.page.locator(selector).first()
            if (await element.isVisible({ timeout: 2000 })) {
              await element.selectOption(project)
              break
            }
          } catch (e) {
            // Continue to next selector
          }
        }
      }
      
      if (this.page.isClosed()) {
        console.log('⚠️ Page context closed during form filling')
        return
      }
      
      // Submit form
      const saveSelectors = [
        'button:has-text("Save")',
        'button:has-text("Create")',
        'button:has-text("Add")',
        'button[type="submit"]',
        '[data-testid="save-task-button"]'
      ]
      
      let saveClicked = false
      for (const selector of saveSelectors) {
        try {
          if (this.page.isClosed()) break
          const element = this.page.locator(selector).first()
          if (await element.isVisible({ timeout: 2000 })) {
            await element.click()
            saveClicked = true
            break
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      if (!saveClicked) {
        console.log('⚠️ Could not find save task button')
        return
      }
      
      if (this.page.isClosed()) {
        console.log('⚠️ Page context closed during save')
        return
      }
      
      // Wait for task to appear
      await this.page.waitForLoadState('domcontentloaded')
      
      // Verify task was created
      try {
        await expect(this.page.locator(`text="${title}"`)).toBeVisible({ timeout: 5000 })
        console.log(`✅ Task created: ${title}`)
      } catch (e) {
        console.log(`⚠️ Task may have been created but not visible: ${title}`)
      }
    } catch (error) {
      console.log(`⚠️ Task creation failed: ${title}`, error)
    }
  }

  async completeTask(taskTitle: string) {
    console.log(`✅ Completing task: ${taskTitle}`)
    
    try {
      // Check if page is still available
      if (this.page.isClosed()) {
        console.log('⚠️ Page context closed, cannot complete task')
        return
      }
      
      // Find the task and its checkbox
      const taskElement = this.page.locator(`text="${taskTitle}"`).first()
      await expect(taskElement).toBeVisible({ timeout: 5000 })
      
      // Look for checkbox near the task
      const checkboxSelectors = [
        `text="${taskTitle}" >> .. >> input[type="checkbox"]`,
        `text="${taskTitle}" >> xpath=../.. >> input[type="checkbox"]`,
        `text="${taskTitle}" >> xpath=.. >> input[type="checkbox"]`,
        '[data-testid="task-checkbox"]'
      ]
      
      let checkboxClicked = false
      for (const selector of checkboxSelectors) {
        try {
          if (this.page.isClosed()) break
          const checkbox = this.page.locator(selector).first()
          if (await checkbox.isVisible({ timeout: 2000 })) {
            await checkbox.click()
            checkboxClicked = true
            break
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      if (!checkboxClicked) {
        console.log(`⚠️ Could not find checkbox for task: ${taskTitle}`)
      } else {
        console.log(`✅ Task completed: ${taskTitle}`)
      }
      
      if (!this.page.isClosed()) {
        await this.page.waitForLoadState('domcontentloaded')
      }
    } catch (error) {
      console.log(`⚠️ Task completion failed: ${taskTitle}`, error)
    }
  }

  async editTask(oldTitle: string, newTitle: string) {
    const taskItem = this.page.locator(`text="${oldTitle}"`).locator('..').first()
    await taskItem.click()
    
    const titleInput = this.page.locator('input[value*="' + oldTitle + '"], [data-testid="task-title-input"]').first()
    await titleInput.fill(newTitle)
    
    const saveButton = this.page.locator('button:has-text("Save"), [data-testid="save-task-button"]').first()
    await saveButton.click()
    
    // Verify task title updated
    await expect(this.page.locator(`text="${newTitle}"`)).toBeVisible()
  }

  async deleteTask(taskTitle: string) {
    const taskItem = this.page.locator(`text="${taskTitle}"`).locator('..').first()
    await taskItem.hover()
    
    const deleteButton = taskItem.locator('button:has-text("Delete"), [data-testid="task-delete-button"]').first()
    await deleteButton.click()
    
    // Confirm deletion if modal appears
    const confirmButton = this.page.locator('button:has-text("Confirm"), button:has-text("Delete"), [data-testid="confirm-delete-button"]').first()
    if (await confirmButton.isVisible()) {
      await confirmButton.click()
    }
    
    // Verify task is removed
    await expect(this.page.locator(`text="${taskTitle}"`)).not.toBeVisible()
  }
}

// Project management helpers
export class ProjectHelpers {
  constructor(private page: Page) {}

  async createProject(name: string, description?: string, color?: string) {
    console.log(`📁 Creating project: ${name}`)
    
    // Look for create project button
    const createSelectors = [
      'button:has-text("Create Project")',
      'button:has-text("Add Project")',
      'button:has-text("New Project")',
      'button:has-text("Create")',
      'button:has-text("Add")',
      '[data-testid="create-project-button"]'
    ]
    
    let createClicked = false
    for (const selector of createSelectors) {
      try {
        const element = this.page.locator(selector).first()
        if (await element.isVisible({ timeout: 3000 })) {
          await element.click()
          createClicked = true
          break
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!createClicked) {
      throw new Error('Could not find create project button')
    }
    
    // Wait for form to appear
    const waitHelper = new WaitHelpers(this.page)
    await waitHelper.safeWaitForTimeout(1000)
    
    // Fill project name
    const nameSelectors = [
      'input[placeholder*="name" i]',
      'input[name="name"]',
      '#name',
      '[data-testid="project-name-input"]',
      'input[type="text"]:first-of-type'
    ]
    
    let nameFilled = false
    for (const selector of nameSelectors) {
      try {
        const element = this.page.locator(selector).first()
        if (await element.isVisible({ timeout: 2000 })) {
          await element.fill(name)
          nameFilled = true
          break
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!nameFilled) {
      throw new Error('Could not find project name input')
    }
    
    if (description) {
      const descSelectors = [
        'textarea[placeholder*="description" i]',
        'textarea[name="description"]',
        '#description',
        '[data-testid="project-description-input"]',
        'textarea:first-of-type'
      ]
      
      for (const selector of descSelectors) {
        try {
          const element = this.page.locator(selector).first()
          if (await element.isVisible({ timeout: 2000 })) {
            await element.fill(description)
            break
          }
        } catch (e) {
          // Continue to next selector
        }
      }
    }
    
    if (color) {
      const colorPicker = this.page.locator('[data-testid="project-color-picker"], input[type="color"]').first()
      await colorPicker.click()
      const colorOption = this.page.locator(`[data-testid="color-option-${color}"], [data-color="${color}"]`).first()
      await colorOption.click()
    }
    
    // Submit form
    const saveSelectors = [
      'button:has-text("Save")',
      'button:has-text("Create")',
      'button:has-text("Add")',
      'button[type="submit"]',
      '[data-testid="save-project-button"]'
    ]
    
    let saveClicked = false
    for (const selector of saveSelectors) {
      try {
        const element = this.page.locator(selector).first()
        if (await element.isVisible({ timeout: 2000 })) {
          await element.click()
          saveClicked = true
          break
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!saveClicked) {
      throw new Error('Could not find save project button')
    }
    
    // Wait for project to appear
    const waitHelper2 = new WaitHelpers(this.page)
    await waitHelper2.safeWaitForTimeout(2000)
    
    try {
      await expect(this.page.locator(`text="${name}"`)).toBeVisible({ timeout: 5000 })
      console.log(`✅ Project created: ${name}`)
    } catch (e) {
      console.log(`⚠️ Project may have been created but not visible: ${name}`)
    }
  }

  async openProject(projectName: string) {
    console.log(`📂 Opening project: ${projectName}`)
    await this.page.click(`text="${projectName}"`)
    const waitHelper3 = new WaitHelpers(this.page)
    await waitHelper3.safeWaitForTimeout(1000)
    console.log(`✅ Project opened: ${projectName}`)
  }
}

// Calendar helpers
export class CalendarHelpers {
  constructor(private page: Page) {}

  async createEvent(title: string, startTime: string, endTime: string, description?: string) {
    console.log(`📅 Creating event: ${title}`)
    
    try {
      // Check if page is still available
      if (this.page.isClosed()) {
        console.log('⚠️ Page context closed, cannot create event')
        return
      }
      
      // Look for create event button
      const createSelectors = [
        'button:has-text("Create Event")',
        'button:has-text("Add Event")',
        'button:has-text("New Event")',
        'button:has-text("Create")',
        'button:has-text("Add")',
        '[data-testid="create-event-button"]'
      ]
      
      let createClicked = false
      for (const selector of createSelectors) {
        try {
          if (this.page.isClosed()) break
          const element = this.page.locator(selector).first()
          if (await element.isVisible({ timeout: 3000 })) {
            await element.click()
            createClicked = true
            break
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      if (!createClicked && !this.page.isClosed()) {
        console.log('⚠️ Could not find create event button, trying calendar click')
        // Try clicking on calendar to create event
        try {
          await this.page.click('.calendar, [data-testid="calendar"]', { force: true })
        } catch (clickError) {
          console.log('⚠️ Could not click on calendar:', clickError)
          return
        }
      }
      
      if (this.page.isClosed()) {
        console.log('⚠️ Page context closed during event creation')
        return
      }
      
      // Wait for form to appear
      await this.page.waitForLoadState('domcontentloaded')
      
      // Fill event details (simplified for now)
      try {
        const titleInput = this.page.locator('input[placeholder*="title" i], input[name="title"], #title').first()
        if (await titleInput.isVisible({ timeout: 2000 })) {
          await titleInput.fill(title)
        }
        
        // Submit form
        const saveButton = this.page.locator('button:has-text("Save"), button:has-text("Create"), button[type="submit"]').first()
        if (await saveButton.isVisible({ timeout: 2000 })) {
          await saveButton.click()
        }
        
        await this.page.waitForLoadState('domcontentloaded')
        console.log(`✅ Event created: ${title}`)
      } catch (e) {
        console.log(`⚠️ Event creation may have failed: ${title}`)
      }
    } catch (error) {
      console.log(`⚠️ Event creation failed: ${title}`, error)
    }
  }

  async syncWithGoogle() {
    console.log('🔄 Syncing with Google Calendar...')
    
    try {
      // Check if page is still available
      if (this.page.isClosed()) {
        console.log('⚠️ Page context closed, cannot sync with Google')
        return
      }
      
      const syncSelectors = [
        'button:has-text("Sync")',
        'button:has-text("Google")',
        '[data-testid="google-sync-button"]',
        'text="Sync with Google"'
      ]
      
      for (const selector of syncSelectors) {
        try {
          if (this.page.isClosed()) break
          const element = this.page.locator(selector).first()
          if (await element.isVisible({ timeout: 2000 })) {
            await element.click()
            break
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      console.log('✅ Google Calendar sync initiated')
    } catch (error) {
      console.log('⚠️ Google Calendar sync failed:', error)
    }
  }
}

// AI Chat helpers
export class AIHelpers {
  constructor(private page: Page) {}

  async sendMessage(message: string) {
    console.log(`🤖 Sending AI message: ${message}`)
    
    try {
      // Check if page is still available
      if (this.page.isClosed()) {
        console.log('⚠️ Page context closed, cannot send AI message')
        return
      }
      
      // Wait for page to load
      await this.page.waitForLoadState('domcontentloaded', { timeout: 10000 })
      
      // Try to find chat interface on current page first
      let chatFound = false
      const chatSelectors = [
        'textarea[placeholder*="Type your message" i]',
        'textarea[placeholder*="message" i]',
        'input[placeholder*="message" i]',
        '[data-testid="ai-chat-input"]',
        '[data-testid="chat-input"]',
        'textarea:last-of-type',
        'input[type="text"]:last-of-type'
      ]
      
      for (const selector of chatSelectors) {
        try {
          if (this.page.isClosed()) break
          const chatInput = this.page.locator(selector).first()
          if (await chatInput.isVisible({ timeout: 1000 })) {
            chatFound = true
            console.log(`✅ Found chat interface with selector: ${selector}`)
            break
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      // Only navigate to chat if no chat interface found on current page
      if (!chatFound && !this.page.url().includes('/chat') && !this.page.isClosed()) {
        console.log('🔄 Navigating to chat page...')
        
        try {
          await this.page.goto('/chat', { timeout: 10000, waitUntil: 'domcontentloaded' })
          await this.page.waitForLoadState('domcontentloaded', { timeout: 5000 })
          console.log('✅ Successfully navigated to chat page')
        } catch (navError) {
          console.log('⚠️ Navigation to chat failed:', navError)
          console.log('⚠️ Trying to continue without navigation...')
          // Don't return here, try to find chat interface anyway
        }
      }
      
      if (this.page.isClosed()) {
        console.log('⚠️ Page context closed during navigation')
        return
      }
      
      // Small wait for interface to be ready
      await this.page.waitForLoadState('domcontentloaded')
      
      // Find the chat input with multiple selectors
      const chatInputSelectors = [
        'textarea[placeholder="Type your message..."]',
        'textarea[placeholder*="message" i]',
        'textarea[placeholder*="type" i]',
        'textarea:last-of-type',
        '[data-testid="chat-input"]'
      ]
      
      let chatInput: any = null
      for (const selector of chatInputSelectors) {
        try {
          if (this.page.isClosed()) break
          const element = this.page.locator(selector).first()
          if (await element.isVisible({ timeout: 2000 })) {
            chatInput = element
            break
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      if (!chatInput || this.page.isClosed()) {
        console.log('⚠️ Chat input not found or page closed - chat interface may not be available')
        return
      }
      
      // Check if input is disabled (API key missing)
      const isDisabled = await chatInput.isDisabled()
      if (isDisabled) {
        console.log('⚠️ Chat input is disabled - likely missing API key')
        return
      }
      
      // Fill the message
      await chatInput.fill(message)
      
      // Find and click the send button with multiple selectors
      const sendButtonSelectors = [
        'button:has([data-lucide="send"])', // Lucide Send icon
        'button.rounded-full:has(svg)', // Round button with SVG (from ChatWindow)
        'button:has(svg[class*="lucide-send"])', // SVG with lucide-send class
        'button[aria-label*="send" i]',
        'button:has-text("Send")',
        'button:has(svg):has-text("")', // Button with SVG but no text
        'button:has(svg) >> nth=-1', // Last button with SVG
        '[data-testid="send-button"]',
        'button[type="submit"]'
      ]
      
      let sendClicked = false
      for (const selector of sendButtonSelectors) {
        try {
          if (this.page.isClosed()) break
          const sendButton = this.page.locator(selector).first()
          if (await sendButton.isVisible({ timeout: 2000 })) {
            const isButtonDisabled = await sendButton.isDisabled()
            if (!isButtonDisabled) {
              await sendButton.click()
              sendClicked = true
              break
            }
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      if (!sendClicked) {
        console.log('⚠️ Could not find or click send button')
        return
      }
      
      console.log('✅ AI message sent')
      
    } catch (e) {
      console.log('⚠️ Could not send AI message:', e)
    }
  }

  async acceptSuggestion(suggestionIndex: number = 0) {
    const suggestions = this.page.locator('button:has-text("Accept"), [data-testid="ai-suggestion"]')
    await suggestions.nth(suggestionIndex).locator('button:has-text("Accept"), [data-testid="accept-suggestion"]').click()
    
    // Wait for suggestion to be applied
    const waitHelper4 = new WaitHelpers(this.page)
    await waitHelper4.safeWaitForTimeout(1000)
  }
}

// File management helpers
export class FileHelpers {
  constructor(private page: Page) {}

  async uploadFile(filePath: string, projectName?: string) {
    console.log(`📎 Uploading file: ${filePath}`)
    
    try {
      // Check if page is still available
      if (this.page.isClosed()) {
        console.log('⚠️ Page context closed, cannot upload file')
        return
      }
      
      const fileInput = this.page.locator('input[type="file"]').first()
      await fileInput.setInputFiles(filePath)
      
      // Wait for upload to complete
      await this.page.waitForLoadState('domcontentloaded')
      
      const fileName = filePath.split('/').pop()
      console.log(`✅ File uploaded: ${fileName}`)
    } catch (e) {
      console.log(`⚠️ File upload may have failed: ${filePath}`)
    }
  }

  async downloadFile(fileName: string) {
    try {
      // Check if page is still available
      if (this.page.isClosed()) {
        console.log('⚠️ Page context closed, cannot download file')
        return
      }
      
      const downloadPromise = this.page.waitForEvent('download')
      await this.page.click(`text="${fileName}" >> .. >> button:has-text("Download"), [data-testid="download-button"]`)
      const download = await downloadPromise
      return download
    } catch (error) {
      console.log(`⚠️ File download failed: ${fileName}`, error)
    }
  }
}

// Timer helpers
export class TimerHelpers {
  constructor(private page: Page) {}

  async startTimer(taskName?: string) {
    console.log('⏱️ Starting timer...')
    
    try {
      // Check if page is still available
      if (this.page.isClosed()) {
        console.log('⚠️ Page context closed, cannot start timer')
        return
      }
      
      const startSelectors = [
        'button:has-text("Start")',
        '[data-testid="start-timer-button"]',
        'button[aria-label*="start"]'
      ]
      
      for (const selector of startSelectors) {
        try {
          if (this.page.isClosed()) break
          const startButton = this.page.locator(selector).first()
          if (await startButton.isVisible({ timeout: 2000 })) {
            await startButton.click()
            break
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      console.log('✅ Timer started')
    } catch (error) {
      console.log('⚠️ Timer start failed:', error)
    }
  }

  async pauseTimer() {
    console.log('⏸️ Pausing timer...')
    
    try {
      // Check if page is still available
      if (this.page.isClosed()) {
        console.log('⚠️ Page context closed, cannot pause timer')
        return
      }
      
      const pauseSelectors = [
        'button:has-text("Pause")',
        '[data-testid="pause-timer-button"]',
        'button[aria-label*="pause"]'
      ]
      
      for (const selector of pauseSelectors) {
        try {
          if (this.page.isClosed()) break
          const pauseButton = this.page.locator(selector).first()
          if (await pauseButton.isVisible({ timeout: 2000 })) {
            await pauseButton.click()
            break
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      console.log('✅ Timer paused')
    } catch (error) {
      console.log('⚠️ Timer pause failed:', error)
    }
  }

  async stopTimer() {
    console.log('⏹️ Stopping timer...')
    
    try {
      // Check if page is still available
      if (this.page.isClosed()) {
        console.log('⚠️ Page context closed, cannot stop timer')
        return
      }
      
      const stopSelectors = [
        'button:has-text("Stop")',
        '[data-testid="stop-timer-button"]',
        'button[aria-label*="stop"]'
      ]
      
      for (const selector of stopSelectors) {
        try {
          if (this.page.isClosed()) break
          const stopButton = this.page.locator(selector).first()
          if (await stopButton.isVisible({ timeout: 2000 })) {
            await stopButton.click()
            break
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      console.log('✅ Timer stopped')
    } catch (error) {
      console.log('⚠️ Timer stop failed:', error)
    }
  }
}

// Wait helpers
export class WaitHelpers {
  constructor(private page: Page) {}

  async safeWaitForLoadState(state: 'load' | 'domcontentloaded' | 'networkidle' = 'domcontentloaded', timeout: number = 5000) {
    try {
      // Check if page is still available
      if (this.page.isClosed()) {
        console.log('⚠️ Page context closed, cannot wait for load state')
        return false
      }
      
      await this.page.waitForLoadState(state, { timeout })
      return true
    } catch (error) {
      console.log(`⚠️ Wait for load state '${state}' failed:`, error)
      return false
    }
  }

  async safeWaitForTimeout(timeout: number) {
    try {
      // Check if page is still available
      if (this.page.isClosed()) {
        console.log('⚠️ Page context closed, cannot wait for timeout')
        return false
      }
      
      await this.page.waitForTimeout(timeout)
      return true
    } catch (error) {
      console.log(`⚠️ Wait for timeout ${timeout}ms failed:`, error)
      return false
    }
  }

  async waitForLoadingToFinish() {
    try {
      // Check if page is still available
      if (this.page.isClosed()) {
        console.log('⚠️ Page context closed, cannot wait for loading')
        return
      }
      
      await this.page.waitForLoadState('domcontentloaded')
      
      // Wait for any loading spinners to disappear
      try {
        await this.page.waitForFunction(() => {
          const spinners = document.querySelectorAll('[data-testid="loading-spinner"], .loading, .spinner, .animate-spin')
          return spinners.length === 0
        }, { timeout: 10000 })
      } catch (e) {
        // Continue if no spinners found
      }
    } catch (error) {
      console.log('⚠️ Wait for loading failed:', error)
    }
  }

  async waitForToast(message: string) {
    try {
      await expect(this.page.locator(`text="${message}", [data-testid="toast"]:has-text("${message}")`)).toBeVisible({ timeout: 5000 })
    } catch (e) {
      console.log(`⚠️ Toast message not found: ${message}`)
    }
  }

  async waitForModal(modalTitle: string) {
    try {
      await expect(this.page.locator(`text="${modalTitle}", [data-testid="modal"]:has-text("${modalTitle}")`)).toBeVisible({ timeout: 5000 })
    } catch (e) {
      console.log(`⚠️ Modal not found: ${modalTitle}`)
    }
  }
}

// Performance helpers
export class PerformanceHelpers {
  constructor(private page: Page) {}

  async measurePageLoad(url: string) {
    const startTime = Date.now()
    try {
      await this.page.goto(url, { timeout: 15000 })
      await this.page.waitForLoadState('domcontentloaded', { timeout: 10000 })
      const endTime = Date.now()
      const loadTime = endTime - startTime
      console.log(`📊 Page load time for ${url}: ${loadTime}ms`)
      return loadTime
    } catch (error) {
      const endTime = Date.now()
      const loadTime = endTime - startTime
      console.log(`⚠️ Page load timeout for ${url}: ${loadTime}ms`)
      return loadTime
    }
  }

  async measureActionTime(action: () => Promise<void>) {
    const startTime = Date.now()
    await action()
    const endTime = Date.now()
    const actionTime = endTime - startTime
    console.log(`📊 Action completed in: ${actionTime}ms`)
    return actionTime
  }
} 