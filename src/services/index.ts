// 服务层聚合导出
// 用于统一管理和导出所有服务类

export { AuthService } from './auth.service';
export { UserService } from './user.service';
export { LogService } from './log.service';

// 服务类型导出（如果需要）
export type { 
  // 可以在这里导出服务相关的类型定义
} from './auth.service';

/**
 * 服务初始化函数
 * 可用于在应用启动时初始化服务
 */
export const initializeServices = async (): Promise<void> => {
  try {
    // 在这里可以添加服务初始化逻辑
    // 例如：清理过期令牌、初始化定时任务等
    
    console.log('✅ 服务层初始化完成');
  } catch (error) {
    console.error('❌ 服务层初始化失败:', error);
    throw error;
  }
};

/**
 * 服务清理函数
 * 可用于在应用关闭时清理服务资源
 */
export const cleanupServices = async (): Promise<void> => {
  try {
    // 在这里可以添加服务清理逻辑
    // 例如：关闭连接、清理临时数据等
    
    console.log('✅ 服务层清理完成');
  } catch (error) {
    console.error('❌ 服务层清理失败:', error);
    throw error;
  }
};
