// =============================================
// src/utils/performance.js
// =============================================

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoadTime: 0,
      renderTime: 0,
      apiResponseTimes: {},
      memoryUsage: 0,
      networkRequests: []
    };
    
    this.observers = [];
    this.init();
  }

  init() {
    if (typeof window !== 'undefined') {
      // Monitor page load performance
      window.addEventListener('load', () => {
        this.measurePageLoad();
      });

      // Monitor render performance
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          this.measureRenderPerformance();
        });
      }

      // Monitor memory usage
      if ('memory' in performance) {
        setInterval(() => {
          this.measureMemoryUsage();
        }, 30000); // Every 30 seconds
      }

      // Monitor Core Web Vitals
      this.observeWebVitals();
    }
  }

  measurePageLoad() {
    if ('performance' in window && 'timing' in performance) {
      const timing = performance.timing;
      this.metrics.pageLoadTime = timing.loadEventEnd - timing.navigationStart;
      
      console.log(`Page Load Time: ${this.metrics.pageLoadTime}ms`);
      
      // Send to analytics
      this.reportMetric('page_load_time', this.metrics.pageLoadTime);
    }
  }

  measureRenderPerformance() {
    if ('performance' in window) {
      const entries = performance.getEntriesByType('paint');
      
      entries.forEach(entry => {
        if (entry.name === 'first-contentful-paint') {
          this.metrics.renderTime = entry.startTime;
          console.log(`First Contentful Paint: ${entry.startTime}ms`);
          this.reportMetric('first_contentful_paint', entry.startTime);
        }
      });
    }
  }

  measureMemoryUsage() {
    if ('memory' in performance) {
      const memory = performance.memory;
      this.metrics.memoryUsage = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      };
      
      // Warn if memory usage is high
      const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      if (usagePercent > 80) {
        console.warn(`High memory usage: ${usagePercent.toFixed(2)}%`);
        this.reportMetric('high_memory_usage', usagePercent);
      }
    }
  }

  observeWebVitals() {
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log(`LCP: ${lastEntry.startTime}ms`);
        this.reportMetric('largest_contentful_paint', lastEntry.startTime);
      });
      
      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (e) {
        console.warn('LCP observer not supported');
      }

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          console.log(`FID: ${entry.processingStart - entry.startTime}ms`);
          this.reportMetric('first_input_delay', entry.processingStart - entry.startTime);
        });
      });
      
      try {
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (e) {
        console.warn('FID observer not supported');
      }

      // Cumulative Layout Shift (CLS)
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        const entries = list.getEntries();
        
        entries.forEach(entry => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        
        if (clsValue > 0) {
          console.log(`CLS: ${clsValue}`);
          this.reportMetric('cumulative_layout_shift', clsValue);
        }
      });
      
      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (e) {
        console.warn('CLS observer not supported');
      }
    }
  }

  // Measure API response times
  measureApiCall(endpoint, startTime, endTime) {
    const responseTime = endTime - startTime;
    
    if (!this.metrics.apiResponseTimes[endpoint]) {
      this.metrics.apiResponseTimes[endpoint] = [];
    }
    
    this.metrics.apiResponseTimes[endpoint].push(responseTime);
    
    // Keep only last 10 measurements per endpoint
    if (this.metrics.apiResponseTimes[endpoint].length > 10) {
      this.metrics.apiResponseTimes[endpoint].shift();
    }
    
    console.log(`API Response Time (${endpoint}): ${responseTime}ms`);
    this.reportMetric('api_response_time', responseTime, { endpoint });
  }

  // Start timing an operation
  startTimer(label) {
    return performance.now();
  }

  // End timing an operation
  endTimer(label, startTime) {
    const duration = performance.now() - startTime;
    console.log(`${label}: ${duration}ms`);
    this.reportMetric('custom_timer', duration, { label });
    return duration;
  }

  // Report metric to analytics
  reportMetric(name, value, metadata = {}) {
    // This would typically send data to your analytics service
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', name, {
        custom_parameter: value,
        ...metadata
      });
    }
    
    // Also store locally for debugging
    const metric = {
      name,
      value,
      metadata,
      timestamp: Date.now()
    };
    
    const existingMetrics = JSON.parse(localStorage.getItem('performance_metrics') || '[]');
    existingMetrics.push(metric);
    
    // Keep only last 100 metrics
    if (existingMetrics.length > 100) {
      existingMetrics.shift();
    }
    
    localStorage.setItem('performance_metrics', JSON.stringify(existingMetrics));
  }

  // Get performance summary
  getSummary() {
    const summary = {
      pageLoadTime: this.metrics.pageLoadTime,
      renderTime: this.metrics.renderTime,
      memoryUsage: this.metrics.memoryUsage,
      apiResponseTimes: {}
    };
    
    // Calculate average API response times
    Object.keys(this.metrics.apiResponseTimes).forEach(endpoint => {
      const times = this.metrics.apiResponseTimes[endpoint];
      const average = times.reduce((sum, time) => sum + time, 0) / times.length;
      summary.apiResponseTimes[endpoint] = {
        average: Math.round(average),
        count: times.length,
        latest: times[times.length - 1]
      };
    });
    
    return summary;
  }

  // Get stored metrics from localStorage
  getStoredMetrics() {
    return JSON.parse(localStorage.getItem('performance_metrics') || '[]');
  }

  // Clear stored metrics
  clearStoredMetrics() {
    localStorage.removeItem('performance_metrics');
  }

  // Cleanup observers
  cleanup() {
    this.observers.forEach(observer => {
      observer.disconnect();
    });
    this.observers = [];
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export utility functions
export const measureApiCall = (endpoint, startTime, endTime) => {
  performanceMonitor.measureApiCall(endpoint, startTime, endTime);
};

export const startTimer = (label) => {
  return performanceMonitor.startTimer(label);
};

export const endTimer = (label, startTime) => {
  return performanceMonitor.endTimer(label, startTime);
};

export const getPerformanceSummary = () => {
  return performanceMonitor.getSummary();
};

export default performanceMonitor;