import { BaseModel } from './common.types';

export interface User extends BaseModel {
  username: string;
  email: string;
  password: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'suspended';
  role: 'user' | 'admin';
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
  user: Omit<User, 'password'>;
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