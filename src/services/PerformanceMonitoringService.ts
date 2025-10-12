export interface PerformanceMetrics {
  responseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  databaseQueryTime: number;
  cacheHitRate: number;
  timestamp: number;
  endpoint?: string;
  userId?: string;
}

export interface PerformanceAlert {
  id: string;
  type: 'slow_response' | 'high_memory' | 'slow_query' | 'error_rate';
  threshold: number;
  currentValue: number;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private metrics: PerformanceMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private observers: PerformanceObserver[] = [];

  // Performance thresholds
  private readonly thresholds = {
    responseTime: 2000, // 2 seconds
    memoryUsage: 100 * 1024 * 1024, // 100MB
    databaseQueryTime: 500, // 500ms
    errorRate: 0.05 // 5%
  };

  static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance = new PerformanceMonitoringService();
    }
    return PerformanceMonitoringService.instance;
  }

  constructor() {
    this.initializeMonitoring();
  }

  /**
   * Initialize performance monitoring
   */
  private initializeMonitoring(): void {
    // Monitor navigation timing
    if ('performance' in window && 'getEntriesByType' in performance) {
      this.monitorNavigationTiming();
      this.monitorResourceTiming();
      this.monitorUserTiming();
    }

    // Monitor memory usage
    if ('memory' in performance) {
      this.monitorMemoryUsage();
    }

    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      this.monitorLongTasks();
    }

    // Start periodic monitoring
    this.startPeriodicMonitoring();
  }

  /**
   * Record custom performance metric
   */
  recordMetric(metric: Partial<PerformanceMetrics>): void {
    const fullMetric: PerformanceMetrics = {
      responseTime: 0,
      memoryUsage: this.getCurrentMemoryUsage(),
      cpuUsage: 0,
      databaseQueryTime: 0,
      cacheHitRate: 0,
      timestamp: Date.now(),
      ...metric
    };

    this.metrics.push(fullMetric);
    this.checkThresholds(fullMetric);
    this.cleanupOldMetrics();

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Performance Metric:', fullMetric);
    }
  }

  /**
   * Start timing an operation
   */
  startTiming(label: string): () => number {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric({
        responseTime: duration,
        endpoint: label
      });
      return duration;
    };
  }

  /**
   * Monitor database query performance
   */
  async monitorDatabaseQuery<T>(
    queryName: string,
    queryFunction: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await queryFunction();
      const queryTime = performance.now() - startTime;
      
      this.recordMetric({
        databaseQueryTime: queryTime,
        endpoint: `db:${queryName}`
      });

      // Log slow queries
      if (queryTime > this.thresholds.databaseQueryTime) {
        console.warn(`🐌 Slow database query: ${queryName} took ${queryTime.toFixed(2)}ms`);
      }

      return result;
    } catch (error) {
      const queryTime = performance.now() - startTime;
      this.recordMetric({
        databaseQueryTime: queryTime,
        endpoint: `db:${queryName}:error`
      });
      throw error;
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(timeRange: number = 300000): {
    averageResponseTime: number;
    averageMemoryUsage: number;
    slowestQueries: Array<{ endpoint: string; time: number }>;
    alertCount: number;
  } {
    const cutoff = Date.now() - timeRange;
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff);

    if (recentMetrics.length === 0) {
      return {
        averageResponseTime: 0,
        averageMemoryUsage: 0,
        slowestQueries: [],
        alertCount: 0
      };
    }

    const averageResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length;
    const averageMemoryUsage = recentMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / recentMetrics.length;

    const slowestQueries = recentMetrics
      .filter(m => m.endpoint && m.responseTime > 100)
      .sort((a, b) => b.responseTime - a.responseTime)
      .slice(0, 10)
      .map(m => ({ endpoint: m.endpoint!, time: m.responseTime }));

    const recentAlerts = this.alerts.filter(a => a.timestamp > cutoff);

    return {
      averageResponseTime,
      averageMemoryUsage,
      slowestQueries,
      alertCount: recentAlerts.length
    };
  }

  /**
   * Get current performance status
   */
  getCurrentStatus(): {
    status: 'good' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
  } {
    const summary = this.getPerformanceSummary();
    const issues: string[] = [];
    const recommendations: string[] = [];
    let status: 'good' | 'warning' | 'critical' = 'good';

    // Check response time
    if (summary.averageResponseTime > this.thresholds.responseTime) {
      issues.push(`Average response time is ${summary.averageResponseTime.toFixed(0)}ms (threshold: ${this.thresholds.responseTime}ms)`);
      recommendations.push('Consider optimizing slow database queries and implementing caching');
      status = 'warning';
    }

    // Check memory usage
    if (summary.averageMemoryUsage > this.thresholds.memoryUsage) {
      issues.push(`High memory usage: ${(summary.averageMemoryUsage / 1024 / 1024).toFixed(1)}MB`);
      recommendations.push('Check for memory leaks and optimize component rendering');
      status = status === 'critical' ? 'critical' : 'warning';
    }

    // Check for critical alerts
    const criticalAlerts = this.alerts.filter(a => 
      a.severity === 'critical' && 
      Date.now() - a.timestamp < 300000 // 5 minutes
    );

    if (criticalAlerts.length > 0) {
      status = 'critical';
      issues.push(`${criticalAlerts.length} critical performance alerts`);
      recommendations.push('Immediate attention required for critical performance issues');
    }

    return { status, issues, recommendations };
  }

  /**
   * Export performance data for analysis
   */
  exportPerformanceData(timeRange: number = 3600000): string {
    const cutoff = Date.now() - timeRange;
    const data = {
      metrics: this.metrics.filter(m => m.timestamp > cutoff),
      alerts: this.alerts.filter(a => a.timestamp > cutoff),
      summary: this.getPerformanceSummary(timeRange),
      exportedAt: new Date().toISOString()
    };

    return JSON.stringify(data, null, 2);
  }

  // Private monitoring methods
  private monitorNavigationTiming(): void {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigation) {
      const loadTime = navigation.loadEventEnd - navigation.navigationStart;
      const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.navigationStart;
      
      this.recordMetric({
        responseTime: loadTime,
        endpoint: 'page:load'
      });

      if (loadTime > 3000) {
        this.createAlert('slow_response', this.thresholds.responseTime, loadTime, 'high');
      }
    }
  }

  private monitorResourceTiming(): void {
    const resources = performance.getEntriesByType('resource');
    
    resources.forEach(resource => {
      const duration = resource.duration;
      
      if (duration > 1000) { // Resources taking more than 1 second
        this.recordMetric({
          responseTime: duration,
          endpoint: `resource:${resource.name.split('/').pop()}`
        });
      }
    });
  }

  private monitorUserTiming(): void {
    const measures = performance.getEntriesByType('measure');
    
    measures.forEach(measure => {
      this.recordMetric({
        responseTime: measure.duration,
        endpoint: `measure:${measure.name}`
      });
    });
  }

  private monitorMemoryUsage(): void {
    const memory = (performance as any).memory;
    
    if (memory) {
      const usage = memory.usedJSHeapSize;
      
      this.recordMetric({
        memoryUsage: usage,
        endpoint: 'memory:heap'
      });

      if (usage > this.thresholds.memoryUsage) {
        this.createAlert('high_memory', this.thresholds.memoryUsage, usage, 'warning');
      }
    }
  }

  private monitorLongTasks(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) { // Tasks longer than 50ms
            this.recordMetric({
              responseTime: entry.duration,
              endpoint: 'longtask'
            });

            console.warn(`🐌 Long task detected: ${entry.duration.toFixed(2)}ms`);
          }
        });
      });

      observer.observe({ entryTypes: ['longtask'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Long task monitoring not supported');
    }
  }

  private startPeriodicMonitoring(): void {
    setInterval(() => {
      this.recordMetric({
        memoryUsage: this.getCurrentMemoryUsage(),
        endpoint: 'periodic:memory'
      });
    }, 30000); // Every 30 seconds
  }

  private getCurrentMemoryUsage(): number {
    const memory = (performance as any).memory;
    return memory ? memory.usedJSHeapSize : 0;
  }

  private checkThresholds(metric: PerformanceMetrics): void {
    if (metric.responseTime > this.thresholds.responseTime) {
      this.createAlert('slow_response', this.thresholds.responseTime, metric.responseTime, 'warning');
    }

    if (metric.memoryUsage > this.thresholds.memoryUsage) {
      this.createAlert('high_memory', this.thresholds.memoryUsage, metric.memoryUsage, 'warning');
    }

    if (metric.databaseQueryTime > this.thresholds.databaseQueryTime) {
      this.createAlert('slow_query', this.thresholds.databaseQueryTime, metric.databaseQueryTime, 'medium');
    }
  }

  private createAlert(
    type: PerformanceAlert['type'],
    threshold: number,
    currentValue: number,
    severity: PerformanceAlert['severity']
  ): void {
    const alert: PerformanceAlert = {
      id: `${type}-${Date.now()}`,
      type,
      threshold,
      currentValue,
      timestamp: Date.now(),
      severity
    };

    this.alerts.push(alert);
    
    // Log alert
    console.warn(`⚠️ Performance Alert: ${type} - ${currentValue} exceeds threshold ${threshold}`);
    
    // Clean up old alerts
    this.cleanupOldAlerts();
  }

  private cleanupOldMetrics(): void {
    const cutoff = Date.now() - 3600000; // Keep 1 hour of metrics
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
  }

  private cleanupOldAlerts(): void {
    const cutoff = Date.now() - 3600000; // Keep 1 hour of alerts
    this.alerts = this.alerts.filter(a => a.timestamp > cutoff);
  }

  /**
   * Cleanup observers when service is destroyed
   */
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}