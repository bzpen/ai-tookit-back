import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/auth.config';
import { ResponseUtil } from '../utils/response.util';
import { LoggerUtil } from '../utils/logger.util';
import { JwtPayload } from '../types/auth.types';

/**
 * JWT 验证中间件
 */
export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      ResponseUtil.unauthorized(res, '缺少访问令牌');
      return;
    }

    const token = authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      ResponseUtil.unauthorized(res, '无效的令牌格式');
      return;
    }

    // 验证Token
    const decoded = jwt.verify(token, jwtConfig.secret) as JwtPayload;
    
    // 将用户信息添加到请求对象
    req.authUser = decoded;
    req.authToken = token;
    
    next();
  } catch (error) {
    LoggerUtil.error('Token验证失败', { error });
    
    if (error instanceof jwt.TokenExpiredError) {
      ResponseUtil.unauthorized(res, '访问令牌已过期');
    } else if (error instanceof jwt.JsonWebTokenError) {
      ResponseUtil.unauthorized(res, '无效的访问令牌');
    } else {
      ResponseUtil.error(res, '令牌验证失败', 401);
    }
  }
};

/**
 * 可选认证中间件（不强制要求认证）
 */
export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      // 没有认证头，继续处理
      next();
      return;
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      // 没有token，继续处理
      next();
      return;
    }

    // 尝试验证Token
    try {
      const decoded = jwt.verify(token, jwtConfig.secret) as JwtPayload;
      req.authUser = decoded;
      req.authToken = token;
    } catch (error) {
      // Token无效，但不阻止请求
      LoggerUtil.warn('可选认证中Token无效', { error });
    }
    
    next();
  } catch (error) {
    LoggerUtil.error('可选认证中间件错误', { error });
    next(); // 继续处理请求
  }
};

/**
 * 权限检查中间件
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const user = req.authUser;
      
      if (!user) {
        ResponseUtil.unauthorized(res, '用户未登录');
        return;
      }

      if (!roles.includes(user.role)) {
        ResponseUtil.forbidden(res, '权限不足');
        return;
      }

      next();
    } catch (error) {
      LoggerUtil.error('权限检查失败', { error });
      ResponseUtil.error(res, '权限检查失败', 500);
    }
  };
};

/**
 * 管理员权限检查中间件
 */
export const requireAdmin = requireRole(['admin']);

/**
 * 用户权限检查中间件
 */
export const requireUser = requireRole(['user', 'admin']);

/**
 * 获取当前用户信息
 */
export const getCurrentUser = (req: Request): JwtPayload | null => {
  return req.authUser || null;
};

/**
 * 检查用户是否已登录
 */
export const isAuthenticated = (req: Request): boolean => {
  return !!req.authUser;
};

/**
 * 检查用户是否有指定角色
 */
export const hasRole = (req: Request, role: string): boolean => {
  const user = req.authUser;
  return user ? user.role === role : false;
};

/**
 * 检查用户是否有任意指定角色
 */
export const hasAnyRole = (req: Request, roles: string[]): boolean => {
  const user = req.authUser;
  return user ? roles.includes(user.role) : false;
}; 