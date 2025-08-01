// Accessibility utility functions
export const a11y = {
  // Focus management
  trapFocus: (element: HTMLElement, isActive: boolean = true) => {
    if (!isActive) return;
    
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    element.addEventListener('keydown', handleTabKey);
    return () => element.removeEventListener('keydown', handleTabKey);
  },

  // Keyboard navigation helpers
  handleArrowNavigation: (
    e: KeyboardEvent, 
    items: HTMLElement[], 
    currentIndex: number,
    onSelect?: (index: number) => void
  ) => {
    let newIndex = currentIndex;
    
    switch (e.key) {
      case 'ArrowDown':
        newIndex = (currentIndex + 1) % items.length;
        e.preventDefault();
        break;
      case 'ArrowUp':
        newIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
        e.preventDefault();
        break;
      case 'Home':
        newIndex = 0;
        e.preventDefault();
        break;
      case 'End':
        newIndex = items.length - 1;
        e.preventDefault();
        break;
      case 'Enter':
      case ' ':
        onSelect?.(currentIndex);
        e.preventDefault();
        break;
    }
    
    if (newIndex !== currentIndex) {
      items[newIndex]?.focus();
      return newIndex;
    }
    return currentIndex;
  },

  // Announce to screen readers
  announce: (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  },

  // Skip to content functionality
  addSkipLink: () => {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded';
    
    document.body.insertBefore(skipLink, document.body.firstChild);
  },

  // Color contrast checking (for development)
  checkColorContrast: (foreground: string, background: string): boolean => {
    // Basic contrast checking - converts colors to RGB and calculates luminance
    // Returns true if contrast ratio meets WCAG AA standards (4.5:1 for normal text)
    try {
      const getLuminance = (color: string): number => {
        // Simple RGB extraction for hex colors
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16) / 255;
        const g = parseInt(hex.substr(2, 2), 16) / 255;
        const b = parseInt(hex.substr(4, 2), 16) / 255;
        
        // Calculate relative luminance
        const rs = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
        const gs = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
        const bs = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
        
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
      };
      
      const fgLuminance = getLuminance(foreground);
      const bgLuminance = getLuminance(background);
      const contrast = (Math.max(fgLuminance, bgLuminance) + 0.05) / (Math.min(fgLuminance, bgLuminance) + 0.05);
      
      return contrast >= 4.5; // WCAG AA standard
    } catch (error) {
      console.warn('Color contrast check failed:', error);
      return true; // Fail safely
    }
  },

  // Generate accessible IDs
  generateId: (prefix: string = 'a11y'): string => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }
};

// Screen reader only CSS class utility
export const srOnly = "sr-only absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0";

// Focus ring utility
export const focusRing = "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background";

// High contrast mode support
export const highContrast = {
  border: "border-2 border-foreground",
  text: "text-foreground",
  background: "bg-background"
}; 