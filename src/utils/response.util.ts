import { Response } from 'express';
import { ApiResponse } from '../types/common.types';

export class ResponseUtil {
  /**
   * 成功响应
   */
  static success<T>(
    res: Response,
    data: T,
    message: string = '操作成功',
    statusCode: number = 200
  ): void {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString()
    };
    
    res.status(statusCode).json(response);
  }

  /**
   * 错误响应
   */
  static error(
    res: Response,
    error: string = '操作失败',
    statusCode: number = 500,
    data?: any
  ): void {
    const response: ApiResponse = {
      success: false,
      error,
      data,
      timestamp: new Date().toISOString()
    };
    
    res.status(statusCode).json(response);
  }

  /**
   * 分页响应
   */
  static paginated<T>(
    res: Response,
    items: T[],
    total: number,
    page: number,
    limit: number,
    message: string = '获取成功'
  ): void {
    const response: ApiResponse = {
      success: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      },
      message,
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  }

  /**
   * 验证错误响应
   */
  static validationError(
    res: Response,
    errors: string[] | string,
    statusCode: number = 400
  ): void {
    const response: ApiResponse = {
      success: false,
      error: Array.isArray(errors) ? errors.join(', ') : errors,
      timestamp: new Date().toISOString()
    };
    
    res.status(statusCode).json(response);
  }

  /**
   * 未授权响应
   */
  static unauthorized(
    res: Response,
    message: string = '未授权访问'
  ): void {
    this.error(res, message, 401);
  }

  /**
   * 禁止访问响应
   */
  static forbidden(
    res: Response,
    message: string = '禁止访问'
  ): void {
    this.error(res, message, 403);
  }

  /**
   * 资源不存在响应
   */
  static notFound(
    res: Response,
    message: string = '资源不存在'
  ): void {
    this.error(res, message, 404);
  }

  /**
   * 服务器错误响应
   */
  static serverError(
    res: Response,
    message: string = '服务器内部错误'
  ): void {
    this.error(res, message, 500);
  }
} 