export class LoggerUtil {
  static info(message: string, ...args: any[]): void {
    console.log(`[${new Date().toISOString()}] [INFO] ${message}`, ...args);
  }

  static error(message: string, ...args: any[]): void {
    console.error(`[${new Date().toISOString()}] [ERROR] ${message}`, ...args);
  }

  static warn(message: string, ...args: any[]): void {
    console.warn(`[${new Date().toISOString()}] [WARN] ${message}`, ...args);
  }

  static debug(message: string, ...args: any[]): void {
    if (process.env['NODE_ENV'] === 'development') {
      console.debug(`[${new Date().toISOString()}] [DEBUG] ${message}`, ...args);
    }
  }
} 