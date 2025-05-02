/**
 * Logger utility for Chrome Control
 * Provides structured logging with different levels, timestamps,
 * and the ability to output to console and/or file
 */

import fs from 'fs/promises';
import path from 'path';
import { format } from 'util';
import { fileURLToPath } from 'url';

// Define log levels with numeric values for comparison
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  HTTP = 3,
  DEBUG = 4,
  TRACE = 5
}

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Configuration interface for the logger
interface LoggerConfig {
  logLevel: LogLevel;
  logToConsole: boolean;
  logToFile: boolean;
  logFilePath?: string;
  colorize?: boolean;
  showTimestamp?: boolean;
  showLogLevel?: boolean;
}

// Default configuration
const defaultConfig: LoggerConfig = {
  logLevel: LogLevel.INFO,
  logToConsole: true,
  logToFile: false,
  colorize: true,
  showTimestamp: true,
  showLogLevel: true
};

/**
 * Logger class for consistent logging across the application
 */
export class Logger {
  private static instance: Logger;
  private config: LoggerConfig;
  private logStream: fs.FileHandle | null = null;
  private logDir: string;

  private constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    
    // Determine log directory
    if (process.env.LOG_DIR) {
      this.logDir = process.env.LOG_DIR;
    } else {
      try {
        // Try to get the directory of the current module
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        this.logDir = path.join(__dirname, '../../logs');
      } catch (error) {
        this.logDir = path.join(process.cwd(), 'logs');
      }
    }
    
    // Initialize the log file if needed
    this.initLogFile();
  }

  /**
   * Get the singleton instance of the logger
   */
  public static getInstance(config?: Partial<LoggerConfig>): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(config);
    } else if (config) {
      // Update config if provided
      Logger.instance.updateConfig(config);
    }
    return Logger.instance;
  }

  /**
   * Update the logger configuration
   */
  public updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
    
    // If we're changing the file logging setting, update the file handle
    if (config.logToFile !== undefined || config.logFilePath !== undefined) {
      this.initLogFile();
    }
  }

  /**
   * Initialize or update the log file
   */
  private async initLogFile(): Promise<void> {
    try {
      // Close existing file handle if it exists
      if (this.logStream) {
        await this.logStream.close();
        this.logStream = null;
      }

      if (this.config.logToFile) {
        const logFilePath = this.config.logFilePath || 
          path.join(this.logDir, `chrome-control-${new Date().toISOString().split('T')[0]}.log`);
        
        // Ensure the directory exists
        await fs.mkdir(path.dirname(logFilePath), { recursive: true });
        
        // Open the log file for appending
        this.logStream = await fs.open(logFilePath, 'a');
        
        this.info(`Logging initialized to ${logFilePath}`);
      }
    } catch (error) {
      console.error('Failed to initialize log file:', error);
      this.config.logToFile = false;
    }
  }

  /**
   * Format a log message with timestamp and level if enabled
   */
  private formatMessage(level: LogLevel, message: string, ...args: any[]): string {
    const formattedMsg = args.length ? format(message, ...args) : message;
    const parts: string[] = [];
    
    if (this.config.showTimestamp) {
      parts.push(`[${new Date().toISOString()}]`);
    }
    
    if (this.config.showLogLevel) {
      const levelName = LogLevel[level];
      parts.push(`[${levelName}]`);
    }
    
    parts.push(formattedMsg);
    return parts.join(' ');
  }

  /**
   * Add color to console output if enabled
   */
  private colorize(level: LogLevel, message: string): string {
    if (!this.config.colorize) return message;
    
    let color = colors.reset;
    switch (level) {
      case LogLevel.ERROR:
        color = colors.red;
        break;
      case LogLevel.WARN:
        color = colors.yellow;
        break;
      case LogLevel.INFO:
        color = colors.green;
        break;
      case LogLevel.HTTP:
        color = colors.cyan;
        break;
      case LogLevel.DEBUG:
        color = colors.blue;
        break;
      case LogLevel.TRACE:
        color = colors.magenta;
        break;
    }
    
    return `${color}${message}${colors.reset}`;
  }

  /**
   * Write a log entry
   */
  private async log(level: LogLevel, message: string, ...args: any[]): Promise<void> {
    if (level > this.config.logLevel) return;
    
    const formattedMessage = this.formatMessage(level, message, ...args);
    
    // Log to console if enabled
    if (this.config.logToConsole) {
      const coloredMessage = this.colorize(level, formattedMessage);
      switch (level) {
        case LogLevel.ERROR:
          console.error(coloredMessage);
          break;
        case LogLevel.WARN:
          console.warn(coloredMessage);
          break;
        default:
          console.log(coloredMessage);
      }
    }
    
    // Log to file if enabled
    if (this.config.logToFile && this.logStream) {
      try {
        await this.logStream.write(`${formattedMessage}\n`);
      } catch (error) {
        console.error('Failed to write to log file:', error);
        this.config.logToFile = false;
      }
    }
  }

  /**
   * Log an error message
   */
  public error(message: string, ...args: any[]): void {
    this.log(LogLevel.ERROR, message, ...args);
  }

  /**
   * Log a warning message
   */
  public warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, message, ...args);
  }

  /**
   * Log an info message
   */
  public info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, message, ...args);
  }

  /**
   * Log an HTTP message (requests/responses)
   */
  public http(message: string, ...args: any[]): void {
    this.log(LogLevel.HTTP, message, ...args);
  }

  /**
   * Log a debug message
   */
  public debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  /**
   * Log a trace message (most detailed level)
   */
  public trace(message: string, ...args: any[]): void {
    this.log(LogLevel.TRACE, message, ...args);
  }

  /**
   * Log a JSON object (useful for API requests/responses)
   */
  public json(level: LogLevel, obj: any, label?: string): void {
    const prefix = label ? `${label}: ` : '';
    let json;
    
    try {
      // Use a custom replacer function to handle circular references
      const seen = new WeakSet();
      json = JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular]';
          }
          seen.add(value);
        }
        return value;
      }, 2);
    } catch (error) {
      json = '[Unable to stringify object: ' + (error as Error).message + ']';
    }
    
    this.log(level, `${prefix}${json}`);
  }

  /**
   * Log an error object with stack trace
   */
  public exception(error: Error | unknown, message?: string): void {
    const err = error instanceof Error ? error : new Error(String(error));
    const msg = message ? `${message}: ${err.message}` : err.message;
    this.error(`${msg}\n${err.stack || 'No stack trace available'}`);
  }

  /**
   * Log the start of an operation with timing
   */
  public startTimer(label: string): () => void {
    const start = process.hrtime();
    return () => {
      const [seconds, nanoseconds] = process.hrtime(start);
      const duration = seconds * 1000 + nanoseconds / 1000000;
      this.debug(`${label} completed in ${duration.toFixed(2)}ms`);
    };
  }

  /**
   * Create a logger with prefixed messages
   */
  public createPrefixedLogger(prefix: string): Omit<Logger, 'createPrefixedLogger' | 'updateConfig'> {
    const self = this;
    return {
      error: (message: string, ...args: any[]) => self.error(`[${prefix}] ${message}`, ...args),
      warn: (message: string, ...args: any[]) => self.warn(`[${prefix}] ${message}`, ...args),
      info: (message: string, ...args: any[]) => self.info(`[${prefix}] ${message}`, ...args),
      http: (message: string, ...args: any[]) => self.http(`[${prefix}] ${message}`, ...args),
      debug: (message: string, ...args: any[]) => self.debug(`[${prefix}] ${message}`, ...args),
      trace: (message: string, ...args: any[]) => self.trace(`[${prefix}] ${message}`, ...args),
      json: (level: LogLevel, obj: any, label?: string) => 
        self.json(level, obj, label ? `[${prefix}] ${label}` : `[${prefix}]`),
      exception: (error: Error | unknown, message?: string) => 
        self.exception(error, message ? `[${prefix}] ${message}` : `[${prefix}]`),
      startTimer: (label: string) => self.startTimer(`[${prefix}] ${label}`),
      // Pass through the close method to the main logger
      close: () => self.close()
    };
  }

  /**
   * Close the logger and clean up resources
   */
  public async close(): Promise<void> {
    if (this.logStream) {
      await this.logStream.close();
      this.logStream = null;
    }
  }
}

// Export a default instance
export const logger = Logger.getInstance();

// Export a function to create module-specific loggers
export function createLogger(moduleName: string): Omit<Logger, 'createPrefixedLogger' | 'updateConfig'> {
  return logger.createPrefixedLogger(moduleName);
}

// Export a utility to log HTTP requests and responses
export function createRequestLogger() {
  const logRequest = (req: any) => {
    try {
      const { method, url, headers, body } = req;
      logger.http(`➡️ ${method} ${url}`);
      logger.debug('Request Headers:', headers);
      if (body) {
        logger.debug('Request Body:', typeof body === 'object' ? body : String(body));
      }
    } catch (error) {
      logger.error('Error logging request:', error);
    }
  };

  const logResponse = (res: any) => {
    try {
      const { status, statusText, headers, data } = res;
      logger.http(`⬅️ ${status} ${statusText || ''}`);
      logger.debug('Response Headers:', headers);
      if (data) {
        logger.debug('Response Body:', typeof data === 'object' ? data : String(data));
      }
    } catch (error) {
      logger.error('Error logging response:', error);
    }
  };

  return { logRequest, logResponse };
}

// Environment variable helper
export function configureLoggerFromEnv(): void {
  const logLevel = process.env.LOG_LEVEL?.toUpperCase();
  const logToFile = process.env.LOG_TO_FILE?.toLowerCase() === 'true';
  const logToConsole = process.env.LOG_TO_CONSOLE?.toLowerCase() !== 'false';
  const logFilePath = process.env.LOG_FILE_PATH;
  const colorize = process.env.LOG_COLORIZE?.toLowerCase() !== 'false';

  const config: Partial<LoggerConfig> = {};
  
  if (logLevel && LogLevel[logLevel as keyof typeof LogLevel] !== undefined) {
    config.logLevel = LogLevel[logLevel as keyof typeof LogLevel];
  }
  
  if (logToFile !== undefined) config.logToFile = logToFile;
  if (logToConsole !== undefined) config.logToConsole = logToConsole;
  if (logFilePath) config.logFilePath = logFilePath;
  if (colorize !== undefined) config.colorize = colorize;
  
  logger.updateConfig(config);
}

// Initialize from environment variables
configureLoggerFromEnv();

export default logger;