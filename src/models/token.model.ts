import { DatabaseConfig } from '../config/database.config';
import type { UserToken, UserTokenInsert, TokenType } from '@/types/database.types';

export class TokenModel {
  private static get supabase() {
    return DatabaseConfig.supabase;
  }

  // 管理员客户端，用于绕过RLS策略
  private static get adminClient() {
    return DatabaseConfig.admin;
  }

  // 创建令牌记录 - 使用管理员权限
  static async create(tokenData: UserTokenInsert): Promise<UserToken> {
    const { data, error } = await this.adminClient
      .from('user_tokens')
      .insert({
        ...tokenData,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`创建令牌记录失败: ${error.message}`);
    }

    return data;
  }

  // 根据令牌哈希查找令牌
  static async findByTokenHash(tokenHash: string): Promise<UserToken | null> {
    const { data, error } = await this.supabase
      .from('user_tokens')
      .select('*')
      .eq('token_hash', tokenHash)
      .eq('is_revoked', false)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // 令牌不存在
      }
      throw new Error(`查询令牌失败: ${error.message}`);
    }

    return data;
  }

  // 根据用户ID和令牌类型查找令牌
  static async findByUserIdAndType(userId: string, tokenType: TokenType): Promise<UserToken[]> {
    const { data, error } = await this.supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('token_type', tokenType)
      .eq('is_revoked', false)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`查询用户令牌失败: ${error.message}`);
    }

    return data || [];
  }

  // 根据用户ID查找所有令牌
  static async findByUserId(userId: string): Promise<UserToken[]> {
    const { data, error } = await this.supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`查询用户令牌失败: ${error.message}`);
    }

    return data || [];
  }

  // 撤销令牌 - 使用管理员权限
  static async revoke(tokenId: string): Promise<UserToken> {
    const { data, error } = await this.adminClient
      .from('user_tokens')
      .update({
        is_revoked: true
      })
      .eq('id', tokenId)
      .select()
      .single();

    if (error) {
      throw new Error(`撤销令牌失败: ${error.message}`);
    }

    return data;
  }

  // 根据令牌哈希撤销令牌 - 使用管理员权限
  static async revokeByTokenHash(tokenHash: string): Promise<UserToken> {
    const { data, error } = await this.adminClient
      .from('user_tokens')
      .update({
        is_revoked: true
      })
      .eq('token_hash', tokenHash)
      .select()
      .single();

    if (error) {
      throw new Error(`撤销令牌失败: ${error.message}`);
    }

    return data;
  }

  // 撤销用户的所有令牌 - 使用管理员权限
  static async revokeAllUserTokens(userId: string): Promise<void> {
    const { error } = await this.adminClient
      .from('user_tokens')
      .update({
        is_revoked: true
      })
      .eq('user_id', userId)
      .eq('is_revoked', false);

    if (error) {
      throw new Error(`撤销用户所有令牌失败: ${error.message}`);
    }
  }

  // 撤销用户特定类型的所有令牌 - 使用管理员权限
  static async revokeUserTokensByType(userId: string, tokenType: TokenType): Promise<void> {
    const { error } = await this.adminClient
      .from('user_tokens')
      .update({
        is_revoked: true
      })
      .eq('user_id', userId)
      .eq('token_type', tokenType)
      .eq('is_revoked', false);

    if (error) {
      throw new Error(`撤销用户特定类型令牌失败: ${error.message}`);
    }
  }

  // 验证令牌是否有效
  static async validateToken(tokenHash: string): Promise<UserToken | null> {
    const { data, error } = await this.supabase
      .from('user_tokens')
      .select('*')
      .eq('token_hash', tokenHash)
      .eq('is_revoked', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // 令牌无效或过期
      }
      throw new Error(`验证令牌失败: ${error.message}`);
    }

    return data;
  }

  // 清理过期的令牌 - 使用管理员权限
  static async cleanupExpiredTokens(): Promise<number> {
    const { data, error } = await this.adminClient
      .from('user_tokens')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select('id');

    if (error) {
      throw new Error(`清理过期令牌失败: ${error.message}`);
    }

    return data?.length || 0;
  }

  // 清理被撤销的令牌 - 使用管理员权限
  static async cleanupRevokedTokens(): Promise<number> {
    const { data, error } = await this.adminClient
      .from('user_tokens')
      .delete()
      .eq('is_revoked', true)
      .select('id');

    if (error) {
      throw new Error(`清理被撤销令牌失败: ${error.message}`);
    }

    return data?.length || 0;
  }

  // 获取用户活跃的令牌数量
  static async getActiveTokenCount(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('user_tokens')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_revoked', false)
      .gt('expires_at', new Date().toISOString());

    if (error) {
      throw new Error(`获取活跃令牌数量失败: ${error.message}`);
    }

    return count || 0;
  }

  // 获取用户活跃的刷新令牌
  static async getActiveRefreshTokens(userId: string): Promise<UserToken[]> {
    const { data, error } = await this.supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('token_type', 'refresh')
      .eq('is_revoked', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`获取活跃刷新令牌失败: ${error.message}`);
    }

    return data || [];
  }

  // 更新令牌设备信息 - 使用管理员权限
  static async updateDeviceInfo(tokenId: string, deviceInfo: Record<string, any>): Promise<UserToken> {
    const { data, error } = await this.adminClient
      .from('user_tokens')
      .update({
        device_info: deviceInfo
      })
      .eq('id', tokenId)
      .select()
      .single();

    if (error) {
      throw new Error(`更新令牌设备信息失败: ${error.message}`);
    }

    return data;
  }

  // 获取令牌统计信息
  static async getTokenStats(userId?: string): Promise<{
    total: number;
    active: number;
    expired: number;
    revoked: number;
    byType: Record<TokenType, number>;
  }> {
    let query = this.supabase
      .from('user_tokens')
      .select('*');

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`获取令牌统计信息失败: ${error.message}`);
    }

    const tokens = data || [];
    const now = new Date().toISOString();

    const stats = {
      total: tokens.length,
      active: tokens.filter(t => !t.is_revoked && t.expires_at > now).length,
      expired: tokens.filter(t => !t.is_revoked && t.expires_at <= now).length,
      revoked: tokens.filter(t => t.is_revoked).length,
      byType: {
        access: tokens.filter(t => t.token_type === 'access').length,
        refresh: tokens.filter(t => t.token_type === 'refresh').length
      } as Record<TokenType, number>
    };

    return stats;
  }
} 