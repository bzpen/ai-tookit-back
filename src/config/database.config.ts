import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export class DatabaseConfig {
  private static client: SupabaseClient<Database>;
  private static adminClient: SupabaseClient<Database>;

  static get supabase(): SupabaseClient<Database> {
    if (!this.client) {
      throw new Error("Supabase 客户端未初始化");
    }
    return this.client;
  }

  // 服务端管理员客户端，绕过RLS策略
  static get admin(): SupabaseClient<Database> {
    if (!this.adminClient) {
      throw new Error("Supabase 管理员客户端未初始化");
    }
    return this.adminClient;
  }

  static async initialize(): Promise<void> {
    try {
      const supabaseUrl = process.env["SUPABASE_URL"];
      const supabaseAnonKey = process.env["SUPABASE_ANON_KEY"];
      const supabaseServiceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase 基础配置不完整，请检查环境变量");
      }

      if (!supabaseServiceKey) {
        throw new Error("Supabase 服务端密钥缺失，请设置 SUPABASE_SERVICE_ROLE_KEY 环境变量");
      }

      // 初始化客户端客户端（普通操作）
      this.client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      });

      // 初始化管理员客户端（绕过RLS）
      this.adminClient = createClient<Database>(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
          storageKey: 'sb-admin-auth-token' // 不同的存储键避免冲突
        },
      });

      // 测试连接 - 使用管理员客户端
      const { error } = await this.adminClient
        .from("users")
        .select("count")
        .limit(1);
      if (error) {
        if (error.code === "42P01") {
          // 表不存在的错误码
          console.warn("⚠️  数据库表不存在，请运行初始化脚本创建表结构");
          console.warn("📋 请执行: pnpm run db:init");
        } else {
          throw error;
        }
      } else {
        console.log("✅ Supabase 数据库连接成功");
        console.log("✅ Supabase 管理员权限已配置");
      }
    } catch (error) {
      console.error("Supabase 数据库初始化失败:", error);
      throw error;
    }
  }

  static async close(): Promise<void> {
    // Supabase 客户端不需要手动关闭连接
    console.log("Supabase 连接已清理");
  }

  static async healthCheck(): Promise<boolean> {
    try {
      const { error } = await this.adminClient.from("users").select("id").limit(1);

      if (error && error.code === "42P01") {
        // 表不存在，但连接正常
        return true;
      }

      return !error;
    } catch (error) {
      console.error("数据库健康检查失败:", error);
      return false;
    }
  }
}
