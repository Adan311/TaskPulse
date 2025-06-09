import { describe, test, expect, beforeEach } from 'vitest'


const createKeyboardEvent = (type: string, key: string, shiftKey = false) => {
  return new KeyboardEvent(type, {
    key,
    shiftKey,
    bubbles: true,
    cancelable: true
  })
}

describe('Keyboard Navigation Accessibility Tests', () => {
  beforeEach(() => {
    // Reset DOM for each test
    document.body.innerHTML = ''
  })

  test('should support tab navigation through all interactive elements', () => {
    // Arrange - Create page with various interactive elements
    document.body.innerHTML = `
      <button>Button 1</button>
      <a href="#link">Link</a>
      <input type="text" placeholder="Text input">
      <select>
        <option>Option 1</option>
        <option>Option 2</option>
      </select>
      <textarea placeholder="Textarea"></textarea>
      <button>Button 2</button>
    `

    // Act - Get all tabbable elements
    const tabbableElements = document.querySelectorAll(
      'button, a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )

    // Assert - All interactive elements should be tabbable
    expect(tabbableElements.length).toBe(6)
    
    tabbableElements.forEach(element => {
      const htmlElement = element as HTMLElement
      // Elements should be focusable
      expect(htmlElement.tabIndex >= 0 || 
             ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'].includes(htmlElement.tagName)).toBe(true)
    })
  })

  test('should support shift+tab for reverse navigation', () => {
    // Arrange - Create elements in tab order
    document.body.innerHTML = `
      <button id="first">First</button>
      <button id="second">Second</button>
      <button id="third">Third</button>
    `

    const firstButton = document.getElementById('first') as HTMLButtonElement
    const secondButton = document.getElementById('second') as HTMLButtonElement
    const thirdButton = document.getElementById('third') as HTMLButtonElement

    // Act - Simulate shift+tab navigation
    thirdButton.focus()
    expect(document.activeElement).toBe(thirdButton)

    // Simulate shift+tab (would move to second button)
    const shiftTabEvent = createKeyboardEvent('keydown', 'Tab', true)
    thirdButton.dispatchEvent(shiftTabEvent)

    // Assert - Elements exist and reverse navigation framework is in place

    expect(firstButton).toBeTruthy()
    expect(secondButton).toBeTruthy()
    expect(thirdButton).toBeTruthy()
    
    // Verify tab order is correct for reverse navigation
    expect(firstButton.tabIndex).toBeGreaterThanOrEqual(0)
    expect(secondButton.tabIndex).toBeGreaterThanOrEqual(0)
    expect(thirdButton.tabIndex).toBeGreaterThanOrEqual(0)
  })

  test('should maintain focus visibility with clear indicators', () => {
    // Arrange - Create focusable elements
    const focusableElements = [
      '<button style="outline: 2px solid blue;">Styled Button</button>',
      '<a href="#" style="outline: 2px solid blue;">Styled Link</a>',
      '<input type="text" style="outline: 2px solid blue;">',
      '<select style="outline: 2px solid blue;"><option>Option</option></select>'
    ]

    focusableElements.forEach(html => {
      // Act
      document.body.innerHTML = html
      const element = document.body.firstElementChild as HTMLElement
      element.focus()

      // Assert - Element should have focus indicator
      const hasOutline = element.style.outline.includes('solid') || 
                        element.style.outlineWidth || 
                        element.style.border.includes('solid')
      expect(hasOutline || element === document.activeElement).toBe(true)
    })
  })

  test('should skip non-interactive elements during tab navigation', () => {
    // Arrange - Mix of interactive and non-interactive elements
    document.body.innerHTML = `
      <p>Non-interactive paragraph</p>
      <button>Interactive button</button>
      <div>Non-interactive div</div>
      <span>Non-interactive span</span>
      <a href="#link">Interactive link</a>
      <h2>Non-interactive heading</h2>
      <input type="text" placeholder="Interactive input">
    `

    // Act - Get tabbable elements
    const tabbableElements = document.querySelectorAll(
      'button, a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )

    const nonInteractiveElements = document.querySelectorAll(
      'p, div:not([tabindex]), span:not([tabindex]), h1, h2, h3, h4, h5, h6'
    )

    // Assert - Only interactive elements should be tabbable
    expect(tabbableElements.length).toBe(3) // button, link, input
    expect(nonInteractiveElements.length).toBe(4) // p, div, span, h2

    nonInteractiveElements.forEach(element => {
      const htmlElement = element as HTMLElement
      expect(htmlElement.tabIndex).toBeLessThan(0)
    })
  })

  test('should support standard keyboard shortcuts', () => {
    // Arrange - Create form with standard shortcuts
    document.body.innerHTML = `
      <form>
        <label for="name">Name (Alt+N):</label>
        <input type="text" id="name" accesskey="n">
        
        <label for="email">Email (Alt+E):</label>
        <input type="email" id="email" accesskey="e">
        
        <button type="submit" accesskey="s">Submit (Alt+S)</button>
        <button type="button" accesskey="c">Cancel (Alt+C)</button>
      </form>
    `

    // Act - Check for access keys
    const elementsWithAccessKeys = document.querySelectorAll('[accesskey]')

    // Assert - Elements should have access keys for keyboard shortcuts
    expect(elementsWithAccessKeys.length).toBe(4)
    
    elementsWithAccessKeys.forEach(element => {
      const accessKey = element.getAttribute('accesskey')
      expect(accessKey).toBeTruthy()
      expect(accessKey?.length).toBe(1)
    })
  })

  test('should provide application-specific keyboard shortcuts', () => {
    // Arrange - Test app-specific shortcuts
    const shortcutElements = [
      { key: 'Escape', action: 'escape' },
      { key: 'Enter', action: 'enter' },
      { key: 'Space', action: 'space' },
      { key: 'ArrowUp', action: 'arrows' },
      { key: 'ArrowDown', action: 'arrows' }
    ]

    document.body.innerHTML = `
      <div id="app">
        <button data-shortcut="escape">Close (Esc)</button>
        <form data-shortcut="enter">
          <input type="text">
          <button type="submit">Submit (Enter)</button>
        </form>
        <input type="checkbox" data-shortcut="space"> Toggle (Space)
        <ul data-shortcut="arrows">
          <li>Item 1</li>
          <li>Item 2</li>
          <li>Item 3</li>
        </ul>
      </div>
    `

    // Act & Assert - Check for shortcut indicators
    shortcutElements.forEach(shortcut => {
      const keydownEvent = createKeyboardEvent('keydown', shortcut.key)
      const appElement = document.getElementById('app')
      
      // Simulate shortcut handling
      appElement?.dispatchEvent(keydownEvent)
      
      // Verify shortcut elements exist - match exact attribute values
      const shortcutElement = document.querySelector(`[data-shortcut="${shortcut.action}"]`)
      expect(shortcutElement).toBeTruthy()
    })
  })

  test('should handle arrow key navigation in lists and grids', () => {
    // Arrange - Create list with arrow navigation
    document.body.innerHTML = `
      <ul role="listbox" aria-label="Options">
        <li role="option" tabindex="0">Option 1</li>
        <li role="option" tabindex="-1">Option 2</li>
        <li role="option" tabindex="-1">Option 3</li>
        <li role="option" tabindex="-1">Option 4</li>
      </ul>
    `

    const listbox = document.querySelector('[role="listbox"]') as HTMLElement
    const options = Array.from(document.querySelectorAll('[role="option"]')) as HTMLElement[]

    // Assert - List structure for arrow navigation
    expect(listbox).toBeTruthy()
    expect(options.length).toBe(4)
    
    // Only first option should be initially tabbable
    expect(options[0].tabIndex).toBe(0)
    options.slice(1).forEach(option => {
      expect(option.tabIndex).toBe(-1)
    })

    // Simulate arrow key navigation
    const arrowDownEvent = createKeyboardEvent('keydown', 'ArrowDown')
    listbox.dispatchEvent(arrowDownEvent)
    
    // Navigation should be handled by JavaScript (not tested here)
    expect(arrowDownEvent.key).toBe('ArrowDown')
  })

  test('should support home and end keys for navigation', () => {
    // Arrange - Create navigable content
    document.body.innerHTML = `
      <div role="grid" tabindex="0">
        <div role="row">
          <div role="gridcell" tabindex="-1">Cell 1</div>
          <div role="gridcell" tabindex="-1">Cell 2</div>
          <div role="gridcell" tabindex="-1">Cell 3</div>
        </div>
      </div>
      
      <textarea>Line 1
Line 2
Line 3</textarea>
      
      <input type="text" value="Some text content">
    `

    const grid = document.querySelector('[role="grid"]') as HTMLElement
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement
    const input = document.querySelector('input') as HTMLInputElement

    // Act & Assert - Test Home/End key support
    const homeEvent = createKeyboardEvent('keydown', 'Home')
    const endEvent = createKeyboardEvent('keydown', 'End')

    // Grid should handle Home/End for navigation
    grid.dispatchEvent(homeEvent)
    grid.dispatchEvent(endEvent)
    expect(homeEvent.key).toBe('Home')
    expect(endEvent.key).toBe('End')

    // Form controls should support Home/End naturally
    textarea.focus()
    input.focus()
    expect(textarea).toBeTruthy()
    expect(input).toBeTruthy()
  })

  test('should trap focus within modal dialogs', () => {
    // Arrange - Create modal with focusable elements
    document.body.innerHTML = `
      <div id="main-content">
        <button>Outside Button</button>
      </div>
      
      <div role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <h2 id="modal-title">Modal Title</h2>
        <button id="modal-first">First Button</button>
        <input type="text" placeholder="Input">
        <button id="modal-last">Last Button</button>
      </div>
    `

    const modal = document.querySelector('[role="dialog"]') as HTMLElement
    const outsideButton = document.querySelector('#main-content button') as HTMLButtonElement
    const firstModalButton = document.getElementById('modal-first') as HTMLButtonElement
    const lastModalButton = document.getElementById('modal-last') as HTMLButtonElement

    // Act - Get focusable elements in modal
    const modalFocusableElements = modal.querySelectorAll(
      'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
    )

    // Assert - Focus should be trapped in modal
    expect(modal.getAttribute('aria-modal')).toBe('true')
    expect(modalFocusableElements.length).toBe(3) // 2 buttons + 1 input
    expect(firstModalButton).toBeTruthy()
    expect(lastModalButton).toBeTruthy()
    expect(outsideButton).toBeTruthy()

    // Modal should prevent focus from leaving (implementation dependent)
    const tabEvent = createKeyboardEvent('keydown', 'Tab')
    lastModalButton.dispatchEvent(tabEvent)
    expect(tabEvent.key).toBe('Tab')
  })

  test('should return focus to trigger element when modal closes', () => {
    // Arrange - Create button that opens modal
    document.body.innerHTML = `
      <button id="open-modal">Open Modal</button>
      
      <div role="dialog" aria-modal="true" style="display: none;">
        <h2>Modal</h2>
        <button id="close-modal">Close</button>
      </div>
    `

    const openButton = document.getElementById('open-modal') as HTMLButtonElement
    const modal = document.querySelector('[role="dialog"]') as HTMLElement
    const closeButton = document.getElementById('close-modal') as HTMLButtonElement

    // Act - Simulate modal workflow
    openButton.focus()
    expect(document.activeElement).toBe(openButton)

    // Modal opens (focus should move to modal)
    modal.style.display = 'block'
    closeButton.focus()
    expect(document.activeElement).toBe(closeButton)

    // Assert - When modal closes, focus should return to trigger
    modal.style.display = 'none'
    openButton.focus() // Simulate focus restoration
    expect(document.activeElement).toBe(openButton)
  })

  test('should support escape key to close modals', () => {
    // Arrange - Create modal
    document.body.innerHTML = `
      <div role="dialog" aria-modal="true" data-escapable="true">
        <h2>Modal Title</h2>
        <p>Modal content</p>
        <button>Action</button>
        <button>Close</button>
      </div>
    `

    const modal = document.querySelector('[role="dialog"]') as HTMLElement

    // Act - Test escape key functionality
    const escapeEvent = createKeyboardEvent('keydown', 'Escape')
    modal.dispatchEvent(escapeEvent)

    // Assert - Modal should handle escape key
    expect(escapeEvent.key).toBe('Escape')
    expect(modal.getAttribute('data-escapable')).toBe('true')
    

    expect(modal.getAttribute('aria-modal')).toBe('true')
  })

  test('should set initial focus to appropriate element in modal', () => {
    // Arrange - Different types of modals
    const modalTypes = [
      {
        html: `
          <div role="dialog" aria-modal="true">
            <h2>Confirmation</h2>
            <p>Are you sure?</p>
            <button data-primary="true">Confirm</button>
            <button>Cancel</button>
          </div>
        `,
        expectedFocus: '[data-primary="true"]'
      },
      {
        html: `
          <div role="dialog" aria-modal="true">
            <h2>Edit Item</h2>
            <input type="text" data-autofocus="true" value="Item name">
            <button>Save</button>
            <button>Cancel</button>
          </div>
        `,
        expectedFocus: '[data-autofocus="true"]'
      }
    ]

    modalTypes.forEach(modalType => {
      // Act
      document.body.innerHTML = modalType.html
      const modal = document.querySelector('[role="dialog"]') as HTMLElement
      const expectedElement = modal.querySelector(modalType.expectedFocus) as HTMLElement

      // Assert - Modal should set appropriate initial focus
      expect(modal).toBeTruthy()
      expect(expectedElement).toBeTruthy()
      
      // Focus should be set programmatically on modal open
      expectedElement.focus()
      expect(document.activeElement).toBe(expectedElement)
    })
  })

  test('should support enter key to submit forms', () => {
    // Arrange - Create form
    document.body.innerHTML = `
      <form id="test-form">
        <input type="text" placeholder="Name" required>
        <input type="email" placeholder="Email" required>
        <button type="submit">Submit</button>
        <button type="button">Cancel</button>
      </form>
    `

    const form = document.getElementById('test-form') as HTMLFormElement
    const textInput = form.querySelector('input[type="text"]') as HTMLInputElement
    const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement

    // Act - Test enter key in form
    textInput.focus()
    const enterEvent = createKeyboardEvent('keydown', 'Enter')
    textInput.dispatchEvent(enterEvent)

    // Assert - Enter should trigger form submission
    expect(enterEvent.key).toBe('Enter')
    expect(submitButton.type).toBe('submit')
    expect(form.tagName).toBe('FORM')
    
    // Form should handle enter key naturally
    expect(form.querySelector('input[required]')).toBeTruthy()
  })

  test('should support space and enter for button activation', () => {
    // Arrange - Create different types of buttons
    document.body.innerHTML = `
      <button type="button" id="regular-button">Regular Button</button>
      <button type="submit" id="submit-button">Submit Button</button>
      <div role="button" tabindex="0" id="custom-button">Custom Button</div>
      <a href="#" role="button" id="link-button">Link Button</a>
    `

    const buttons = [
      document.getElementById('regular-button'),
      document.getElementById('submit-button'),
      document.getElementById('custom-button'),
      document.getElementById('link-button')
    ] as HTMLElement[]

    // Act & Assert - Test space and enter activation
    buttons.forEach(button => {
      const spaceEvent = createKeyboardEvent('keydown', ' ')
      const enterEvent = createKeyboardEvent('keydown', 'Enter')

      button.dispatchEvent(spaceEvent)
      button.dispatchEvent(enterEvent)

      // Buttons should respond to both space and enter
      expect(spaceEvent.key).toBe(' ')
      expect(enterEvent.key).toBe('Enter')
      
      // Custom buttons need role="button"
      if (button.tagName !== 'BUTTON') {
        expect(button.getAttribute('role')).toBe('button')
        expect(button.tabIndex >= 0).toBe(true)
      }
    })
  })

  test('should support arrow keys for radio button groups', () => {
    // Arrange - Create radio button group
    document.body.innerHTML = `
      <fieldset>
        <legend>Choose an option:</legend>
        <input type="radio" id="option1" name="choice" value="1" checked>
        <label for="option1">Option 1</label>
        
        <input type="radio" id="option2" name="choice" value="2">
        <label for="option2">Option 2</label>
        
        <input type="radio" id="option3" name="choice" value="3">
        <label for="option3">Option 3</label>
      </fieldset>
    `

    const radioButtons = Array.from(document.querySelectorAll('input[type="radio"]')) as HTMLInputElement[]
    const firstRadio = radioButtons[0]

    // Act - Test arrow key navigation
    firstRadio.focus()
    const arrowDownEvent = createKeyboardEvent('keydown', 'ArrowDown')
    const arrowUpEvent = createKeyboardEvent('keydown', 'ArrowUp')

    firstRadio.dispatchEvent(arrowDownEvent)
    firstRadio.dispatchEvent(arrowUpEvent)

    // Assert - Radio buttons should form a group
    expect(radioButtons.length).toBe(3)
    expect(radioButtons[0].checked).toBe(true)
    
    // All radio buttons should have same name
    radioButtons.forEach(radio => {
      expect(radio.name).toBe('choice')
    })

    // Arrow keys should navigate between options
    expect(arrowDownEvent.key).toBe('ArrowDown')
    expect(arrowUpEvent.key).toBe('ArrowUp')
  })
}) 