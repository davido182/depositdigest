import { supabase } from '@/integrations/supabase/client';
import { SecurityService } from './SecurityService';

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxAge: number; // days
}

export interface SessionConfig {
  maxAge: number; // milliseconds
  renewThreshold: number; // milliseconds before expiry to renew
  maxConcurrentSessions: number;
}

export class AuthSecurityService {
  private static instance: AuthSecurityService;
  private securityService: SecurityService;
  
  private readonly passwordPolicy: PasswordPolicy = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxAge: 90 // 90 days
  };

  private readonly sessionConfig: SessionConfig = {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    renewThreshold: 2 * 60 * 60 * 1000, // 2 hours
    maxConcurrentSessions: 3
  };

  static getInstance(): AuthSecurityService {
    if (!AuthSecurityService.instance) {
      AuthSecurityService.instance = new AuthSecurityService();
    }
    return AuthSecurityService.instance;
  }

  constructor() {
    this.securityService = SecurityService.getInstance();
  }

  /**
   * Validates password against security policy
   */
  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < this.passwordPolicy.minLength) {
      errors.push(`Password must be at least ${this.passwordPolicy.minLength} characters long`);
    }

    if (this.passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (this.passwordPolicy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (this.passwordPolicy.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (this.passwordPolicy.requireSpecialChars && !/[!@#$%^&*(),.?\":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check for common weak passwords
    const commonPasswords = [
      'password', '123456', 'password123', 'admin', 'qwerty',
      'letmein', 'welcome', 'monkey', '1234567890'
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common and easily guessable');
    }

    // Check for sequential characters
    if (this.hasSequentialChars(password)) {
      errors.push('Password should not contain sequential characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Secure login with enhanced security checks
   */
  async secureLogin(email: string, password: string): Promise<{ success: boolean; error?: string; requiresMFA?: boolean }> {
    try {
      // Sanitize inputs
      const sanitizedEmail = this.securityService.sanitizeInput(email).toLowerCase();
      
      // Check for brute force attempts
      if (!this.securityService.checkLoginAttempts(sanitizedEmail)) {
        await this.securityService.recordFailedLogin(sanitizedEmail);
        return {
          success: false,
          error: 'Too many failed login attempts. Please try again later.'
        };
      }

      // Validate email format
      if (!this.isValidEmail(sanitizedEmail)) {
        await this.securityService.recordFailedLogin(sanitizedEmail);
        return {
          success: false,
          error: 'Invalid email format'
        };
      }

      // Attempt login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password: password
      });

      if (error) {
        await this.securityService.recordFailedLogin(sanitizedEmail);
        await this.securityService.logSecurityEvent({
          user_id: 'anonymous',
          event_type: 'failed_login',
          description: `Login failed for ${sanitizedEmail}: ${error.message}`,
          severity: 'medium',
          metadata: { email: sanitizedEmail, error: error.message }
        });

        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      if (data.user) {
        // Record successful login
        await this.securityService.recordSuccessfulLogin(data.user.id, sanitizedEmail);
        
        // Check if MFA is required (placeholder for future implementation)
        const requiresMFA = await this.checkMFARequirement(data.user.id);
        
        if (requiresMFA) {
          return {
            success: false,
            requiresMFA: true
          };
        }

        // Initialize session security
        await this.initializeSecureSession(data.user.id);

        return { success: true };
      }

      return {
        success: false,
        error: 'Login failed'
      };

    } catch (error) {
      console.error('Secure login error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred'
      };
    }
  }

  /**
   * Secure registration with enhanced validation
   */
  async secureRegister(email: string, password: string, userData: any): Promise<{ success: boolean; error?: string }> {
    try {
      // Sanitize inputs
      const sanitizedEmail = this.securityService.sanitizeInput(email).toLowerCase();
      const sanitizedUserData = this.securityService.sanitizeInput(userData);

      // Validate email
      if (!this.isValidEmail(sanitizedEmail)) {
        return {
          success: false,
          error: 'Invalid email format'
        };
      }

      // Validate password
      const passwordValidation = this.validatePassword(password);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: passwordValidation.errors.join('. ')
        };
      }

      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', sanitizedEmail)
        .single();

      if (existingUser) {
        return {
          success: false,
          error: 'Email address is already registered'
        };
      }

      // Register user
      const { data, error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password: password,
        options: {
          data: sanitizedUserData
        }
      });

      if (error) {
        await this.securityService.logSecurityEvent({
          user_id: 'anonymous',
          event_type: 'suspicious_activity',
          description: `Registration failed for ${sanitizedEmail}: ${error.message}`,
          severity: 'medium',
          metadata: { email: sanitizedEmail, error: error.message }
        });

        return {
          success: false,
          error: error.message
        };
      }

      if (data.user) {
        await this.securityService.logSecurityEvent({
          user_id: data.user.id,
          event_type: 'login_attempt',
          description: 'User registered successfully',
          severity: 'low',
          metadata: { email: sanitizedEmail }
        });

        return { success: true };
      }

      return {
        success: false,
        error: 'Registration failed'
      };

    } catch (error) {
      console.error('Secure registration error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred'
      };
    }
  }

  /**
   * Validates current session and renews if necessary
   */
  async validateAndRenewSession(): Promise<boolean> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        return false;
      }

      // Check session age
      const sessionAge = Date.now() - new Date(session.created_at).getTime();
      
      if (sessionAge > this.sessionConfig.maxAge) {
        await this.secureLogout();
        return false;
      }

      // Renew session if close to expiry
      const timeToExpiry = this.sessionConfig.maxAge - sessionAge;
      if (timeToExpiry < this.sessionConfig.renewThreshold) {
        const { error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('Session refresh failed:', refreshError);
          await this.secureLogout();
          return false;
        }

        await this.securityService.logSecurityEvent({
          user_id: session.user.id,
          event_type: 'login_attempt',
          description: 'Session renewed',
          severity: 'low'
        });
      }

      return true;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  }

  /**
   * Secure logout with cleanup
   */
  async secureLogout(): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        await this.securityService.logSecurityEvent({
          user_id: session.user.id,
          event_type: 'login_attempt',
          description: 'User logged out',
          severity: 'low'
        });
      }

      // Clear session
      await supabase.auth.signOut();

      // Clear sensitive data from storage
      this.clearSensitiveStorage();

    } catch (error) {
      console.error('Secure logout error:', error);
    }
  }

  /**
   * Changes password with security validation
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return {
          success: false,
          error: 'Not authenticated'
        };
      }

      // Validate new password
      const passwordValidation = this.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: passwordValidation.errors.join('. ')
        };
      }

      // Check if new password is different from current
      if (currentPassword === newPassword) {
        return {
          success: false,
          error: 'New password must be different from current password'
        };
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        await this.securityService.logSecurityEvent({
          user_id: session.user.id,
          event_type: 'suspicious_activity',
          description: `Password change failed: ${error.message}`,
          severity: 'medium'
        });

        return {
          success: false,
          error: error.message
        };
      }

      await this.securityService.logSecurityEvent({
        user_id: session.user.id,
        event_type: 'data_modification',
        description: 'Password changed successfully',
        severity: 'low'
      });

      return { success: true };

    } catch (error) {
      console.error('Password change error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred'
      };
    }
  }

  /**
   * Checks if user account is locked
   */
  async isAccountLocked(userId: string): Promise<boolean> {
    try {
      // Check for recent security events that might indicate account compromise
      const events = JSON.parse(localStorage.getItem('security_events') || '[]');
      const recentEvents = events.filter((event: any) => 
        event.user_id === userId && 
        event.severity === 'high' &&
        Date.now() - new Date(event.created_at).getTime() < 60 * 60 * 1000 // 1 hour
      );

      return recentEvents.length >= 3; // Lock after 3 high-severity events
    } catch (error) {
      console.error('Account lock check error:', error);
      return false;
    }
  }

  // Private helper methods
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  private hasSequentialChars(password: string): boolean {
    const sequences = ['123', 'abc', 'qwe', 'asd', 'zxc'];
    const lowerPassword = password.toLowerCase();
    
    return sequences.some(seq => lowerPassword.includes(seq));
  }

  private async checkMFARequirement(userId: string): Promise<boolean> {
    // Placeholder for MFA implementation
    // In production, check user preferences and security requirements
    return false;
  }

  private async initializeSecureSession(userId: string): Promise<void> {
    // Set session metadata
    sessionStorage.setItem('session_start', Date.now().toString());
    sessionStorage.setItem('user_id', userId);
    
    // Generate CSRF token
    this.securityService.generateCSRFToken();
  }

  private clearSensitiveStorage(): void {
    // Clear session storage
    sessionStorage.removeItem('session_start');
    sessionStorage.removeItem('user_id');
    sessionStorage.removeItem('csrf_token');
    
    // Clear sensitive localStorage items
    const sensitiveKeys = ['rate_limit_', 'security_events', 'audit_logs'];
    Object.keys(localStorage).forEach(key => {
      if (sensitiveKeys.some(sensitiveKey => key.startsWith(sensitiveKey))) {
        localStorage.removeItem(key);
      }
    });
  }
}