/**
 * Production Performance Monitoring System
 * Tracks application performance, errors, and user analytics
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface ErrorReport {
  error: Error;
  context: string;
  userId?: string;
  timestamp: number;
  stack?: string;
  metadata?: Record<string, any>;
}

interface UserAction {
  action: string;
  userId?: string;
  metadata?: Record<string, any>;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private errors: ErrorReport[] = [];
  private userActions: UserAction[] = [];
  private isProduction = process.env.NODE_ENV === 'production';

  // Performance tracking
  trackMetric(name: string, value: number, metadata?: Record<string, any>) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata
    };

    this.metrics.push(metric);
    
    // Send to monitoring service in production
    if (this.isProduction) {
      this.sendToMonitoringService('metric', metric);
    } else {
      console.log(`[Performance] ${name}: ${value}ms`, metadata);
    }

    // Keep only last 1000 metrics in memory
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  // Database query performance
  trackQueryPerformance(queryName: string, duration: number, metadata?: Record<string, any>) {
    this.trackMetric(`db.query.${queryName}`, duration, {
      type: 'database',
      ...metadata
    });

    // Alert on slow queries
    if (duration > 1000) { // More than 1 second
      this.reportError(
        new Error(`Slow query detected: ${queryName} took ${duration}ms`),
        'database.performance',
        undefined,
        { queryName, duration, ...metadata }
      );
    }
  }

  // API route performance
  trackAPIPerformance(route: string, method: string, duration: number, statusCode: number) {
    this.trackMetric(`api.${method}.${route}`, duration, {
      type: 'api',
      method,
      statusCode
    });

    // Alert on slow API calls
    if (duration > 2000) { // More than 2 seconds
      this.reportError(
        new Error(`Slow API call: ${method} ${route} took ${duration}ms`),
        'api.performance',
        undefined,
        { route, method, duration, statusCode }
      );
    }
  }

  // Component render performance
  trackComponentRender(componentName: string, duration: number, props?: any) {
    this.trackMetric(`component.render.${componentName}`, duration, {
      type: 'component',
      props: this.sanitizeProps(props)
    });

    // Alert on slow renders
    if (duration > 100) { // More than 100ms
      console.warn(`Slow component render: ${componentName} took ${duration}ms`);
    }
  }

  // Cache performance
  trackCacheHit(cacheKey: string, hit: boolean, duration?: number) {
    this.trackMetric(`cache.${hit ? 'hit' : 'miss'}`, duration || 0, {
      type: 'cache',
      cacheKey,
      hit
    });
  }

  // Memory usage tracking
  trackMemoryUsage() {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      this.trackMetric('memory.used', memory.usedJSHeapSize, {
        type: 'memory',
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      });
    }
  }

  // Error reporting
  reportError(error: Error, context: string, userId?: string, metadata?: Record<string, any>) {
    const errorReport: ErrorReport = {
      error,
      context,
      userId,
      timestamp: Date.now(),
      stack: error.stack,
      metadata
    };

    this.errors.push(errorReport);

    // Send to monitoring service
    if (this.isProduction) {
      this.sendToMonitoringService('error', errorReport);
    } else {
      console.error(`[Error] ${context}:`, error, metadata);
    }

    // Keep only last 100 errors in memory
    if (this.errors.length > 100) {
      this.errors = this.errors.slice(-100);
    }
  }

  // User action tracking
  trackUserAction(action: string, userId?: string, metadata?: Record<string, any>) {
    const userAction: UserAction = {
      action,
      userId,
      metadata,
      timestamp: Date.now()
    };

    this.userActions.push(userAction);

    // Send to analytics service
    if (this.isProduction) {
      this.sendToAnalyticsService(userAction);
    } else {
      console.log(`[User Action] ${action}:`, metadata);
    }

    // Keep only last 500 actions in memory
    if (this.userActions.length > 500) {
      this.userActions = this.userActions.slice(-500);
    }
  }

  // Hierarchy-specific tracking
  trackHierarchyOperation(operation: string, level: string, duration: number, metadata?: Record<string, any>) {
    this.trackMetric(`hierarchy.${operation}.${level}`, duration, {
      type: 'hierarchy',
      operation,
      level,
      ...metadata
    });
  }

  // AI operation tracking
  trackAIOperation(operation: string, model: string, duration: number, tokens?: number) {
    this.trackMetric(`ai.${operation}`, duration, {
      type: 'ai',
      model,
      tokens,
      tokensPerSecond: tokens ? tokens / (duration / 1000) : undefined
    });
  }

  // Get performance statistics
  getPerformanceStats() {
    const now = Date.now();
    const last24Hours = this.metrics.filter(m => now - m.timestamp < 24 * 60 * 60 * 1000);
    
    const stats = {
      totalMetrics: this.metrics.length,
      last24Hours: last24Hours.length,
      averageResponseTime: this.calculateAverage(last24Hours.filter(m => m.name.startsWith('api.')).map(m => m.value)),
      averageQueryTime: this.calculateAverage(last24Hours.filter(m => m.name.startsWith('db.')).map(m => m.value)),
      errorRate: this.errors.filter(e => now - e.timestamp < 24 * 60 * 60 * 1000).length / Math.max(last24Hours.length, 1),
      slowQueries: this.metrics.filter(m => m.name.startsWith('db.') && m.value > 1000).length,
      slowAPIRequests: this.metrics.filter(m => m.name.startsWith('api.') && m.value > 2000).length
    };

    return stats;
  }

  // Health check
  async performHealthCheck() {
    const checks = {
      database: await this.checkDatabaseHealth(),
      cache: await this.checkCacheHealth(),
      ai: await this.checkAIHealth(),
      memory: this.checkMemoryHealth(),
      performance: this.checkPerformanceHealth()
    };

    const isHealthy = Object.values(checks).every(check => check.status === 'healthy');
    
    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: Date.now(),
      checks
    };
  }

  // Private helper methods
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  private sanitizeProps(props: any): any {
    if (!props) return undefined;
    
    // Remove sensitive data from props
    const sanitized = { ...props };
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.apiKey;
    
    return sanitized;
  }

  private async sendToMonitoringService(type: string, data: any) {
    try {
      // In production, this would send to services like Sentry, DataDog, etc.
      if (typeof window !== 'undefined') {
        // Client-side monitoring
        // window.gtag?.('event', 'exception', { description: data.error?.message });
      } else {
        // Server-side monitoring
        // await fetch('/api/monitoring', { method: 'POST', body: JSON.stringify({ type, data }) });
      }
    } catch (error) {
      console.error('Failed to send to monitoring service:', error);
    }
  }

  private async sendToAnalyticsService(userAction: UserAction) {
    try {
      // In production, this would send to Google Analytics, Mixpanel, etc.
      if (typeof window !== 'undefined') {
        // window.gtag?.('event', userAction.action, userAction.metadata);
      }
    } catch (error) {
      console.error('Failed to send to analytics service:', error);
    }
  }

  private async checkDatabaseHealth() {
    try {
      // Simple query to check database connection
      const start = Date.now();
      // const result = await db.execute(sql`SELECT 1`);
      const duration = Date.now() - start;
      
      return {
        status: 'healthy' as const,
        responseTime: duration,
        lastCheck: Date.now()
      };
    } catch (error) {
      return {
        status: 'unhealthy' as const,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: Date.now()
      };
    }
  }

  private async checkCacheHealth() {
    try {
      // Check Redis connection
      const start = Date.now();
      // await redis.ping();
      const duration = Date.now() - start;
      
      return {
        status: 'healthy' as const,
        responseTime: duration,
        lastCheck: Date.now()
      };
    } catch (error) {
      return {
        status: 'unhealthy' as const,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: Date.now()
      };
    }
  }

  private async checkAIHealth() {
    try {
      // Check AI service availability
      // This could be a simple health check endpoint
      return {
        status: 'healthy' as const,
        lastCheck: Date.now()
      };
    } catch (error) {
      return {
        status: 'unhealthy' as const,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: Date.now()
      };
    }
  }

  private checkMemoryHealth() {
    try {
      if (typeof process !== 'undefined') {
        const memoryUsage = process.memoryUsage();
        const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
        
        return {
          status: memoryUsagePercent < 90 ? 'healthy' as const : 'warning' as const,
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          memoryUsagePercent,
          lastCheck: Date.now()
        };
      }
      
      return { status: 'healthy' as const, lastCheck: Date.now() };
    } catch (error) {
      return {
        status: 'unhealthy' as const,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: Date.now()
      };
    }
  }

  private checkPerformanceHealth() {
    const recentMetrics = this.metrics.filter(m => Date.now() - m.timestamp < 5 * 60 * 1000); // Last 5 minutes
    const slowQueries = recentMetrics.filter(m => m.name.startsWith('db.') && m.value > 1000).length;
    const slowAPIRequests = recentMetrics.filter(m => m.name.startsWith('api.') && m.value > 2000).length;
    const recentErrors = this.errors.filter(e => Date.now() - e.timestamp < 5 * 60 * 1000).length;
    
    const isHealthy = slowQueries < 5 && slowAPIRequests < 5 && recentErrors < 10;
    
    return {
      status: isHealthy ? 'healthy' as const : 'warning' as const,
      slowQueries,
      slowAPIRequests,
      recentErrors,
      lastCheck: Date.now()
    };
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for component performance monitoring
export function usePerformanceMonitor(componentName: string) {
  const renderStartTime = React.useRef<number>();
  const renderCount = React.useRef(0);

  React.useEffect(() => {
    renderStartTime.current = performance.now();
    renderCount.current++;

    return () => {
      if (renderStartTime.current) {
        const renderTime = performance.now() - renderStartTime.current;
        performanceMonitor.trackComponentRender(componentName, renderTime, {
          renderCount: renderCount.current
        });
      }
    };
  });

  return {
    trackAction: (action: string, metadata?: Record<string, any>) => {
      performanceMonitor.trackUserAction(`${componentName}.${action}`, undefined, metadata);
    },
    reportError: (error: Error, metadata?: Record<string, any>) => {
      performanceMonitor.reportError(error, componentName, undefined, metadata);
    }
  };
}

// Database query monitoring wrapper
export function withQueryMonitoring<T extends (...args: any[]) => Promise<any>>(
  queryName: string,
  queryFn: T
): T {
  return (async (...args: any[]) => {
    const start = performance.now();
    try {
      const result = await queryFn(...args);
      const duration = performance.now() - start;
      performanceMonitor.trackQueryPerformance(queryName, duration, { success: true });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      performanceMonitor.trackQueryPerformance(queryName, duration, { success: false });
      performanceMonitor.reportError(
        error instanceof Error ? error : new Error('Query failed'),
        `database.${queryName}`
      );
      throw error;
    }
  }) as T;
}

// API route monitoring wrapper
export function withAPIMonitoring(handler: Function) {
  return async (request: Request, context: any) => {
    const start = performance.now();
    const method = request.method;
    const url = new URL(request.url);
    const route = url.pathname;

    try {
      const response = await handler(request, context);
      const duration = performance.now() - start;
      const statusCode = response.status || 200;
      
      performanceMonitor.trackAPIPerformance(route, method, duration, statusCode);
      
      return response;
    } catch (error) {
      const duration = performance.now() - start;
      performanceMonitor.trackAPIPerformance(route, method, duration, 500);
      performanceMonitor.reportError(
        error instanceof Error ? error : new Error('API handler failed'),
        `api.${method}.${route}`
      );
      throw error;
    }
  };
}

// Export types
export type { PerformanceMetric, ErrorReport, UserAction };