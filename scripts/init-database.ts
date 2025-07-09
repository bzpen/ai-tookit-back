import { Database } from '../src/models/database';
import fs from 'fs';
import path from 'path';

const SQL_SCRIPT_PATH = path.join(__dirname, 'create_database_tables.sql');

async function initializeDatabase() {
  try {
    console.log('🚀 开始初始化数据库...');

    // 检查环境变量
    const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`缺少环境变量: ${envVar}`);
      }
    }

    // 初始化数据库连接
    await Database.initialize();
    console.log('✅ 数据库连接成功');

    // 检查数据库表是否存在
    const migrationCheck = await Database.checkMigrations();
    console.log(`📋 数据库检查: ${migrationCheck.message}`);

    if (!migrationCheck.tablesExist) {
      console.log('⚠️  数据库表不存在，请手动执行以下 SQL 脚本：');
      console.log(`📁 SQL 脚本位置: ${SQL_SCRIPT_PATH}`);
      
      // 读取并显示 SQL 脚本内容
      if (fs.existsSync(SQL_SCRIPT_PATH)) {
        const sqlScript = fs.readFileSync(SQL_SCRIPT_PATH, 'utf8');
        console.log('\n📝 请在 Supabase 控制台的 SQL 编辑器中执行以下脚本：');
        console.log('=' .repeat(50));
        console.log(sqlScript);
        console.log('=' .repeat(50));
      } else {
        console.log('❌ 找不到 SQL 脚本文件');
      }
      
      console.log('\n📋 Supabase 控制台操作步骤：');
      console.log('1. 登录 Supabase 控制台: https://app.supabase.com');
      console.log('2. 选择您的项目');
      console.log('3. 点击左侧菜单的 "SQL Editor"');
      console.log('4. 创建新查询并粘贴上述 SQL 脚本');
      console.log('5. 点击 "Run" 执行脚本');
      
      return;
    }

    // 运行健康检查
    const isHealthy = await Database.healthCheck();
    if (isHealthy) {
      console.log('✅ 数据库健康检查通过');
    } else {
      console.log('❌ 数据库健康检查失败');
      return;
    }

    // 获取数据库统计信息
    const stats = await Database.getStats();
    console.log('📊 数据库统计信息:');
    console.log(`   用户总数: ${stats.users.total}`);
    console.log(`   令牌总数: ${stats.tokens.total}`);
    console.log(`   登录日志总数: ${stats.loginLogs.totalLogins}`);

    console.log('\n🎉 数据库初始化完成！');
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    console.error('\n🔧 故障排除建议:');
    console.error('1. 检查环境变量是否正确配置');
    console.error('2. 确认 Supabase 项目是否正常运行');
    console.error('3. 检查网络连接是否正常');
    console.error('4. 验证 Supabase API 密钥是否有效');
    process.exit(1);
  } finally {
    await Database.close();
  }
}

async function cleanupDatabase() {
  try {
    console.log('🧹 开始清理数据库...');
    
    await Database.initialize();
    const result = await Database.cleanup();
    
    console.log('✅ 数据库清理完成:');
    console.log(`   清理过期令牌: ${result.expiredTokens} 个`);
    console.log(`   清理撤销令牌: ${result.revokedTokens} 个`);
    console.log(`   清理旧日志: ${result.oldLogs} 条`);
    
  } catch (error) {
    console.error('❌ 数据库清理失败:', error);
    process.exit(1);
  } finally {
    await Database.close();
  }
}

// 检查命令行参数
const command = process.argv[2];

switch (command) {
  case 'init':
    initializeDatabase();
    break;
  case 'cleanup':
    cleanupDatabase();
    break;
  default:
    console.log('📋 可用命令:');
    console.log('  npm run db:init    - 初始化数据库');
    console.log('  npm run db:cleanup - 清理数据库');
    console.log('');
    console.log('💡 使用示例:');
    console.log('  pnpm run db:init');
    console.log('  pnpm run db:cleanup');
} 