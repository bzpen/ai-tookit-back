// 导入配置和验证函数
import { 
  validateAuthConfig,
  initializeAuthConfig
} from './auth.config';
import { 
  validateGoogleConfig,
  initializeGoogleConfig
} from './google.config';

// 导出所有配置
export { AppConfig } from './app.config';
export { DatabaseConfig } from './database.config';
export { 
  jwtConfig, 
  sessionConfig, 
  authConfig, 
  rateLimitConfig, 
  corsConfig, 
  securityConfig,
  validateAuthConfig,
  initializeAuthConfig,
  getEnvironmentConfig
} from './auth.config';
export { 
  googleConfig, 
  googleApiEndpoints, 
  googleErrorMessages,
  getGoogleAuthUrl,
  parseGoogleError,
  validateGoogleConfig,
  initializeGoogleConfig,
  isDevelopment,
  isProduction
} from './google.config';

// 简化的配置验证函数 - 只验证核心功能
export const validateConfigs = () => {
  const errors: string[] = [];
  
  // 验证认证配置
  try {
    validateAuthConfig();
  } catch (error) {
    errors.push('认证配置无效');
  }
  
  // 验证Google OAuth配置
  try {
    validateGoogleConfig();
  } catch (error) {
    errors.push('Google OAuth配置无效');
  }
  
  // 验证Supabase配置
  if (!process.env['SUPABASE_URL'] || !process.env['SUPABASE_ANON_KEY']) {
    errors.push('Supabase配置缺失');
  }
  
  if (errors.length > 0) {
    throw new Error(`配置错误：${errors.join(', ')}`);
  }
  
  console.log('✅ 核心配置验证通过');
  console.log('📊 数据库: Supabase');
  console.log('🔐 认证: JWT + Google OAuth');
  console.log('🛡️  会话: Express Session');
};

// 初始化所有配置
export const initializeAllConfigs = () => {
  try {
    initializeAuthConfig();
    initializeGoogleConfig();
    validateConfigs();
    console.log('🚀 所有配置初始化完成');
  } catch (error) {
    console.error('❌ 配置初始化失败:', error instanceof Error ? error.message : error);
    if (process.env['NODE_ENV'] === 'production') {
      process.exit(1);
    }
  }
}; 