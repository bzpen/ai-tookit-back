import dotenv from "dotenv";
import { DatabaseConfig } from "../src/config/database.config";

// 加载测试环境变量
dotenv.config({ path: ".env.test" });

// 设置测试环境变量
process.env["NODE_ENV"] = "test";
process.env["JWT_SECRET"] = "test_jwt_secret_key_for_testing_only_32_chars";
process.env["SESSION_SECRET"] =
  "test_session_secret_key_for_testing_only_32_chars";

// 如果没有设置测试数据库，使用内存数据库
if (!process.env["SUPABASE_URL"]) {
  process.env["SUPABASE_URL"] = "http://localhost:54321";
  process.env["SUPABASE_ANON_KEY"] = "test_anon_key";
  process.env["SUPABASE_SERVICE_ROLE_KEY"] = "test_service_role_key";
}

// 设置测试超时
jest.setTimeout(30000);

// 全局测试设置
beforeAll(async () => {
  console.log("🧪 测试环境初始化...");

  // 初始化数据库连接（仅用于测试）
  try {
    await DatabaseConfig.initialize();
    console.log("✅ 测试数据库连接成功");
  } catch (error) {
    console.warn("⚠️  测试数据库连接失败，使用Mock数据:", error);
  }
});

afterAll(async () => {
  console.log("🧹 清理测试环境...");

  // 清理数据库连接
  try {
    await DatabaseConfig.close();
    console.log("✅ 测试数据库连接已关闭");
  } catch (error) {
    console.warn("⚠️  关闭测试数据库连接失败:", error);
  }
});

// 全局错误处理
process.on("unhandledRejection", (reason) => {
  console.error("测试中未处理的Promise拒绝:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("测试中未捕获的异常:", error);
});

// 导出测试工具
export const testUtils = {
  // 生成测试用户数据
  generateTestUser: (overrides: any = {}) => ({
    id: "test-user-id",
    googleId: "test-google-id",
    email: "test@example.com",
    name: "Test User",
    avatarUrl: "https://example.com/avatar.jpg",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    emailVerified: true,
    preferences: {},
    ...overrides,
  }),

  // 生成测试JWT令牌
  generateTestToken: () => "test-jwt-token",

  // 等待异步操作
  sleep: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),

  // 清理测试数据
  cleanupTestData: async () => {
    // 这里可以添加清理测试数据的逻辑
    console.log("🧹 清理测试数据...");
  },
};
