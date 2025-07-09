import { AuthConfig } from './auth.config';

export { AppConfig } from './app.config';
export { DatabaseConfig } from './database.config';
export { AuthConfig } from './auth.config';

// 简化的配置验证函数 - 只验证核心功能
export const validateConfigs = () => {
  const errors: string[] = [];
  
  // 验证JWT配置
  if (!AuthConfig.validateJWT()) {
    errors.push('JWT配置无效');
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
  console.log('🔐 认证: JWT');
}; 