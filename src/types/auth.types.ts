import { BaseModel } from './common.types';

// Google OAuth 相关类型
export interface GoogleProfile {
  id: string;
  email: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  verified_email: boolean;
  locale?: string;
}

export interface GoogleAuthResponse {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expires_in: number;
  profile: GoogleProfile;
}

// JWT 相关类型
export interface JwtPayload {
  userId: string;
  email: string;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

// 登录相关类型
export interface LoginRequest {
  provider: 'google';
  code: string;
  redirectUri: string;
}

export interface LoginResponse {
  user: UserProfile;
  tokens: AuthTokens;
  isFirstLogin: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'suspended';
  role: 'user' | 'admin';
  emailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// 令牌相关类型
export interface TokenValidationResult {
  valid: boolean;
  payload?: JwtPayload;
  error?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
}

// 用户令牌表相关类型
export interface UserToken extends BaseModel {
  userId: string;
  token: string;
  type: 'access' | 'refresh';
  expiresAt: Date;
  isRevoked: boolean;
  revokedAt?: Date;
  userAgent?: string;
  ipAddress?: string;
}

export interface CreateUserTokenRequest {
  userId: string;
  token: string;
  type: 'access' | 'refresh';
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
}

// 登录日志相关类型
export interface LoginLog extends BaseModel {
  userId: string;
  provider: 'google';
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  error?: string;
  sessionId?: string;
}

export interface CreateLoginLogRequest {
  userId: string;
  provider: 'google';
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  error?: string;
  sessionId?: string;
}

// 权限相关类型
export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

// 会话相关类型
export interface Session {
  id: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
  isActive: boolean;
}

export interface CreateSessionRequest {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
}

// 中间件相关类型
export interface AuthMiddlewareOptions {
  required?: boolean;
  roles?: string[];
  permissions?: string[];
}

export interface AuthenticatedRequest {
  user: JwtPayload;
  token: string;
  session?: Session;
}

// 错误类型
export enum AuthErrorCode {
  INVALID_TOKEN = 'INVALID_TOKEN',
  EXPIRED_TOKEN = 'EXPIRED_TOKEN',
  REVOKED_TOKEN = 'REVOKED_TOKEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  GOOGLE_AUTH_ERROR = 'GOOGLE_AUTH_ERROR',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_INACTIVE = 'USER_INACTIVE',
  USER_SUSPENDED = 'USER_SUSPENDED',
  INVALID_REFRESH_TOKEN = 'INVALID_REFRESH_TOKEN',
  SESSION_EXPIRED = 'SESSION_EXPIRED'
}

export interface AuthError {
  code: AuthErrorCode;
  message: string;
  details?: any;
}

// 配置相关类型
export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
  refreshExpiresIn: string;
  issuer: string;
  audience: string;
}

export interface AuthConfig {
  google: GoogleOAuthConfig;
  jwt: JwtConfig;
  sessionDuration: number;
  maxSessions: number;
  passwordMinLength: number;
  passwordRequireSpecialChars: boolean;
}

// 扩展 Express Request 类型
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      token?: string;
      session?: Session;
    }
  }
} 