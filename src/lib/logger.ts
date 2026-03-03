
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  action: string;
  message?: string;
  metadata?: Record<string, unknown>;
  error?: unknown;
}

export const logger = {
  log: (level: LogLevel, action: string, message?: string, metadata?: Record<string, unknown>, error?: unknown) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      action,
      message,
      metadata,
    };

    if (error) {
      entry.error = error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause
      } : error;
    }

    // In production, you might want to send this to a logging service (e.g. CloudWatch, Datadog)
    // For now, we just console.log/error
    const logFn = level === 'error' ? console.error : 
                  level === 'warn' ? console.warn : 
                  console.log;

    logFn(JSON.stringify(entry));
  },

  info: (action: string, message?: string, metadata?: Record<string, unknown>) => 
    logger.log('info', action, message, metadata),
    
  warn: (action: string, message?: string, metadata?: Record<string, unknown>, error?: unknown) => 
    logger.log('warn', action, message, metadata, error),
    
  error: (action: string, error: unknown, metadata?: Record<string, unknown>) => 
    logger.log('error', action, undefined, metadata, error),

  debug: (action: string, message?: string, metadata?: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== 'production') {
      logger.log('debug', action, message, metadata);
    }
  }
};
