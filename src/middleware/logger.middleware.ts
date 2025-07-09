import { Request, Response, NextFunction } from 'express';

export class LoggerMiddleware {
  static requestLogger(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    
    // 记录请求开始
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - 开始处理`);
    
    // 监听响应结束
    res.on('finish', () => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
    });
    
    next();
  }
} 