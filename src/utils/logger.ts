// Sistema de logging avanzado para RentaFlux
import { config } from './config';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  userId?: string;
  sessionId?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private sessionId = this.generateSessionId();

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private shouldLog(level: LogLevel): boolean {
    if (config.app.environment === 'production') {
      return level >= LogLevel.WARN;
    }
    return true;
  }

  private formatMessage(level: LogLevel, message: string): string {
    const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${levelNames[level]}] ${message}`;
  }

  private addLog(level: LogLevel, message: string, data?: any): void {
    if (!this.shouldLog(level)) return;

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      sessionId: this.sessionId,
    };

    this.logs.push(logEntry);

    // Mantener solo los últimos N logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log a consola
    const formattedMessage = this.formatMessage(level, message);
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage, data);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, data);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, data);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage, data);
        break;
    }
  }

  debug(message: string, data?: any): void {
    this.addLog(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: any): void {
    this.addLog(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: any): void {
    this.addLog(LogLevel.WARN, message, data);
  }

  error(message: string, error?: Error | any): void {
    const errorData = error instanceof Error 
      ? { message: error.message, stack: error.stack }
      : error;
    
    this.addLog(LogLevel.ERROR, message, errorData);
  }

  // Métodos específicos para RentaFlux
  userAction(action: string, userId: string, data?: any): void {
    this.info(`User action: ${action}`, { userId, ...data });
  }

  apiCall(method: string, endpoint: string, duration?: number): void {
    this.debug(`API ${method} ${endpoint}`, { duration });
  }

  performance(operation: string, duration: number): void {
    if (duration > 1000) {
      this.warn(`Slow operation: ${operation}`, { duration });
    } else {
      this.debug(`Performance: ${operation}`, { duration });
    }
  }

  // Exportar logs para debugging
  exportLogs(): LogEntry[] {
    return [...this.logs];
  }

  // Limpiar logs
  clearLogs(): void {
    this.logs = [];
  }

  // Obtener estadísticas
  getStats(): { total: number; byLevel: Record<string, number> } {
    const byLevel = this.logs.reduce((acc, log) => {
      const levelName = LogLevel[log.level];
      acc[levelName] = (acc[levelName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: this.logs.length,
      byLevel,
    };
  }
}

// Instancia global del logger
export const logger = new Logger();

// Hook para React components
export const useLogger = () => {
  return logger;
};

// Decorator para medir performance de funciones
export const measurePerformance = (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
  const method = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const start = performance.now();
    const result = method.apply(this, args);

    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = performance.now() - start;
        logger.performance(`${target.constructor.name}.${propertyName}`, duration);
      });
    } else {
      const duration = performance.now() - start;
      logger.performance(`${target.constructor.name}.${propertyName}`, duration);
      return result;
    }
  };

  return descriptor;
};
