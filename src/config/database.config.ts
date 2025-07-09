import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

export class DatabaseConfig {
  private static client: SupabaseClient<Database>;

  static get supabase(): SupabaseClient<Database> {
    if (!this.client) {
      throw new Error('Supabase 客户端未初始化');
    }
    return this.client;
  }

  static async initialize(): Promise<void> {
    try {
      const supabaseUrl = process.env['SUPABASE_URL'];
      const supabaseKey = process.env['SUPABASE_ANON_KEY'];

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase 配置不完整，请检查环境变量');
      }

      this.client = createClient<Database>(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false
        }
      });

      // 测试连接
      const { error } = await this.client.from('users').select('count').limit(1);
      if (error && error.code !== 'PGRST116') { // PGRST116 是表不存在的错误码
        throw error;
      }

      console.log('Supabase 数据库连接成功');
    } catch (error) {
      console.error('Supabase 数据库初始化失败:', error);
      throw error;
    }
  }

  static async close(): Promise<void> {
    // Supabase 客户端不需要手动关闭连接
    console.log('Supabase 连接已清理');
  }

  static async healthCheck(): Promise<boolean> {
    try {
      const { error } = await this.client
        .from('users')
        .select('id')
        .limit(1);
      
      return !error;
    } catch (error) {
      console.error('数据库健康检查失败:', error);
      return false;
    }
  }
} 