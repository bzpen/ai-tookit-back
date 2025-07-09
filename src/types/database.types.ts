// Supabase 数据库类型定义
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          google_id: string;
          email: string;
          name: string;
          avatar_url: string | null;
          status: 'active' | 'inactive' | 'suspended';
          created_at: string;
          updated_at: string;
          last_login_at: string | null;
          email_verified: boolean;
          preferences: Record<string, any> | null;
        };
        Insert: {
          id?: string;
          google_id: string;
          email: string;
          name: string;
          avatar_url?: string | null;
          status?: 'active' | 'inactive' | 'suspended';
          created_at?: string;
          updated_at?: string;
          last_login_at?: string | null;
          email_verified?: boolean;
          preferences?: Record<string, any> | null;
        };
        Update: {
          id?: string;
          google_id?: string;
          email?: string;
          name?: string;
          avatar_url?: string | null;
          status?: 'active' | 'inactive' | 'suspended';
          created_at?: string;
          updated_at?: string;
          last_login_at?: string | null;
          email_verified?: boolean;
          preferences?: Record<string, any> | null;
        };
      };
      user_tokens: {
        Row: {
          id: string;
          user_id: string;
          token_type: 'access' | 'refresh';
          token_hash: string;
          expires_at: string;
          created_at: string;
          is_revoked: boolean;
          device_info: Record<string, any> | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          token_type: 'access' | 'refresh';
          token_hash: string;
          expires_at: string;
          created_at?: string;
          is_revoked?: boolean;
          device_info?: Record<string, any> | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          token_type?: 'access' | 'refresh';
          token_hash?: string;
          expires_at?: string;
          created_at?: string;
          is_revoked?: boolean;
          device_info?: Record<string, any> | null;
        };
      };
      login_logs: {
        Row: {
          id: string;
          user_id: string;
          login_method: 'google' | 'token_refresh';
          ip_address: string | null;
          user_agent: string | null;
          login_at: string;
          success: boolean;
          error_message: string | null;
          location: Record<string, any> | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          login_method: 'google' | 'token_refresh';
          ip_address?: string | null;
          user_agent?: string | null;
          login_at?: string;
          success?: boolean;
          error_message?: string | null;
          location?: Record<string, any> | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          login_method?: 'google' | 'token_refresh';
          ip_address?: string | null;
          user_agent?: string | null;
          login_at?: string;
          success?: boolean;
          error_message?: string | null;
          location?: Record<string, any> | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_status: 'active' | 'inactive' | 'suspended';
      token_type: 'access' | 'refresh';
      login_method: 'google' | 'token_refresh';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// 导出表类型的快捷方式
export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

export type UserToken = Database['public']['Tables']['user_tokens']['Row'];
export type UserTokenInsert = Database['public']['Tables']['user_tokens']['Insert'];
export type UserTokenUpdate = Database['public']['Tables']['user_tokens']['Update'];

export type LoginLog = Database['public']['Tables']['login_logs']['Row'];
export type LoginLogInsert = Database['public']['Tables']['login_logs']['Insert'];
export type LoginLogUpdate = Database['public']['Tables']['login_logs']['Update'];

// 枚举类型
export type UserStatus = Database['public']['Enums']['user_status'];
export type TokenType = Database['public']['Enums']['token_type'];
export type LoginMethod = Database['public']['Enums']['login_method']; 