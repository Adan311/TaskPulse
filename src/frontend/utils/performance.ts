// Performance monitoring utilities for tracking Core Web Vitals and load times

interface PerformanceMetrics {
  cls: number;
  fcp: number;
  fid: number;
  lcp: number;
  ttfb: number;
  loadTime: number;
  domContentLoaded: number;
}

class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private observer: PerformanceObserver | null = null;

  constructor() {
    this.initializeObserver();
    this.trackPageLoad();
  }

  private initializeObserver() {
    if ('PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.handlePerformanceEntry(entry);
        }
      });

      // Observe all performance entry types
      try {
        this.observer.observe({ entryTypes: ['measure', 'navigation', 'paint', 'largest-contentful-paint'] });
      } catch (e) {
        console.warn('Performance observer not fully supported:', e);
      }
    }
  }

  private handlePerformanceEntry(entry: PerformanceEntry) {
    switch (entry.entryType) {
      case 'paint':
        if (entry.name === 'first-contentful-paint') {
          this.metrics.fcp = entry.startTime;
        }
        break;
      
      case 'largest-contentful-paint':
        this.metrics.lcp = entry.startTime;
        break;
      
      case 'navigation':
        const navEntry = entry as PerformanceNavigationTiming;
        this.metrics.ttfb = navEntry.responseStart - navEntry.requestStart;
        this.metrics.domContentLoaded = navEntry.domContentLoadedEventEnd - navEntry.fetchStart;
        this.metrics.loadTime = navEntry.loadEventEnd - navEntry.fetchStart;
        break;
    }
  }

  private trackPageLoad() {
    // Track initial page load metrics
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          this.metrics.loadTime = navigation.loadEventEnd - navigation.fetchStart;
          this.metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
          this.metrics.ttfb = navigation.responseStart - navigation.requestStart;
        }
      }, 0);
    });

    // Track Core Web Vitals if available
    this.trackCoreWebVitals();
  }

  private trackCoreWebVitals() {
    // CLS - Cumulative Layout Shift
    if ('LayoutShiftAttribution' in window) {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        this.metrics.cls = clsValue;
      });
      
      try {
        clsObserver.observe({ type: 'layout-shift', buffered: true });
      } catch (e) {
        console.warn('CLS tracking not supported:', e);
      }
    }

    // FID - First Input Delay
    if ('PerformanceEventTiming' in window) {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.metrics.fid = (entry as any).processingStart - entry.startTime;
        }
      });
      
      try {
        fidObserver.observe({ type: 'first-input', buffered: true });
      } catch (e) {
        console.warn('FID tracking not supported:', e);
      }
    }
  }

  public getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  public logMetrics(enableLogging: boolean = import.meta.env.DEV): void {
    if (!enableLogging) return;
    
    const metrics = this.getMetrics();
    console.group('🚀 Performance Metrics');
    
    if (metrics.fcp) console.log(`First Contentful Paint: ${metrics.fcp.toFixed(2)}ms`);
    if (metrics.lcp) console.log(`Largest Contentful Paint: ${metrics.lcp.toFixed(2)}ms`);
    if (metrics.fid) console.log(`First Input Delay: ${metrics.fid.toFixed(2)}ms`);
    if (metrics.cls) console.log(`Cumulative Layout Shift: ${metrics.cls.toFixed(4)}`);
    if (metrics.ttfb) console.log(`Time to First Byte: ${metrics.ttfb.toFixed(2)}ms`);
    if (metrics.loadTime) console.log(`Total Load Time: ${metrics.loadTime.toFixed(2)}ms`);
    if (metrics.domContentLoaded) console.log(`DOM Content Loaded: ${metrics.domContentLoaded.toFixed(2)}ms`);
    
    console.groupEnd();
  }

  public isGoodPerformance(): boolean {
    const { fcp, lcp, fid, cls, loadTime } = this.metrics;
    
    return (
      (!fcp || fcp < 1800) && // Good FCP < 1.8s
      (!lcp || lcp < 2500) && // Good LCP < 2.5s
      (!fid || fid < 100) &&  // Good FID < 100ms
      (!cls || cls < 0.1) &&  // Good CLS < 0.1
      (!loadTime || loadTime < 2000) // Target < 2s total load time
    );
  }

  public destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Route transition timing
export const trackRouteTransition = (routeName: string, enableLogging: boolean = import.meta.env.DEV) => {
  const startTime = performance.now();
  
  return () => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (enableLogging) {
      console.log(`📍 Route transition to ${routeName}: ${duration.toFixed(2)}ms`);
      
      // Log if transition is slower than target (500ms)
      if (duration > 500) {
        console.warn(`⚠️ Slow route transition detected: ${routeName} took ${duration.toFixed(2)}ms`);
      }
    }
  };
};

// Bundle size tracking
export const trackBundleLoad = (chunkName: string, enableLogging: boolean = import.meta.env.DEV) => {
  const startTime = performance.now();
  
  return () => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (enableLogging) {
      console.log(`📦 Chunk loaded: ${chunkName} in ${duration.toFixed(2)}ms`);
    }
  };
};

// Initialize performance monitoring
export const initPerformanceMonitoring = (enableLogging: boolean = import.meta.env.DEV) => {
  const monitor = new PerformanceMonitor();
  
  // Log metrics after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      monitor.logMetrics(enableLogging);
      
      if (enableLogging) {
        if (!monitor.isGoodPerformance()) {
          console.warn('⚠️ Performance metrics indicate room for improvement');
        } else {
          console.log('✅ Good performance metrics achieved');
        }
      }
    }, 1000);
  });
  
  return monitor;
};

export default PerformanceMonitor; 