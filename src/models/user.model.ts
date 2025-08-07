import { DatabaseConfig } from "../config/database.config";
import type {
  User,
  UserInsert,
  UserUpdate,
  UserStatus,
} from "@/types/database.types";

export class UserModel {
  private static get supabase() {
    return DatabaseConfig.supabase;
  }

  // 管理员客户端，用于绕过RLS策略
  private static get adminClient() {
    return DatabaseConfig.admin;
  }

  // 创建用户 - 使用管理员权限绕过RLS
  static async create(userData: UserInsert): Promise<User> {
    const { data, error } = await this.adminClient
      .from("users")
      .insert({
        ...userData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`创建用户失败: ${error.message}`);
    }

    return data;
  }

  // 根据ID获取用户
  static async findById(id: string): Promise<User | null> {
    const { data, error } = await this.adminClient
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // 用户不存在
      }
      throw new Error(`查询用户失败: ${error.message}`);
    }

    return data;
  }

  // 根据Google ID获取用户
  static async findByGoogleId(googleId: string): Promise<User | null> {
    const { data, error } = await this.adminClient
      .from("users")
      .select("*")
      .eq("google_id", googleId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // 用户不存在
      }
      throw new Error(`查询用户失败: ${error.message}`);
    }

    return data;
  }

  // 根据邮箱获取用户
  static async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.adminClient
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // 用户不存在
      }
      throw new Error(`查询用户失败: ${error.message}`);
    }

    return data;
  }

  // 更新用户信息 - 使用管理员权限
  static async update(id: string, userData: UserUpdate): Promise<User> {
    const { data, error } = await this.adminClient
      .from("users")
      .update({
        ...userData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`更新用户失败: ${error.message}`);
    }

    return data;
  }

  // 更新最后登录时间 - 使用管理员权限
  static async updateLastLogin(id: string): Promise<User> {
    const { data, error } = await this.adminClient
      .from("users")
      .update({
        last_login_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`更新最后登录时间失败: ${error.message}`);
    }

    return data;
  }

  // 更新用户状态 - 使用管理员权限
  static async updateStatus(id: string, status: UserStatus): Promise<User> {
    const { data, error } = await this.adminClient
      .from("users")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`更新用户状态失败: ${error.message}`);
    }

    return data;
  }

  // 验证用户邮箱 - 使用管理员权限
  static async verifyEmail(id: string): Promise<User> {
    const { data, error } = await this.adminClient
      .from("users")
      .update({
        email_verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`验证邮箱失败: ${error.message}`);
    }

    return data;
  }

  // 更新用户偏好设置 - 使用管理员权限
  static async updatePreferences(
    id: string,
    preferences: Record<string, any>
  ): Promise<User> {
    const { data, error } = await this.adminClient
      .from("users")
      .update({
        preferences,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`更新用户偏好设置失败: ${error.message}`);
    }

    return data;
  }

  // 删除用户（软删除，修改状态为 inactive）- 使用管理员权限
  static async softDelete(id: string): Promise<User> {
    const { data, error } = await this.adminClient
      .from("users")
      .update({
        status: "inactive" as UserStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`删除用户失败: ${error.message}`);
    }

    return data;
  }

  // 获取用户列表（管理员功能）
  static async findAll(
    page: number = 1,
    limit: number = 10,
    filters?: {
      status?: UserStatus;
      search?: string;
    }
  ): Promise<{
    users: User[];
    total: number;
    page: number;
    limit: number;
  }> {
    let query = this.supabase.from("users").select("*", { count: "exact" });

    // 应用过滤器
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
      );
    }

    // 分页
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`获取用户列表失败: ${error.message}`);
    }

    return {
      users: data || [],
      total: count || 0,
      page,
      limit,
    };
  }

  // 检查用户是否存在
  static async exists(id: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("users")
      .select("id")
      .eq("id", id)
      .single();

    return !error && !!data;
  }

  // 根据 Google ID 创建或更新用户
  static async createOrUpdate(userData: UserInsert): Promise<User> {
    const existingUser = await this.findByGoogleId(userData.google_id);

    if (existingUser) {
      // 更新现有用户信息
      return await this.update(existingUser.id, {
        name: userData.name,
        email: userData.email,
        avatar_url: userData.avatar_url || null,
        last_login_at: new Date().toISOString(),
      });
    } else {
      // 创建新用户
      return await this.create(userData);
    }
  }
}
