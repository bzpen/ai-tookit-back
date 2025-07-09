import { DatabaseConfig } from '../config/database.config';
import { UserModel } from './user.model';
import { TokenModel } from './token.model';
import { LogModel } from './log.model';

export class Database {
  // 初始化数据库连接
  static async initialize(): Promise<void> {
    await DatabaseConfig.initialize();
  }

  // 关闭数据库连接
  static async close(): Promise<void> {
    await DatabaseConfig.close();
  }

  // 健康检查
  static async healthCheck(): Promise<boolean> {
    return await DatabaseConfig.healthCheck();
  }

  // 数据库清理任务
  static async cleanup(): Promise<{
    expiredTokens: number;
    revokedTokens: number;
    oldLogs: number;
  }> {
    try {
      const [expiredTokens, revokedTokens, oldLogs] = await Promise.all([
        TokenModel.cleanupExpiredTokens(),
        TokenModel.cleanupRevokedTokens(), 
        LogModel.cleanupOldLogs()
      ]);

      return {
        expiredTokens,
        revokedTokens,
        oldLogs
      };
    } catch (error) {
      console.error('数据库清理失败:', error);
      throw error;
    }
  }

  // 获取数据库统计信息
  static async getStats(): Promise<{
    users: {
      total: number;
      active: number;
      inactive: number;
      suspended: number;
    };
    tokens: {
      total: number;
      active: number;
      expired: number;
      revoked: number;
    };
    loginLogs: {
      totalLogins: number;
      successfulLogins: number;
      failedLogins: number;
      uniqueUsers: number;
    };
  }> {
    try {
      const [usersResult, tokensResult, logsResult] = await Promise.all([
        UserModel.findAll(1, 1000),
        TokenModel.getTokenStats(),
        LogModel.getSystemLoginStats('24 hours')
      ]);

      const users = usersResult.users;
      const userStats = {
        total: users.length,
        active: users.filter(u => u.status === 'active').length,
        inactive: users.filter(u => u.status === 'inactive').length,
        suspended: users.filter(u => u.status === 'suspended').length
      };

      return {
        users: userStats,
        tokens: tokensResult,
        loginLogs: {
          totalLogins: logsResult.totalLogins,
          successfulLogins: logsResult.successfulLogins,
          failedLogins: logsResult.failedLogins,
          uniqueUsers: logsResult.uniqueUsers
        }
      };
    } catch (error) {
      console.error('获取数据库统计信息失败:', error);
      throw error;
    }
  }

  // 备份数据库（仅统计信息）
  static async backup(): Promise<{
    timestamp: string;
    users: number;
    tokens: number;
    logs: number;
  }> {
    try {
      const stats = await this.getStats();
      
      return {
        timestamp: new Date().toISOString(),
        users: stats.users.total,
        tokens: stats.tokens.total,
        logs: stats.loginLogs.totalLogins
      };
    } catch (error) {
      console.error('数据库备份失败:', error);
      throw error;
    }
  }

  // 数据库迁移检查
  static async checkMigrations(): Promise<{
    tablesExist: boolean;
    message: string;
  }> {
    try {
      const healthy = await this.healthCheck();
      
      if (healthy) {
        return {
          tablesExist: true,
          message: '数据库表结构正常'
        };
      } else {
        return {
          tablesExist: false,
          message: '数据库表结构不存在，请运行 SQL 脚本创建表'
        };
      }
    } catch (error) {
      return {
        tablesExist: false,
        message: `数据库检查失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  }
}

// 导出所有模型
export {
  UserModel,
  TokenModel,
  LogModel,
  DatabaseConfig
}; 