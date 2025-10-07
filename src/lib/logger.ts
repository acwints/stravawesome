/**
 * Centralized logging utility for the application
 * Provides structured logging with different log levels
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production';
  private isDebugEnabled = process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment || this.isDebugEnabled) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    console.info(this.formatMessage('info', message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
    };
    console.error(this.formatMessage('error', message, errorContext));
  }

  /**
   * Log API request details
   */
  apiRequest(method: string, path: string, context?: LogContext): void {
    this.info(`API Request: ${method} ${path}`, context);
  }

  /**
   * Log API response details
   */
  apiResponse(method: string, path: string, status: number, duration?: number, context?: LogContext): void {
    const responseContext = {
      ...context,
      status,
      duration: duration ? `${duration}ms` : undefined,
    };
    this.info(`API Response: ${method} ${path}`, responseContext);
  }

  /**
   * Log database query details
   */
  dbQuery(operation: string, table: string, context?: LogContext): void {
    this.debug(`DB Query: ${operation} on ${table}`, context);
  }

  /**
   * Log external API calls (like Strava)
   */
  externalApi(service: string, endpoint: string, context?: LogContext): void {
    this.debug(`External API: ${service} - ${endpoint}`, context);
  }
}

export const logger = new Logger();
