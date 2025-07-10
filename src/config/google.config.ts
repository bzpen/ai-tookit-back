import { GoogleOAuthConfig } from '../types/auth.types';

/**
 * Google OAuth 2.0 配置
 */
export const googleConfig: GoogleOAuthConfig = {
  clientId: process.env['GOOGLE_CLIENT_ID'] || '',
  clientSecret: process.env['GOOGLE_CLIENT_SECRET'] || '',
  redirectUri: process.env['GOOGLE_REDIRECT_URI'] || 'http://localhost:3000/api/v1/auth/google/callback',
  scopes: [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email'
  ]
};

/**
 * Google OAuth 验证配置
 */
export const validateGoogleConfig = (): void => {
  const requiredFields = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];
  const missingFields = requiredFields.filter(field => !process.env[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required Google OAuth environment variables: ${missingFields.join(', ')}`);
  }
  
  // 验证 Client ID 格式
  if (googleConfig.clientId && !googleConfig.clientId.endsWith('.apps.googleusercontent.com')) {
    console.warn('Warning: Google Client ID should end with .apps.googleusercontent.com');
  }
  
  // 验证重定向 URI 格式
  if (googleConfig.redirectUri && !googleConfig.redirectUri.startsWith('http')) {
    throw new Error('Google redirect URI must start with http:// or https://');
  }
};

/**
 * Google API 端点配置
 */
export const googleApiEndpoints = {
  auth: 'https://accounts.google.com/o/oauth2/v2/auth',
  token: 'https://oauth2.googleapis.com/token',
  userInfo: 'https://www.googleapis.com/oauth2/v2/userinfo',
  revoke: 'https://oauth2.googleapis.com/revoke'
};

/**
 * Google OAuth 错误代码映射
 */
export const googleErrorMessages: Record<string, string> = {
  'access_denied': '用户拒绝了授权请求',
  'invalid_request': '请求参数无效',
  'invalid_client': '客户端认证失败',
  'invalid_grant': '授权码无效或已过期',
  'unsupported_grant_type': '不支持的授权类型',
  'invalid_scope': '请求的权限范围无效',
  'server_error': 'Google 服务器内部错误',
  'temporarily_unavailable': 'Google 服务暂时不可用'
};

/**
 * 获取 Google OAuth 授权 URL
 */
export const getGoogleAuthUrl = (state?: string): string => {
  const params = new URLSearchParams({
    client_id: googleConfig.clientId,
    redirect_uri: googleConfig.redirectUri,
    response_type: 'code',
    scope: googleConfig.scopes.join(' '),
    access_type: 'offline',
    prompt: 'consent'
  });
  
  if (state) {
    params.append('state', state);
  }
  
  return `${googleApiEndpoints.auth}?${params.toString()}`;
};

/**
 * 解析 Google 错误
 */
export const parseGoogleError = (error: string): string => {
  return googleErrorMessages[error] || `未知错误: ${error}`;
};

/**
 * Google 用户信息接口
 */
export interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

/**
 * Google OAuth Token 响应接口
 */
export interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
  id_token?: string;
}

/**
 * 开发环境配置检查
 */
export const isDevelopment = process.env['NODE_ENV'] === 'development';
export const isProduction = process.env['NODE_ENV'] === 'production';

/**
 * Google OAuth 配置验证和初始化
 */
export const initializeGoogleConfig = (): void => {
  try {
    validateGoogleConfig();
    console.log('✅ Google OAuth 配置验证成功');
    
    if (isDevelopment) {
      console.log('🔧 开发环境 Google OAuth 配置:');
      console.log(`   Client ID: ${googleConfig.clientId ? '已配置' : '未配置'}`);
      console.log(`   Redirect URI: ${googleConfig.redirectUri}`);
      console.log(`   Scopes: ${googleConfig.scopes.join(', ')}`);
    }
  } catch (error) {
    console.error('❌ Google OAuth 配置验证失败:', error instanceof Error ? error.message : error);
    if (isProduction) {
      process.exit(1);
    }
  }
}; 