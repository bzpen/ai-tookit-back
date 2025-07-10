import { LogModel } from '@/models/log.model';
import { LoggerUtil } from '@/utils/logger.util';
import type { LoginLog, LoginLogInsert } from '@/types/database.types';

type LoginMethod = 'google' | 'token_refresh';

export class LogService {
  /**
   * 创建登录日志
   */
  static async createLoginLog(logData: LoginLogInsert): Promise<LoginLog> {
    try {
      const log = await LogModel.create(logData);
      LoggerUtil.info('登录日志创建成功', { logId: log.id });
      return log;
    } catch (error) {
      LoggerUtil.error('创建登录日志失败', error);
      throw new Error('记录登录日志失败');
    }
  }

  /**
   * 记录成功登录
   */
  static async logSuccessfulLogin(
    userId: string,
    method: LoginMethod,
    ipAddress?: string,
    userAgent?: string,
    location?: Record<string, any>
  ): Promise<LoginLog> {
    const logData: LoginLogInsert = {
      user_id: userId,
      login_method: method,
      success: true,
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
      location: location || null
    };

    return this.createLoginLog(logData);
  }

  /**
   * 记录失败登录
   */
  static async logFailedLogin(
    userId: string,
    method: LoginMethod,
    errorMessage: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<LoginLog> {
    const logData: LoginLogInsert = {
      user_id: userId,
      login_method: method,
      success: false,
      error_message: errorMessage,
      ip_address: ipAddress || null,
      user_agent: userAgent || null
    };

    return this.createLoginLog(logData);
  }

  /**
   * 获取用户登录日志
   */
  static async getUserLoginLogs(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    logs: LoginLog[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const result = await LogModel.findByUserId(userId, page, limit);

      LoggerUtil.info('获取用户登录日志成功', { 
        userId, 
        page, 
        limit,
        total: result.logs.length 
      });

      return result;
    } catch (error) {
      LoggerUtil.error('获取用户登录日志失败', error);
      throw new Error('获取登录日志失败');
    }
  }

  /**
   * 获取用户最近登录日志
   */
  static async getUserRecentLoginLogs(
    userId: string, 
    limit: number = 5
  ): Promise<LoginLog[]> {
    try {
      const result = await LogModel.findByUserId(userId, 1, limit);
      
      LoggerUtil.info('获取用户最近登录日志成功', { 
        userId, 
        count: result.logs.length 
      });

      return result.logs;
    } catch (error) {
      LoggerUtil.error('获取用户最近登录日志失败', error);
      throw new Error('获取最近登录日志失败');
    }
  }

  /**
   * 获取登录统计信息
   */
  static async getLoginStats(userId: string): Promise<{
    totalLogins: number;
    successfulLogins: number;
    failedLogins: number;
    successRate: number;
    byMethod: Record<LoginMethod, number>;
    recentActivity: Array<{
      date: string;
      count: number;
    }>;
  }> {
    try {
      const stats = await LogModel.getUserLoginStats(userId);
      
      const result = {
        totalLogins: stats.totalLogins,
        successfulLogins: stats.successfulLogins,
        failedLogins: stats.failedLogins,
        successRate: stats.totalLogins === 0 ? 0 : 
          Math.round((stats.successfulLogins / stats.totalLogins) * 100),
        byMethod: stats.loginMethods,
        recentActivity: [] as Array<{ date: string; count: number; }>
      };
      
      LoggerUtil.info('获取登录统计信息成功', { 
        userId,
        totalLogins: stats.totalLogins
      });

      return result;
    } catch (error) {
      LoggerUtil.error('获取登录统计信息失败', error);
      throw new Error('获取登录统计失败');
    }
  }

  /**
   * 获取可疑登录活动（简化版）
   */
  static async getSuspiciousActivity(
    userId?: string,
    hours: number = 24
  ): Promise<Array<{
    log: LoginLog;
    reason: string;
    severity: 'low' | 'medium' | 'high';
  }>> {
    try {
      // 简化实现，返回空数组
      LoggerUtil.info('获取可疑登录活动', { 
        userId: userId || 'all',
        hours
      });

      return [];
    } catch (error) {
      LoggerUtil.error('获取可疑登录活动失败', error);
      throw new Error('获取可疑活动失败');
    }
  }

  /**
   * 清理过期的登录日志
   */
  static async cleanupOldLogs(days: number = 90): Promise<number> {
    try {
      const deletedCount = await LogModel.cleanupOldLogs(days);
      
      LoggerUtil.info('清理过期登录日志完成', { 
        days,
        deletedCount
      });

      return deletedCount;
    } catch (error) {
      LoggerUtil.error('清理过期登录日志失败', error);
      throw new Error('清理日志失败');
    }
  }

  /**
   * 记录用户操作日志
   */
  static async logUserAction(
    userId: string,
    action: string,
    details: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<LoginLog> {
    try {
      const logData: LoginLogInsert = {
        user_id: userId,
        login_method: 'google',
        success: true,
        ip_address: ipAddress || null,
        user_agent: userAgent || null,
        location: {
          action,
          ...details
        }
      };

      const log = await this.createLoginLog(logData);
      
      LoggerUtil.info('用户操作日志记录成功', { 
        userId,
        action,
        logId: log.id
      });

      return log;
    } catch (error) {
      LoggerUtil.error('记录用户操作日志失败', error);
      throw new Error('记录操作日志失败');
    }
  }
} 