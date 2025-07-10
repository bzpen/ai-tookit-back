// 导出所有中间件
export * from './error.middleware';
export * from './logger.middleware';

// 从 passport.middleware.ts 导出
export { initializePassport } from './passport.middleware';

// 从 auth.middleware.ts 导出
export { 
  verifyToken, 
  optionalAuth, 
  requireRole, 
  requireAdmin, 
  requireUser, 
  getCurrentUser, 
  isAuthenticated, 
  hasRole, 
  hasAnyRole 
} from './auth.middleware'; 