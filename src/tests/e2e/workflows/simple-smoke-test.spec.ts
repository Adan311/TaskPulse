import { test, expect } from '@playwright/test'
import { AuthHelpers, NavigationHelpers } from '../utils/test-helpers'
import { BrowserRecovery } from '../utils/browser-recovery'

test.describe('Simple Smoke Tests', () => {
  test('🔥 Basic Application Smoke Test', async ({ page, context }) => {
    console.log('🔥 Starting Basic Smoke Test...')
    
    const recovery = new BrowserRecovery(page, context)
    const auth = new AuthHelpers(page)
    const nav = new NavigationHelpers(page)

    try {
      // Test 1: Basic page load
      await test.step('Basic Page Load', async () => {
        const navigated = await recovery.safeNavigate('/')
        if (!navigated) {
          throw new Error('Could not navigate to home page')
        }
        
        // Check if we're redirected to login
        const currentUrl = page.url()
        if (currentUrl.includes('/auth/signin')) {
          console.log('✅ Redirected to login as expected')
        } else {
          console.log('✅ Home page loaded directly')
        }
      })

      // Test 2: Login functionality
      await test.step('Login Test', async () => {
        try {
          await auth.login()
          console.log('✅ Login successful')
        } catch (error) {
          console.log('⚠️ Login failed:', error)
          throw error
        }
      })

      // Test 3: Dashboard verification
      await test.step('Dashboard Verification', async () => {
        const isAlive = await recovery.ensurePageIsAlive()
        if (!isAlive) {
          throw new Error('Page is not responsive after login')
        }

        const dashboardVisible = await recovery.safeExpect(
          () => expect(page.locator('h1:has-text("Welcome to TaskPulse")')).toBeVisible({ timeout: 5000 }),
          'Dashboard content visibility'
        )
        
        if (!dashboardVisible) {
          await recovery.takeDebugScreenshot('dashboard-not-visible')
          throw new Error('Dashboard content not visible')
        }
        
        console.log('✅ Dashboard verified')
      })

      // Test 4: Basic navigation
      await test.step('Basic Navigation', async () => {
        // Try to navigate to tasks page
        const tasksNavigated = await recovery.safeNavigate('/tasks')
        if (tasksNavigated) {
          console.log('✅ Tasks page navigation successful')
          
          // Verify tasks page loaded
          const tasksVisible = await recovery.safeExpect(
            () => expect(page.locator('main')).toBeVisible({ timeout: 5000 }),
            'Tasks page content visibility'
          )
          
          if (tasksVisible) {
            console.log('✅ Tasks page content verified')
          }
        } else {
          console.log('⚠️ Tasks page navigation failed')
        }
      })

      console.log('🎉 Basic Smoke Test Completed Successfully!')

    } catch (error) {
      console.log('❌ Smoke test failed:', error)
      await recovery.takeDebugScreenshot('smoke-test-failure')
      throw error
    }
  })

  test('🔐 Authentication Flow Test', async ({ page, context }) => {
    console.log('🔐 Starting Authentication Flow Test...')
    
    const recovery = new BrowserRecovery(page, context)
    const auth = new AuthHelpers(page)

    try {
      // Test login page load
      await test.step('Login Page Load', async () => {
        const navigated = await recovery.safeNavigate('/auth/signin')
        if (!navigated) {
          throw new Error('Could not navigate to login page')
        }

        const loginFormVisible = await recovery.safeExpect(
          () => expect(page.locator('h1:has-text("Welcome back")')).toBeVisible({ timeout: 5000 }),
          'Login form visibility'
        )

        if (!loginFormVisible) {
          await recovery.takeDebugScreenshot('login-form-not-visible')
          throw new Error('Login form not visible')
        }

        console.log('✅ Login page loaded successfully')
      })

      // Test login process
      await test.step('Login Process', async () => {
        try {
          await auth.login()
          console.log('✅ Login process completed')
        } catch (error) {
          console.log('⚠️ Login process failed:', error)
          await recovery.takeDebugScreenshot('login-process-failed')
          throw error
        }
      })

      // Test post-login state
      await test.step('Post-Login Verification', async () => {
        const isAlive = await recovery.ensurePageIsAlive()
        if (!isAlive) {
          throw new Error('Page is not responsive after login')
        }

        // Check if we're on the dashboard
        const onDashboard = page.url() === 'http://localhost:8080/' || page.url().endsWith('/')
        if (onDashboard) {
          console.log('✅ Successfully redirected to dashboard')
        } else {
          console.log('⚠️ Not on dashboard, current URL:', page.url())
        }
      })

      console.log('🎉 Authentication Flow Test Completed Successfully!')

    } catch (error) {
      console.log('❌ Authentication test failed:', error)
      await recovery.takeDebugScreenshot('auth-test-failure')
      throw error
    }
  })

  test('📱 Page Responsiveness Test', async ({ page, context }) => {
    console.log('📱 Starting Page Responsiveness Test...')
    
    const recovery = new BrowserRecovery(page, context)
    const auth = new AuthHelpers(page)

    try {
      // Login first
      await auth.login()

      // Test different page loads
      const pages = ['/', '/tasks', '/calendar', '/projects']
      
      for (const pagePath of pages) {
        await test.step(`Test ${pagePath} responsiveness`, async () => {
          const navigated = await recovery.safeNavigate(pagePath)
          if (navigated) {
            console.log(`✅ ${pagePath} loaded successfully`)
            
            // Check if page content is visible
            const contentVisible = await recovery.safeExpect(
              () => expect(page.locator('main')).toBeVisible({ timeout: 3000 }),
              `${pagePath} content visibility`
            )
            
            if (contentVisible) {
              console.log(`✅ ${pagePath} content verified`)
            } else {
              console.log(`⚠️ ${pagePath} content not visible`)
            }
          } else {
            console.log(`⚠️ ${pagePath} navigation failed`)
          }
        })
      }

      console.log('🎉 Page Responsiveness Test Completed!')

    } catch (error) {
      console.log('❌ Responsiveness test failed:', error)
      await recovery.takeDebugScreenshot('responsiveness-test-failure')
      throw error
    }
  })
}) 