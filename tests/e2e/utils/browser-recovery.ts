import { Page, BrowserContext } from '@playwright/test'

export class BrowserRecovery {
  constructor(private page: Page, private context: BrowserContext) {}

  async ensurePageIsAlive(): Promise<boolean> {
    try {
      if (this.page.isClosed()) {
        console.log('⚠️ Page is closed, cannot recover')
        return false
      }
      
      // Try a simple operation to check if page is responsive
      await this.page.evaluate(() => document.title)
      return true
    } catch (error) {
      console.log('⚠️ Page is not responsive:', error)
      return false
    }
  }

  async safeNavigate(url: string, maxRetries: number = 3): Promise<boolean> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (this.page.isClosed()) {
          console.log('⚠️ Page is closed, cannot navigate')
          return false
        }

        await this.page.goto(url, { 
          timeout: 10000,
          waitUntil: 'domcontentloaded'
        })
        
        // Wait for page to be interactive
        await this.page.waitForLoadState('domcontentloaded', { timeout: 5000 })
        
        return true
      } catch (error) {
        console.log(`⚠️ Navigation attempt ${attempt} failed:`, error)
        
        if (attempt < maxRetries && !this.page.isClosed()) {
          await this.page.waitForTimeout(1000 * attempt) // Exponential backoff
        }
      }
    }
    
    return false
  }

  async safeAction<T>(action: () => Promise<T>, actionName: string): Promise<T | null> {
    try {
      if (this.page.isClosed()) {
        console.log(`⚠️ Cannot perform ${actionName}: page is closed`)
        return null
      }

      return await action()
    } catch (error) {
      console.log(`⚠️ Action ${actionName} failed:`, error)
      return null
    }
  }

  async safeExpect(expectation: () => Promise<void>, expectationName: string): Promise<boolean> {
    try {
      if (this.page.isClosed()) {
        console.log(`⚠️ Cannot verify ${expectationName}: page is closed`)
        return false
      }

      await expectation()
      return true
    } catch (error) {
      console.log(`⚠️ Expectation ${expectationName} failed:`, error)
      return false
    }
  }

  async takeDebugScreenshot(name: string): Promise<void> {
    try {
      if (!this.page.isClosed()) {
        await this.page.screenshot({ 
          path: `test-results/debug-${name}-${Date.now()}.png`, 
          fullPage: true 
        })
      }
    } catch (error) {
      console.log('⚠️ Could not take debug screenshot:', error)
    }
  }
} 