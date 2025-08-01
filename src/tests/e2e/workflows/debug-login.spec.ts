import { test, expect } from '@playwright/test'

test.describe('Debug Login Process', () => {
  test('🔍 Debug Login Step by Step', async ({ page }) => {
    console.log('🔍 Starting detailed login debug...')
    
    // Step 1: Navigate to signin page
    console.log('Step 1: Navigating to signin page...')
    await page.goto('/auth/signin')
    await page.waitForLoadState('domcontentloaded')
    
    // Step 2: Verify page loaded
    console.log('Step 2: Verifying signin page elements...')
    await expect(page.locator('[data-testid="signin-heading"]')).toBeVisible()
    console.log('✅ Signin heading visible')
    
    // Step 3: Check form elements
    const emailInput = page.locator('[data-testid="email-input"]')
    const passwordInput = page.locator('[data-testid="password-input"]')
    const submitButton = page.locator('[data-testid="signin-submit-button"]')
    
    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
    await expect(submitButton).toBeVisible()
    console.log('✅ All form elements visible')
    
    // Step 4: Fill form
    console.log('Step 4: Filling login form...')
    await emailInput.fill('e2e-test@taskpulse.com')
    await passwordInput.fill('testpassword123')
    
    // Verify values were entered
    const emailValue = await emailInput.inputValue()
    const passwordValue = await passwordInput.inputValue()
    console.log(`Email entered: ${emailValue}`)
    console.log(`Password entered: ${passwordValue ? '***' : 'EMPTY'}`)
    
    // Step 5: Submit form and monitor network
    console.log('Step 5: Submitting form...')
    
    // Listen for network requests
    const authRequests: any[] = []
    page.on('request', (request) => {
      if (request.url().includes('auth') || request.url().includes('supabase')) {
        authRequests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers()
        })
        console.log(`📡 Auth request: ${request.method()} ${request.url()}`)
      }
    })
    
    // Listen for responses
    page.on('response', (response) => {
      if (response.url().includes('auth') || response.url().includes('supabase')) {
        console.log(`📡 Auth response: ${response.status()} ${response.url()}`)
      }
    })
    
    // Listen for console logs
    page.on('console', (msg) => {
      console.log(`🖥️ Browser console: ${msg.type()}: ${msg.text()}`)
    })
    
    // Submit the form
    await submitButton.click()
    
    // Wait a bit for requests to complete
    await page.waitForTimeout(3000)
    
    // Step 6: Check current state
    console.log('Step 6: Checking post-submit state...')
    const currentUrl = page.url()
    console.log(`Current URL: ${currentUrl}`)
    
    const pageTitle = await page.title()
    console.log(`Page title: ${pageTitle}`)
    
    // Check if any error messages are visible
    const errorMessage = page.locator('[role="alert"], .error, .alert-destructive')
    if (await errorMessage.count() > 0) {
      const errorText = await errorMessage.first().textContent()
      console.log(`❌ Error message found: ${errorText}`)
    }
    
    // Check if we're still on signin page or moved
    const isStillOnSignin = await page.locator('[data-testid="signin-heading"]').isVisible()
    console.log(`Still on signin page: ${isStillOnSignin}`)
    
    // If we moved, check what page we're on
    if (!isStillOnSignin) {
      const isDashboard = await page.locator('[data-testid="dashboard-welcome-heading"]').isVisible()
      console.log(`On dashboard: ${isDashboard}`)
      
      if (isDashboard) {
        console.log('✅ Login successful - redirected to dashboard!')
      } else {
        console.log('❓ Redirected somewhere else...')
        const bodyText = await page.locator('body').textContent()
        console.log(`Page content preview: ${bodyText?.substring(0, 200)}...`)
      }
    }
    
    console.log(`Total auth requests made: ${authRequests.length}`)
    authRequests.forEach((req, i) => {
      console.log(`Request ${i + 1}: ${req.method} ${req.url}`)
    })
  })
}) 