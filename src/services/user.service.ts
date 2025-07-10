import { UserModel } from '@/models/user.model';
import { LogModel } from '@/models/log.model';
import { LoggerUtil } from '@/utils/logger.util';
import type { User, UserUpdate, UserStatus, LoginLogInsert } from '@/types/database.types';

export class UserService {
  /**
   * 根据ID获取用户信息
   */
  static async getUserById(userId: string): Promise<User | null> {
    try {
      const user = await UserModel.findById(userId);
      if (user) {
        LoggerUtil.info('获取用户信息成功', { userId });
      }
      return user;
    } catch (error) {
      LoggerUtil.error('获取用户信息失败', error);
      throw new Error('获取用户信息失败');
    }
  }

  /**
   * 根据邮箱获取用户信息
   */
  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const user = await UserModel.findByEmail(email);
      if (user) {
        LoggerUtil.info('根据邮箱获取用户信息成功', { email });
      }
      return user;
    } catch (error) {
      LoggerUtil.error('根据邮箱获取用户信息失败', error);
      throw new Error('获取用户信息失败');
    }
  }

  /**
   * 根据Google ID获取用户信息
   */
  static async getUserByGoogleId(googleId: string): Promise<User | null> {
    try {
      const user = await UserModel.findByGoogleId(googleId);
      if (user) {
        LoggerUtil.info('根据Google ID获取用户信息成功', { googleId });
      }
      return user;
    } catch (error) {
      LoggerUtil.error('根据Google ID获取用户信息失败', error);
      throw new Error('获取用户信息失败');
    }
  }

  /**
   * 更新用户信息
   */
  static async updateUser(userId: string, updateData: UserUpdate): Promise<User> {
    try {
      // 验证用户是否存在
      const existingUser = await UserModel.findById(userId);
      if (!existingUser) {
        throw new Error('用户不存在');
      }

      // 更新用户信息
      const updatedUser = await UserModel.update(userId, updateData);

      LoggerUtil.info('更新用户信息成功', { 
        userId, 
        updatedFields: Object.keys(updateData)
      });

      return updatedUser;
    } catch (error) {
      LoggerUtil.error('更新用户信息失败', error);
      throw error instanceof Error ? error : new Error('更新用户信息失败');
    }
  }

  /**
   * 更新用户状态
   */
  static async updateUserStatus(userId: string, status: UserStatus): Promise<User> {
    try {
      // 验证用户是否存在
      const existingUser = await UserModel.findById(userId);
      if (!existingUser) {
        throw new Error('用户不存在');
      }

      // 更新用户状态
      const updatedUser = await UserModel.updateStatus(userId, status);

      // 记录状态变更日志
      const logData: LoginLogInsert = {
        user_id: userId,
        login_method: 'google',
        success: true,
        ip_address: null,
        user_agent: null,
        location: {
          action: 'status_change',
          oldStatus: existingUser.status,
          newStatus: status
        }
      };
      await LogModel.create(logData);

      LoggerUtil.info('更新用户状态成功', { 
        userId, 
        oldStatus: existingUser.status,
        newStatus: status
      });

      return updatedUser;
    } catch (error) {
      LoggerUtil.error('更新用户状态失败', error);
      throw error instanceof Error ? error : new Error('更新用户状态失败');
    }
  }

  /**
   * 验证用户邮箱
   */
  static async verifyUserEmail(userId: string): Promise<User> {
    try {
      // 验证用户是否存在
      const existingUser = await UserModel.findById(userId);
      if (!existingUser) {
        throw new Error('用户不存在');
      }

      if (existingUser.email_verified) {
        throw new Error('邮箱已验证');
      }

      // 验证邮箱
      const updatedUser = await UserModel.verifyEmail(userId);

      LoggerUtil.info('验证用户邮箱成功', { userId, email: updatedUser.email });

      return updatedUser;
    } catch (error) {
      LoggerUtil.error('验证用户邮箱失败', error);
      throw error instanceof Error ? error : new Error('验证用户邮箱失败');
    }
  }

  /**
   * 更新用户偏好设置
   */
  static async updateUserPreferences(
    userId: string, 
    preferences: Record<string, any>
  ): Promise<User> {
    try {
      // 验证用户是否存在
      const existingUser = await UserModel.findById(userId);
      if (!existingUser) {
        throw new Error('用户不存在');
      }

      // 合并现有偏好设置
      const mergedPreferences = {
        ...existingUser.preferences,
        ...preferences
      };

      // 更新用户偏好设置
      const updatedUser = await UserModel.updatePreferences(userId, mergedPreferences);

      LoggerUtil.info('更新用户偏好设置成功', { 
        userId,
        updatedKeys: Object.keys(preferences)
      });

      return updatedUser;
    } catch (error) {
      LoggerUtil.error('更新用户偏好设置失败', error);
      throw error instanceof Error ? error : new Error('更新用户偏好设置失败');
    }
  }

  /**
   * 更新用户最后登录时间
   */
  static async updateLastLogin(userId: string): Promise<User> {
    try {
      const updatedUser = await UserModel.updateLastLogin(userId);
      LoggerUtil.info('更新最后登录时间成功', { userId });
      return updatedUser;
    } catch (error) {
      LoggerUtil.error('更新最后登录时间失败', error);
      throw new Error('更新最后登录时间失败');
    }
  }

  /**
   * 软删除用户（将状态改为inactive）
   */
  static async deactivateUser(userId: string): Promise<User> {
    try {
      // 验证用户是否存在
      const existingUser = await UserModel.findById(userId);
      if (!existingUser) {
        throw new Error('用户不存在');
      }

      if (existingUser.status === 'inactive') {
        throw new Error('用户已处于非活跃状态');
      }

      // 软删除用户
      const updatedUser = await UserModel.softDelete(userId);

      // 记录删除日志
      const logData: LoginLogInsert = {
        user_id: userId,
        login_method: 'google',
        success: true,
        ip_address: null,
        user_agent: null,
        location: {
          action: 'user_deactivated',
          reason: 'user_requested'
        }
      };
      await LogModel.create(logData);

      LoggerUtil.info('用户账号已停用', { userId });

      return updatedUser;
    } catch (error) {
      LoggerUtil.error('停用用户账号失败', error);
      throw error instanceof Error ? error : new Error('停用用户账号失败');
    }
  }

  /**
   * 检查用户是否存在
   */
  static async userExists(userId: string): Promise<boolean> {
    try {
      return await UserModel.exists(userId);
    } catch (error) {
      LoggerUtil.error('检查用户是否存在失败', error);
      return false;
    }
  }

  /**
   * 获取用户统计信息
   */
  static async getUserStats(userId: string): Promise<{
    id: string;
    email: string;
    name: string;
    status: UserStatus;
    emailVerified: boolean;
    createdAt: string;
    updatedAt: string;
    lastLoginAt: string | null;
    totalSessions: number;
  }> {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      // TODO: 获取用户会话统计
      const totalSessions = 0; // 暂时使用固定值

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status,
        emailVerified: user.email_verified,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        lastLoginAt: user.last_login_at,
        totalSessions
      };
    } catch (error) {
      LoggerUtil.error('获取用户统计信息失败', error);
      throw error instanceof Error ? error : new Error('获取用户统计信息失败');
    }
  }

  /**
   * 验证用户是否有效（活跃且已验证邮箱）
   */
  static async validateUser(userId: string): Promise<boolean> {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        return false;
      }

      return user.status === 'active' && user.email_verified;
    } catch (error) {
      LoggerUtil.error('验证用户有效性失败', error);
      return false;
    }
  }

  /**
   * 获取用户的公开信息（不包含敏感信息）
   */
  static async getUserPublicInfo(userId: string): Promise<{
    id: string;
    name: string;
    avatar_url: string | null;
    status: UserStatus;
    createdAt: string;
  } | null> {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        return null;
      }

      return {
        id: user.id,
        name: user.name,
        avatar_url: user.avatar_url,
        status: user.status,
        createdAt: user.created_at
      };
    } catch (error) {
      LoggerUtil.error('获取用户公开信息失败', error);
      return null;
    }
  }
} 