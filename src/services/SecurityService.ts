import { supabase } from '@/integrations/supabase/client';

export interface SecurityEvent {
  id?: string;
  user_id: string;
  event_type: 'login_attempt' | 'failed_login' | 'data_access' | 'data_modification' | 'suspicious_activity';
  description: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at?: string;
}

export interface AuditLog {
  id?: string;
  user_id: string;
  action: string;
  resource_type: 'tenant' | 'property' | 'unit' | 'payment' | 'maintenance';
  resource_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at?: string;
}

export class SecurityService {
  private static instance: SecurityService;
  private failedLoginAttempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  /**
   * Logs security events for monitoring and analysis
   */
  async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'created_at'>): Promise<void> {
    try {
      const eventData: SecurityEvent = {
        ...event,
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent,
        created_at: new Date().toISOString()
      };

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('🔒 Security Event:', eventData);
      }

      // In production, send to monitoring service
      if (process.env.NODE_ENV === 'production') {
        await this.sendToMonitoringService(eventData);
      }

      // Store in local storage for immediate access
      this.storeSecurityEventLocally(eventData);

    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Logs audit trail for data access and modifications
   */
  async logAuditEvent(audit: Omit<AuditLog, 'id' | 'created_at'>): Promise<void> {
    try {
      const auditData: AuditLog = {
        ...audit,
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent,
        created_at: new Date().toISOString()
      };

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        // Removed console.log for security
      }

      // Store audit log
      this.storeAuditLogLocally(auditData);

    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }

  /**
   * Validates user session and checks for suspicious activity
   */
  async validateSession(): Promise<boolean> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        await this.logSecurityEvent({
          user_id: 'anonymous',
          event_type: 'suspicious_activity',
          description: 'Invalid session access attempt',
          severity: 'medium'
        });
        return false;
      }

      // Check session age
      const sessionAge = Date.now() - new Date(session.created_at).getTime();
      const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours

      if (sessionAge > maxSessionAge) {
        await this.logSecurityEvent({
          user_id: session.user.id,
          event_type: 'suspicious_activity',
          description: 'Session expired',
          severity: 'low'
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Session validation failed:', error);
      return false;
    }
  }

  /**
   * Checks for brute force login attempts
   */
  checkLoginAttempts(identifier: string): boolean {
    const attempts = this.failedLoginAttempts.get(identifier);
    
    if (!attempts) {
      return true; // No previous attempts
    }

    const now = Date.now();
    
    // Reset if lockout period has passed
    if (now - attempts.lastAttempt > this.LOCKOUT_DURATION) {
      this.failedLoginAttempts.delete(identifier);
      return true;
    }

    // Check if max attempts exceeded
    return attempts.count < this.MAX_LOGIN_ATTEMPTS;
  }

  /**
   * Records a failed login attempt
   */
  async recordFailedLogin(identifier: string, userId?: string): Promise<void> {
    const attempts = this.failedLoginAttempts.get(identifier) || { count: 0, lastAttempt: 0 };
    attempts.count++;
    attempts.lastAttempt = Date.now();
    
    this.failedLoginAttempts.set(identifier, attempts);

    await this.logSecurityEvent({
      user_id: userId || 'anonymous',
      event_type: 'failed_login',
      description: `Failed login attempt ${attempts.count}/${this.MAX_LOGIN_ATTEMPTS}`,
      severity: attempts.count >= this.MAX_LOGIN_ATTEMPTS ? 'high' : 'medium',
      metadata: { identifier, attempt_count: attempts.count }
    });
  }

  /**
   * Records a successful login
   */
  async recordSuccessfulLogin(userId: string, identifier: string): Promise<void> {
    // Clear failed attempts on successful login
    this.failedLoginAttempts.delete(identifier);

    await this.logSecurityEvent({
      user_id: userId,
      event_type: 'login_attempt',
      description: 'Successful login',
      severity: 'low'
    });
  }

  /**
   * Validates data access permissions
   */
  async validateDataAccess(userId: string, resourceType: string, resourceId: string, action: string): Promise<boolean> {
    try {
      // Log data access attempt
      await this.logAuditEvent({
        user_id: userId,
        action: `${action}_${resourceType}`,
        resource_type: resourceType as any,
        resource_id: resourceId
      });

      // Implement role-based access control
      const hasPermission = await this.checkUserPermissions(userId, resourceType, action);
      
      if (!hasPermission) {
        await this.logSecurityEvent({
          user_id: userId,
          event_type: 'suspicious_activity',
          description: `Unauthorized ${action} attempt on ${resourceType}`,
          severity: 'high',
          metadata: { resource_type: resourceType, resource_id: resourceId, action }
        });
      }

      return hasPermission;
    } catch (error) {
      console.error('Data access validation failed:', error);
      return false;
    }
  }

  /**
   * Sanitizes user input to prevent XSS and injection attacks
   */
  sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .replace(/[<>]/g, '')
        .trim();
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    
    return input;
  }

  /**
   * Validates CSRF token
   */
  validateCSRFToken(token: string): boolean {
    const storedToken = sessionStorage.getItem('csrf_token');
    return storedToken === token;
  }

  /**
   * Generates CSRF token
   */
  generateCSRFToken(): string {
    const token = crypto.randomUUID();
    sessionStorage.setItem('csrf_token', token);
    return token;
  }

  /**
   * Checks for suspicious patterns in user behavior
   */
  async detectSuspiciousActivity(userId: string, action: string, metadata?: Record<string, any>): Promise<void> {
    const suspiciousPatterns = [
      // Rapid successive requests
      { pattern: 'rapid_requests', threshold: 10, timeWindow: 60000 }, // 10 requests in 1 minute
      // Multiple failed operations
      { pattern: 'failed_operations', threshold: 5, timeWindow: 300000 }, // 5 failures in 5 minutes
      // Unusual access patterns
      { pattern: 'unusual_access', threshold: 3, timeWindow: 3600000 } // 3 unusual accesses in 1 hour
    ];

    for (const pattern of suspiciousPatterns) {
      const isDetected = await this.checkPattern(userId, action, pattern);
      
      if (isDetected) {
        await this.logSecurityEvent({
          user_id: userId,
          event_type: 'suspicious_activity',
          description: `Suspicious pattern detected: ${pattern.pattern}`,
          severity: 'high',
          metadata: { pattern: pattern.pattern, action, ...metadata }
        });
        
        // In production, trigger additional security measures
        if (process.env.NODE_ENV === 'production') {
          await this.triggerSecurityMeasures(userId, pattern.pattern);
        }
      }
    }
  }

  /**
   * Encrypts sensitive data before storage
   */
  async encryptSensitiveData(data: string): Promise<string> {
    try {
      // In production, use proper encryption service
      if (process.env.NODE_ENV === 'production') {
        // Implement actual encryption here
        return btoa(data); // Base64 encoding as placeholder
      }
      
      return data; // No encryption in development
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt sensitive data');
    }
  }

  /**
   * Decrypts sensitive data
   */
  async decryptSensitiveData(encryptedData: string): Promise<string> {
    try {
      // In production, use proper decryption service
      if (process.env.NODE_ENV === 'production') {
        // Implement actual decryption here
        return atob(encryptedData); // Base64 decoding as placeholder
      }
      
      return encryptedData; // No decryption in development
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt sensitive data');
    }
  }

  // Private helper methods
  private async getClientIP(): Promise<string> {
    try {
      // In production, get real client IP
      return 'localhost'; // Placeholder
    } catch (error) {
      return 'unknown';
    }
  }

  private async sendToMonitoringService(event: SecurityEvent): Promise<void> {
    // In production, send to external monitoring service like Sentry
    // Removed console.log for security
  }

  private storeSecurityEventLocally(event: SecurityEvent): void {
    try {
      const events = JSON.parse(localStorage.getItem('security_events') || '[]');
      events.push(event);
      
      // Keep only last 100 events
      if (events.length > 100) {
        events.splice(0, events.length - 100);
      }
      
      localStorage.setItem('security_events', JSON.stringify(events));
    } catch (error) {
      console.error('Failed to store security event locally:', error);
    }
  }

  private storeAuditLogLocally(audit: AuditLog): void {
    try {
      const logs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
      logs.push(audit);
      
      // Keep only last 100 logs
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }
      
      localStorage.setItem('audit_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to store audit log locally:', error);
    }
  }

  private async checkUserPermissions(userId: string, resourceType: string, action: string): Promise<boolean> {
    try {
      // Get user role from Supabase
      const { data: userRole, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error || !userRole) {
        return false;
      }

      // Define permissions based on role
      const permissions = {
        landlord_premium: ['create', 'read', 'update', 'delete'],
        landlord_free: ['create', 'read', 'update', 'delete'], // Limited by other means
        tenant: ['read']
      };

      const userPermissions = permissions[userRole.role as keyof typeof permissions] || [];
      return userPermissions.includes(action);
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  }

  private async checkPattern(userId: string, action: string, pattern: any): Promise<boolean> {
    // Simplified pattern detection - in production, use more sophisticated analysis
    const key = `${userId}:${action}:${pattern.pattern}`;
    const stored = localStorage.getItem(key);
    const events: number[] = stored ? JSON.parse(stored) : [];
    
    const now = Date.now();
    const recentEvents = events.filter(timestamp => now - timestamp < pattern.timeWindow);
    
    recentEvents.push(now);
    localStorage.setItem(key, JSON.stringify(recentEvents));
    
    return recentEvents.length >= pattern.threshold;
  }

  private async triggerSecurityMeasures(userId: string, pattern: string): Promise<void> {
    // In production, implement security measures like:
    // - Temporary account suspension
    // - Additional authentication requirements
    // - Rate limiting
    // - Admin notifications
    console.warn(`Security measures triggered for user ${userId}, pattern: ${pattern}`);
  }
}
