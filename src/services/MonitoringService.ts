import { PerformanceMonitoringService } from './PerformanceMonitoringService';
import { SecurityService } from './SecurityService';
import { ErrorHandlingService } from './ErrorHandlingService';

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: HealthCheck[];
  timestamp: string;
  uptime: number;
  version: string;
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  duration: number;
  message?: string;
  metadata?: Record<string, any>;
}

export interface Alert {
  id: string;
  type: 'performance' | 'security' | 'error' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  resolved: boolean;
  metadata?: Record<string, any>;
}

export class MonitoringService {
  private static instance: MonitoringService;
  private performanceService: PerformanceMonitoringService;
  private securityService: SecurityService;
  private errorService: ErrorHandlingService;
  private alerts: Alert[] = [];
  private healthChecks: Map<string, HealthCheck> = new Map();
  private startTime: number = Date.now();

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  constructor() {
    this.performanceService = PerformanceMonitoringService.getInstance();
    this.securityService = SecurityService.getInstance();
    this.errorService = ErrorHandlingService.getInstance();
    
    this.initializeMonitoring();
  }

  /**
   * Performs comprehensive system health check
   */
  async performHealthCheck(): Promise<SystemHealth> {
    const checks: HealthCheck[] = [];
    
    // Database connectivity check
    checks.push(await this.checkDatabaseHealth());
    
    // Authentication service check
    checks.push(await this.checkAuthHealth());
    
    // Performance metrics check
    checks.push(await this.checkPerformanceHealth());
    
    // Memory usage check
    checks.push(await this.checkMemoryHealth());
    
    // Error rate check
    checks.push(await this.checkErrorRateHealth());
    
    // Security status check
    checks.push(await this.checkSecurityHealth());

    // Determine overall status
    const failedChecks = checks.filter(check => check.status === 'fail');
    const warnChecks = checks.filter(check => check.status === 'warn');
    
    let status: SystemHealth['status'] = 'healthy';
    if (failedChecks.length > 0) {
      status = 'unhealthy';
    } else if (warnChecks.length > 0) {
      status = 'degraded';
    }

    const health: SystemHealth = {
      status,
      checks,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      version: process.env.npm_package_version || '1.0.0'
    };

    // Store health check results
    this.storeHealthCheck(health);
    
    // Generate alerts if needed
    await this.generateHealthAlerts(health);

    return health;
  }

  /**
   * Creates and manages system alerts
   */
  async createAlert(alert: Omit<Alert, 'id' | 'timestamp' | 'resolved'>): Promise<Alert> {
    const newAlert: Alert = {
      ...alert,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      resolved: false
    };

    this.alerts.push(newAlert);
    
    // Log alert
    console.warn('🚨 System Alert:', newAlert);
    
    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      await this.sendAlertToMonitoringService(newAlert);
    }
    
    // Trigger immediate actions for critical alerts
    if (newAlert.severity === 'critical') {
      await this.handleCriticalAlert(newAlert);
    }

    return newAlert;
  }

  /**
   * Resolves an alert
   */
  async resolveAlert(alertId: string, resolution?: string): Promise<void> {
    const alert = this.alerts.find(a => a.id === alertId);
    
    if (alert) {
      alert.resolved = true;
      alert.metadata = {
        ...alert.metadata,
        resolvedAt: new Date().toISOString(),
        resolution
      };

      console.log('✅ Alert resolved:', alert);
    }
  }

  /**
   * Gets current system metrics
   */
  async getSystemMetrics(): Promise<{
    performance: any;
    security: any;
    errors: any;
    health: SystemHealth;
    alerts: Alert[];
  }> {
    const [health, performanceMetrics, errorStats] = await Promise.all([
      this.performHealthCheck(),
      this.performanceService.getMetrics(),
      this.errorService.getErrorStatistics()
    ]);

    return {
      performance: performanceMetrics,
      security: {
        events: JSON.parse(localStorage.getItem('security_events') || '[]').slice(-10),
        audits: JSON.parse(localStorage.getItem('audit_logs') || '[]').slice(-10)
      },
      errors: errorStats,
      health,
      alerts: this.alerts.filter(a => !a.resolved).slice(-20)
    };
  }

  /**
   * Starts continuous monitoring
   */
  startMonitoring(): void {
    // Perform health checks every 5 minutes
    setInterval(async () => {
      await this.performHealthCheck();
    }, 5 * 60 * 1000);

    // Check for performance issues every minute
    setInterval(async () => {
      await this.checkPerformanceAlerts();
    }, 60 * 1000);

    // Clean up old data every hour
    setInterval(() => {
      this.cleanupOldData();
    }, 60 * 60 * 1000);

    console.log('🔍 Monitoring service started');
  }

  /**
   * Stops monitoring
   */
  stopMonitoring(): void {
    // Clear intervals would be stored in instance variables in production
    console.log('🔍 Monitoring service stopped');
  }

  // Private health check methods
  private async checkDatabaseHealth(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Simple query to test database connectivity
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      const duration = Date.now() - startTime;

      if (error) {
        return {
          name: 'database',
          status: 'fail',
          duration,
          message: `Database error: ${error.message}`
        };
      }

      if (duration > 1000) {
        return {
          name: 'database',
          status: 'warn',
          duration,
          message: 'Database response time is slow'
        };
      }

      return {
        name: 'database',
        status: 'pass',
        duration,
        message: 'Database is responsive'
      };
    } catch (error) {
      return {
        name: 'database',
        status: 'fail',
        duration: Date.now() - startTime,
        message: `Database connection failed: ${(error as Error).message}`
      };
    }
  }

  private async checkAuthHealth(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Check auth service
      const { data, error } = await supabase.auth.getSession();
      const duration = Date.now() - startTime;

      if (error) {
        return {
          name: 'authentication',
          status: 'fail',
          duration,
          message: `Auth service error: ${error.message}`
        };
      }

      return {
        name: 'authentication',
        status: 'pass',
        duration,
        message: 'Authentication service is working'
      };
    } catch (error) {
      return {
        name: 'authentication',
        status: 'fail',
        duration: Date.now() - startTime,
        message: `Auth service failed: ${(error as Error).message}`
      };
    }
  }

  private async checkPerformanceHealth(): Promise<HealthCheck> {
    const metrics = await this.performanceService.getMetrics();
    
    const avgResponseTime = metrics.averageResponseTime || 0;
    const memoryUsage = metrics.memoryUsage || 0;

    if (avgResponseTime > 2000) {
      return {
        name: 'performance',
        status: 'fail',
        duration: avgResponseTime,
        message: 'Response times are too slow',
        metadata: { avgResponseTime, memoryUsage }
      };
    }

    if (avgResponseTime > 1000 || memoryUsage > 100) {
      return {
        name: 'performance',
        status: 'warn',
        duration: avgResponseTime,
        message: 'Performance is degraded',
        metadata: { avgResponseTime, memoryUsage }
      };
    }

    return {
      name: 'performance',
      status: 'pass',
      duration: avgResponseTime,
      message: 'Performance is good',
      metadata: { avgResponseTime, memoryUsage }
    };
  }

  private async checkMemoryHealth(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // Check memory usage if available
      const memoryInfo = (performance as any).memory;
      
      if (memoryInfo) {
        const usedMemory = memoryInfo.usedJSHeapSize / 1024 / 1024; // MB
        const totalMemory = memoryInfo.totalJSHeapSize / 1024 / 1024; // MB
        const memoryUsage = (usedMemory / totalMemory) * 100;

        if (memoryUsage > 90) {
          return {
            name: 'memory',
            status: 'fail',
            duration: Date.now() - startTime,
            message: 'Memory usage is critically high',
            metadata: { usedMemory, totalMemory, memoryUsage }
          };
        }

        if (memoryUsage > 70) {
          return {
            name: 'memory',
            status: 'warn',
            duration: Date.now() - startTime,
            message: 'Memory usage is high',
            metadata: { usedMemory, totalMemory, memoryUsage }
          };
        }

        return {
          name: 'memory',
          status: 'pass',
          duration: Date.now() - startTime,
          message: 'Memory usage is normal',
          metadata: { usedMemory, totalMemory, memoryUsage }
        };
      }

      return {
        name: 'memory',
        status: 'pass',
        duration: Date.now() - startTime,
        message: 'Memory monitoring not available'
      };
    } catch (error) {
      return {
        name: 'memory',
        status: 'warn',
        duration: Date.now() - startTime,
        message: 'Memory check failed'
      };
    }
  }

  private async checkErrorRateHealth(): Promise<HealthCheck> {
    const startTime = Date.now();
    const errorStats = this.errorService.getErrorStatistics();
    
    const criticalErrors = errorStats.errorsBySeverity.critical || 0;
    const highErrors = errorStats.errorsBySeverity.high || 0;
    const totalErrors = errorStats.totalErrors;

    if (criticalErrors > 0) {
      return {
        name: 'error_rate',
        status: 'fail',
        duration: Date.now() - startTime,
        message: `${criticalErrors} critical errors detected`,
        metadata: errorStats
      };
    }

    if (highErrors > 5 || totalErrors > 20) {
      return {
        name: 'error_rate',
        status: 'warn',
        duration: Date.now() - startTime,
        message: 'High error rate detected',
        metadata: errorStats
      };
    }

    return {
      name: 'error_rate',
      status: 'pass',
      duration: Date.now() - startTime,
      message: 'Error rate is normal',
      metadata: errorStats
    };
  }

  private async checkSecurityHealth(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const securityEvents = JSON.parse(localStorage.getItem('security_events') || '[]');
      const recentHighSeverityEvents = securityEvents.filter((event: any) => 
        event.severity === 'high' || event.severity === 'critical'
      ).filter((event: any) => 
        Date.now() - new Date(event.created_at).getTime() < 60 * 60 * 1000 // Last hour
      );

      if (recentHighSeverityEvents.length > 3) {
        return {
          name: 'security',
          status: 'fail',
          duration: Date.now() - startTime,
          message: `${recentHighSeverityEvents.length} high-severity security events in the last hour`,
          metadata: { recentEvents: recentHighSeverityEvents.length }
        };
      }

      if (recentHighSeverityEvents.length > 0) {
        return {
          name: 'security',
          status: 'warn',
          duration: Date.now() - startTime,
          message: `${recentHighSeverityEvents.length} security events detected`,
          metadata: { recentEvents: recentHighSeverityEvents.length }
        };
      }

      return {
        name: 'security',
        status: 'pass',
        duration: Date.now() - startTime,
        message: 'No security issues detected',
        metadata: { totalEvents: securityEvents.length }
      };
    } catch (error) {
      return {
        name: 'security',
        status: 'warn',
        duration: Date.now() - startTime,
        message: 'Security check failed'
      };
    }
  }

  private initializeMonitoring(): void {
    // Set up performance monitoring
    this.performanceService.startMonitoring();
    
    // Set up error monitoring
    this.setupErrorMonitoring();
    
    // Set up resource monitoring
    this.setupResourceMonitoring();
    
    console.log('🔍 Comprehensive monitoring initialized');
  }

  private setupErrorMonitoring(): void {
    // Monitor error patterns and create alerts
    setInterval(async () => {
      const errorStats = this.errorService.getErrorStatistics();
      
      // Check for error spikes
      if (errorStats.errorsBySeverity.critical > 0) {
        await this.createAlert({
          type: 'error',
          severity: 'critical',
          title: 'Critical Errors Detected',
          description: `${errorStats.errorsBySeverity.critical} critical errors in the system`,
          metadata: errorStats
        });
      }
      
      if (errorStats.totalErrors > 50) {
        await this.createAlert({
          type: 'error',
          severity: 'high',
          title: 'High Error Rate',
          description: `${errorStats.totalErrors} total errors detected`,
          metadata: errorStats
        });
      }
    }, 2 * 60 * 1000); // Check every 2 minutes
  }

  private setupResourceMonitoring(): void {
    // Monitor system resources
    setInterval(async () => {
      const memoryInfo = (performance as any).memory;
      
      if (memoryInfo) {
        const usedMemory = memoryInfo.usedJSHeapSize / 1024 / 1024; // MB
        const totalMemory = memoryInfo.totalJSHeapSize / 1024 / 1024; // MB
        const memoryUsage = (usedMemory / totalMemory) * 100;

        if (memoryUsage > 90) {
          await this.createAlert({
            type: 'system',
            severity: 'critical',
            title: 'Critical Memory Usage',
            description: `Memory usage is at ${memoryUsage.toFixed(1)}%`,
            metadata: { usedMemory, totalMemory, memoryUsage }
          });
        } else if (memoryUsage > 75) {
          await this.createAlert({
            type: 'system',
            severity: 'high',
            title: 'High Memory Usage',
            description: `Memory usage is at ${memoryUsage.toFixed(1)}%`,
            metadata: { usedMemory, totalMemory, memoryUsage }
          });
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  private async checkPerformanceAlerts(): Promise<void> {
    const metrics = await this.performanceService.getMetrics();
    
    // Check response time alerts
    if (metrics.averageResponseTime > 3000) {
      await this.createAlert({
        type: 'performance',
        severity: 'high',
        title: 'Slow Response Times',
        description: `Average response time is ${metrics.averageResponseTime}ms`,
        metadata: metrics
      });
    }
    
    // Check cache hit rate alerts
    if (metrics.cacheHitRate < 50) {
      await this.createAlert({
        type: 'performance',
        severity: 'medium',
        title: 'Low Cache Hit Rate',
        description: `Cache hit rate is ${metrics.cacheHitRate}%`,
        metadata: metrics
      });
    }
  }

  private async generateHealthAlerts(health: SystemHealth): Promise<void> {
    if (health.status === 'unhealthy') {
      const failedChecks = health.checks.filter(check => check.status === 'fail');
      
      await this.createAlert({
        type: 'system',
        severity: 'critical',
        title: 'System Health Critical',
        description: `${failedChecks.length} health checks failed`,
        metadata: { failedChecks: failedChecks.map(c => c.name) }
      });
    } else if (health.status === 'degraded') {
      const warnChecks = health.checks.filter(check => check.status === 'warn');
      
      await this.createAlert({
        type: 'system',
        severity: 'medium',
        title: 'System Health Degraded',
        description: `${warnChecks.length} health checks showing warnings`,
        metadata: { warnChecks: warnChecks.map(c => c.name) }
      });
    }
  }

  private async handleCriticalAlert(alert: Alert): Promise<void> {
    // In production, implement critical alert handling:
    // - Send notifications to administrators
    // - Trigger automatic recovery procedures
    // - Scale resources if needed
    // - Activate fallback systems
    
    console.error('🚨 CRITICAL ALERT:', alert);
    
    // For now, just log and store
    this.storeCriticalAlert(alert);
  }

  private storeHealthCheck(health: SystemHealth): void {
    try {
      const healthHistory = JSON.parse(localStorage.getItem('health_history') || '[]');
      healthHistory.push(health);
      
      // Keep only last 24 health checks
      if (healthHistory.length > 24) {
        healthHistory.splice(0, healthHistory.length - 24);
      }
      
      localStorage.setItem('health_history', JSON.stringify(healthHistory));
    } catch (error) {
      console.error('Failed to store health check:', error);
    }
  }

  private storeCriticalAlert(alert: Alert): void {
    try {
      const criticalAlerts = JSON.parse(localStorage.getItem('critical_alerts') || '[]');
      criticalAlerts.push(alert);
      
      // Keep only last 10 critical alerts
      if (criticalAlerts.length > 10) {
        criticalAlerts.splice(0, criticalAlerts.length - 10);
      }
      
      localStorage.setItem('critical_alerts', JSON.stringify(criticalAlerts));
    } catch (error) {
      console.error('Failed to store critical alert:', error);
    }
  }

  private cleanupOldData(): void {
    try {
      // Clean up old alerts (keep only last 7 days)
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      this.alerts = this.alerts.filter(alert => 
        new Date(alert.timestamp).getTime() > sevenDaysAgo
      );

      // Clean up old health checks
      const healthHistory = JSON.parse(localStorage.getItem('health_history') || '[]');
      const recentHealth = healthHistory.filter((health: any) => 
        new Date(health.timestamp).getTime() > sevenDaysAgo
      );
      localStorage.setItem('health_history', JSON.stringify(recentHealth));

      console.log('🧹 Old monitoring data cleaned up');
    } catch (error) {
      console.error('Failed to cleanup old data:', error);
    }
  }

  private async sendAlertToMonitoringService(alert: Alert): Promise<void> {
    // In production, send to external monitoring service like PagerDuty, Slack, etc.
    console.log('Would send alert to monitoring service:', alert);
  }
}