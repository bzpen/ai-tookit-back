import { Request, Response, NextFunction } from 'express';

export class ErrorMiddleware {
  static errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
    console.error('Error occurred:', err);
    
    // 默认错误响应
    let statusCode = 500;
    let message = '服务器内部错误';
    
    // 根据错误类型设置状态码和消息
    if (err.name === 'ValidationError') {
      statusCode = 400;
      message = '请求参数验证失败';
    } else if (err.name === 'UnauthorizedError') {
      statusCode = 401;
      message = '未授权访问';
    } else if (err.name === 'ForbiddenError') {
      statusCode = 403;
      message = '禁止访问';
    } else if (err.name === 'NotFoundError') {
      statusCode = 404;
      message = '资源未找到';
    }
    
    res.status(statusCode).json({
      error: message,
      ...(process.env['NODE_ENV'] === 'development' && { stack: err.stack })
    });
  }
} 