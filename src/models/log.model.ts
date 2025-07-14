import { DatabaseConfig } from '../config/database.config';
import type { LoginLog, LoginLogInsert, LoginMethod } from '@/types/database.types';

export class LogModel {
  private static get supabase() {
    return DatabaseConfig.supabase;
  }

  // 管理员客户端，用于绕过RLS策略
  private static get adminClient() {
    return DatabaseConfig.admin;
  }

  // 解析时间范围的辅助函数
  private static parseTimeRange(timeRange: string): Date {
    const timeAgo = new Date();
    const [amount, unit] = timeRange.split(' ');
    const numAmount = parseInt(amount || '1');
    
    switch (unit) {
      case 'minute':
      case 'minutes':
        timeAgo.setMinutes(timeAgo.getMinutes() - numAmount);
        break;
      case 'hour':
      case 'hours':
        timeAgo.setHours(timeAgo.getHours() - numAmount);
        break;
      case 'day':
      case 'days':
        timeAgo.setDate(timeAgo.getDate() - numAmount);
        break;
      default:
        timeAgo.setHours(timeAgo.getHours() - 1);
    }
    
    return timeAgo;
  }

  // 创建登录日志记录 - 使用管理员权限
  static async create(logData: LoginLogInsert): Promise<LoginLog> {
    const { data, error } = await this.adminClient
      .from('login_logs')
      .insert({
        ...logData,
        login_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`创建登录日志失败: ${error.message}`);
    }

    return data;
  }

  // 记录成功登录
  static async logSuccessfulLogin(
    userId: string,
    method: LoginMethod,
    ipAddress?: string,
    userAgent?: string,
    location?: Record<string, any>
  ): Promise<LoginLog> {
    return await this.create({
      user_id: userId,
      login_method: method,
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
      success: true,
      location: location || null
    });
  }

  // 记录失败登录
  static async logFailedLogin(
    userId: string,
    method: LoginMethod,
    errorMessage: string,
    ipAddress?: string,
    userAgent?: string,
    location?: Record<string, any>
  ): Promise<LoginLog> {
    return await this.create({
      user_id: userId,
      login_method: method,
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
      success: false,
      error_message: errorMessage,
      location: location || null
    });
  }

  // 根据用户ID获取登录日志
  static async findByUserId(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    logs: LoginLog[];
    total: number;
    page: number;
    limit: number;
  }> {
    const offset = (page - 1) * limit;

    const { data, error, count } = await this.supabase
      .from('login_logs')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('login_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`获取用户登录日志失败: ${error.message}`);
    }

    return {
      logs: data || [],
      total: count || 0,
      page,
      limit
    };
  }

  // 根据IP地址获取登录日志
  static async findByIpAddress(
    ipAddress: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    logs: LoginLog[];
    total: number;
    page: number;
    limit: number;
  }> {
    const offset = (page - 1) * limit;

    const { data, error, count } = await this.supabase
      .from('login_logs')
      .select('*', { count: 'exact' })
      .eq('ip_address', ipAddress)
      .order('login_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`获取IP地址登录日志失败: ${error.message}`);
    }

    return {
      logs: data || [],
      total: count || 0,
      page,
      limit
    };
  }

  // 获取用户最后一次成功登录记录
  static async getLastSuccessfulLogin(userId: string): Promise<LoginLog | null> {
    const { data, error } = await this.supabase
      .from('login_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('success', true)
      .order('login_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // 没有登录记录
      }
      throw new Error(`获取最后成功登录记录失败: ${error.message}`);
    }

    return data;
  }

  // 获取用户失败登录次数（特定时间范围内）
  static async getFailedLoginCount(
    userId: string,
    timeRange: string = '1 hour'
  ): Promise<number> {
    const timeAgo = this.parseTimeRange(timeRange);

    const { count, error } = await this.supabase
      .from('login_logs')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('success', false)
      .gte('login_at', timeAgo.toISOString());

    if (error) {
      throw new Error(`获取失败登录次数失败: ${error.message}`);
    }

    return count || 0;
  }

  // 获取IP地址失败登录次数（特定时间范围内）
  static async getFailedLoginCountByIp(
    ipAddress: string,
    timeRange: string = '1 hour'
  ): Promise<number> {
    const timeAgo = this.parseTimeRange(timeRange);

    const { count, error } = await this.supabase
      .from('login_logs')
      .select('id', { count: 'exact' })
      .eq('ip_address', ipAddress)
      .eq('success', false)
      .gte('login_at', timeAgo.toISOString());

    if (error) {
      throw new Error(`获取IP地址失败登录次数失败: ${error.message}`);
    }

    return count || 0;
  }

  // 获取用户登录统计
  static async getUserLoginStats(userId: string): Promise<{
    totalLogins: number;
    successfulLogins: number;
    failedLogins: number;
    lastLogin: string | null;
    uniqueIps: number;
    loginMethods: Record<LoginMethod, number>;
  }> {
    const { data, error } = await this.supabase
      .from('login_logs')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`获取用户登录统计失败: ${error.message}`);
    }

    const logs = data || [];
    const uniqueIps = new Set(logs.map(log => log.ip_address).filter(ip => ip));
    const loginMethods: Record<LoginMethod, number> = {
      google: 0,
      token_refresh: 0
    };

    logs.forEach(log => {
      loginMethods[log.login_method as LoginMethod] = (loginMethods[log.login_method as LoginMethod] || 0) + 1;
    });

    return {
      totalLogins: logs.length,
      successfulLogins: logs.filter(log => log.success).length,
      failedLogins: logs.filter(log => !log.success).length,
      lastLogin: logs.length > 0 ? logs.sort((a, b) => 
        new Date(b.login_at).getTime() - new Date(a.login_at).getTime()
      )[0]?.login_at || null : null,
      uniqueIps: uniqueIps.size,
      loginMethods
    };
  }

  // 获取系统登录统计
  static async getSystemLoginStats(timeRange: string = '24 hours'): Promise<{
    totalLogins: number;
    successfulLogins: number;
    failedLogins: number;
    uniqueUsers: number;
    uniqueIps: number;
    loginMethods: Record<LoginMethod, number>;
  }> {
    const timeAgo = this.parseTimeRange(timeRange);

    const { data, error } = await this.supabase
      .from('login_logs')
      .select('*')
      .gte('login_at', timeAgo.toISOString());

    if (error) {
      throw new Error(`获取系统登录统计失败: ${error.message}`);
    }

    const logs = data || [];
    const uniqueUsers = new Set(logs.map(log => log.user_id));
    const uniqueIps = new Set(logs.map(log => log.ip_address).filter(ip => ip));
    const loginMethods: Record<LoginMethod, number> = {
      google: 0,
      token_refresh: 0
    };

    logs.forEach(log => {
      loginMethods[log.login_method as LoginMethod] = (loginMethods[log.login_method as LoginMethod] || 0) + 1;
    });

    return {
      totalLogins: logs.length,
      successfulLogins: logs.filter(log => log.success).length,
      failedLogins: logs.filter(log => !log.success).length,
      uniqueUsers: uniqueUsers.size,
      uniqueIps: uniqueIps.size,
      loginMethods
    };
  }

  // 清理旧的登录日志 - 使用管理员权限
  static async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { data, error } = await this.adminClient
      .from('login_logs')
      .delete()
      .lt('login_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      throw new Error(`清理旧登录日志失败: ${error.message}`);
    }

    return data?.length || 0;
  }

  // 获取可疑登录活动
  static async getSuspiciousActivity(
    timeRange: string = '1 hour',
    failedAttemptThreshold: number = 5
  ): Promise<{
    suspiciousIps: Array<{
      ip_address: string;
      failed_attempts: number;
      last_attempt: string;
    }>;
    suspiciousUsers: Array<{
      user_id: string;
      failed_attempts: number;
      last_attempt: string;
    }>;
  }> {
    const timeAgo = this.parseTimeRange(timeRange);

    const { data, error } = await this.supabase
      .from('login_logs')
      .select('*')
      .eq('success', false)
      .gte('login_at', timeAgo.toISOString());

    if (error) {
      throw new Error(`获取可疑登录活动失败: ${error.message}`);
    }

    const logs = data || [];
    
    // 按IP地址分组
    const ipGroups: Record<string, LoginLog[]> = {};
    logs.forEach(log => {
      if (log.ip_address) {
        if (!ipGroups[log.ip_address]) {
          ipGroups[log.ip_address] = [];
        }
        ipGroups[log.ip_address]?.push(log);
      }
    });

    // 按用户ID分组
    const userGroups: Record<string, LoginLog[]> = {};
    logs.forEach(log => {
      if (!userGroups[log.user_id]) {
        userGroups[log.user_id] = [];
      }
      userGroups[log.user_id]?.push(log);
    });

    const suspiciousIps = Object.entries(ipGroups)
      .filter(([, logs]) => logs.length >= failedAttemptThreshold)
      .map(([ip, logs]) => ({
        ip_address: ip,
        failed_attempts: logs.length,
        last_attempt: logs.sort((a, b) => 
          new Date(b.login_at).getTime() - new Date(a.login_at).getTime()
        )[0]?.login_at || ''
      }));

    const suspiciousUsers = Object.entries(userGroups)
      .filter(([, logs]) => logs.length >= failedAttemptThreshold)
      .map(([userId, logs]) => ({
        user_id: userId,
        failed_attempts: logs.length,
        last_attempt: logs.sort((a, b) => 
          new Date(b.login_at).getTime() - new Date(a.login_at).getTime()
        )[0]?.login_at || ''
      }));

    return {
      suspiciousIps,
      suspiciousUsers
    };
  }
} 