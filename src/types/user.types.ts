import { BaseModel } from "./common.types";
import type { UserStatus } from "./database.types";

// 统一的用户信息响应接口
export interface UserInfoResponse {
  id: string;
  google_id: string;
  email: string;
  name: string;
  avatar_url?: string | null;
  status: UserStatus;
  created_at: string;
  updated_at: string;
  last_login_at?: string | null;
  email_verified: boolean;
  preferences?: Record<string, any> | null;
}

// 兼容旧接口的用户定义
export interface User extends BaseModel {
  username: string;
  email: string;
  password: string;
  avatar?: string;
  status: "active" | "inactive" | "suspended";
  role: "user" | "admin";
  lastLoginAt?: Date;
  emailVerified: boolean;
  emailVerifiedAt?: Date;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  avatar?: string;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  avatar?: string;
}

export interface LoginResponse {
  user: Omit<User, "password">;
  tokens: AuthTokens;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserStats {
  userId: string;
  creditBalance: number;
  frozenCredits: number;
  totalCreditsUsed: number;
  totalPredictions: number;
  totalImages: number;
  joinedAt: Date;
  lastLoginAt?: Date;
}

export interface UserUsageStats {
  totalPredictions: number;
  totalImages: number;
  totalCreditsUsed: number;
}

// Express Request扩展已在 auth.types.ts 中定义，此处删除以避免冲突
