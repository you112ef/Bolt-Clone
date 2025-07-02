// Monitoring and Analytics for AI Agent Platform

// Performance monitoring
export const initPerformanceMonitoring = () => {
  if (typeof window === 'undefined') return;

  // Core Web Vitals
  import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
    getCLS(console.log);
    getFID(console.log);
    getFCP(console.log);
    getLCP(console.log);
    getTTFB(console.log);
  }).catch(() => {
    console.warn('Web Vitals not available');
  });

  // AI Agent specific metrics
  trackAIAgentUsage();
  trackSearchUsage();
  trackTerminalUsage();
};

// Track AI agent usage
const trackAIAgentUsage = () => {
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const [url] = args;
    if (typeof url === 'string' && url.includes('/api/ai/')) {
      const start = performance.now();
      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - start;
        
        // Track successful AI requests
        if (response.ok) {
          console.log(`AI Agent Request: ${url} - ${duration.toFixed(2)}ms`);
          // Send to analytics if needed
          sendAnalytics('ai_agent_request', {
            model: url.split('/').pop(),
            duration,
            success: true
          });
        }
        return response;
      } catch (error) {
        const duration = performance.now() - start;
        console.error(`AI Agent Error: ${url} - ${duration.toFixed(2)}ms`, error);
        sendAnalytics('ai_agent_request', {
          model: url.split('/').pop(),
          duration,
          success: false,
          error: error.message
        });
        throw error;
      }
    }
    return originalFetch(...args);
  };
};

// Track search usage
const trackSearchUsage = () => {
  // Track Ctrl+K usage
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'k') {
      sendAnalytics('search_opened', { trigger: 'keyboard' });
    }
  });
};

// Track terminal usage
const trackTerminalUsage = () => {
  // This would be implemented in the terminal component
  window.addEventListener('terminal-command', (e: any) => {
    sendAnalytics('terminal_command', {
      command: e.detail.command,
      timestamp: Date.now()
    });
  });
};

// Send analytics data
const sendAnalytics = (event: string, data: any) => {
  // Using Cloudflare Analytics
  if (typeof window !== 'undefined' && (window as any).__cfBeacon) {
    try {
      (window as any).__cfBeacon.track(event, data);
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  }
  
  // Fallback to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`Analytics: ${event}`, data);
  }
};

// Error tracking
export const initErrorTracking = () => {
  if (typeof window === 'undefined') return;

  // Global error handler
  window.addEventListener('error', (event) => {
    const errorInfo = {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.error('Global Error:', errorInfo);
    sendAnalytics('javascript_error', errorInfo);
  });

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const errorInfo = {
      reason: event.reason?.toString(),
      stack: event.reason?.stack,
      timestamp: Date.now(),
      url: window.location.href
    };

    console.error('Unhandled Promise Rejection:', errorInfo);
    sendAnalytics('promise_rejection', errorInfo);
  });
};

// Resource timing monitoring
export const initResourceMonitoring = () => {
  if (typeof window === 'undefined') return;

  window.addEventListener('load', () => {
    setTimeout(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const resources = performance.getEntriesByType('resource');

      // Track page load metrics
      sendAnalytics('page_load', {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
        resourceCount: resources.length
      });

      // Track slow resources
      resources.forEach((resource: PerformanceResourceTiming) => {
        const duration = resource.responseEnd - resource.requestStart;
        if (duration > 1000) { // Resources taking more than 1 second
          sendAnalytics('slow_resource', {
            name: resource.name,
            duration,
            size: resource.transferSize,
            type: resource.initiatorType
          });
        }
      });
    }, 1000);
  });
};

// Initialize all monitoring
export const initMonitoring = () => {
  initPerformanceMonitoring();
  initErrorTracking();
  initResourceMonitoring();
  
  console.log('🔍 Monitoring initialized for AI Agent Platform');
};