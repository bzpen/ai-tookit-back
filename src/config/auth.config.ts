import dotenv from "dotenv";
import { AuthConfig, JwtConfig } from "../types/auth.types";
import { googleConfig } from "./google.config";

// 加载环境变量
dotenv.config();

/**
 * JWT 配置
 */
export const jwtConfig: JwtConfig = {
  secret:
    process.env["JWT_SECRET"] || "your_jwt_secret_key_minimum_32_characters",
  expiresIn: process.env["JWT_EXPIRES_IN"] || "1h",
  refreshExpiresIn: process.env["JWT_REFRESH_EXPIRES_IN"] || "7d",
  issuer: process.env["JWT_ISSUER"] || "test-back-api",
  audience: process.env["JWT_AUDIENCE"] || "test-back-client",
};

/**
 * 会话配置
 */
export const sessionConfig = {
  secret:
    process.env["SESSION_SECRET"] ||
    "your_session_secret_key_minimum_32_characters",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env["NODE_ENV"] === "production",
    httpOnly: true,
    maxAge: parseInt(process.env["SESSION_MAX_AGE"] || "86400000", 10), // 24 hours
    sameSite: "lax" as const,
  },
  name: "test-back-session",
};

/**
 * 完整的认证配置
 */
export const authConfig: AuthConfig = {
  google: googleConfig,
  jwt: jwtConfig,
  sessionDuration: parseInt(process.env["SESSION_DURATION"] || "86400000", 10), // 24 hours
  maxSessions: parseInt(process.env["MAX_SESSIONS"] || "5", 10),
  passwordMinLength: parseInt(process.env["PASSWORD_MIN_LENGTH"] || "8", 10),
  passwordRequireSpecialChars:
    process.env["PASSWORD_REQUIRE_SPECIAL_CHARS"] === "true",
};

/**
 * 速率限制配置
 */
export const rateLimitConfig = {
  // 登录速率限制
  login: {
    windowMs: parseInt(process.env["LOGIN_RATE_WINDOW"] || "900000", 10), // 15 minutes
    max: parseInt(process.env["LOGIN_RATE_MAX"] || "5", 10), // 5 attempts
    message: "登录尝试次数过多，请稍后再试",
    standardHeaders: true,
    legacyHeaders: false,
  },
  // API 通用速率限制
  api: {
    windowMs: parseInt(process.env["API_RATE_WINDOW"] || "60000", 10), // 1 minute
    max: parseInt(process.env["API_RATE_MAX"] || "100", 10), // 100 requests
    message: "API 请求频率过高，请稍后再试",
    standardHeaders: true,
    legacyHeaders: false,
  },
  // OAuth 回调速率限制
  oauth: {
    windowMs: parseInt(process.env["OAUTH_RATE_WINDOW"] || "300000", 10), // 5 minutes
    max: parseInt(process.env["OAUTH_RATE_MAX"] || "20", 10), // 20 attempts
    message: "OAuth 认证请求过多，请稍后再试",
    standardHeaders: true,
    legacyHeaders: false,
  },
};

/**
 * CORS 配置
 */
export const corsConfig = {
  origin: process.env["CORS_ORIGIN"]?.split(",") || [
    "http://localhost:3000",
    "https://ai-toolkit.org",
    "https://www.ai-toolkit.org",
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

/**
 * 安全配置
 */
export const securityConfig = {
  // 密码哈希配置
  bcrypt: {
    rounds: parseInt(process.env["BCRYPT_ROUNDS"] || "12", 10),
  },
  // CSRF 保护
  csrf: {
    enabled: process.env["CSRF_ENABLED"] !== "false",
    secret: process.env["CSRF_SECRET"] || "csrf-secret-key",
  },
  // 头部安全配置
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: [
          "'self'",
          "https://accounts.google.com",
          "https://oauth2.googleapis.com",
        ],
      },
    },
    crossOriginEmbedderPolicy: false,
  },
};

/**
 * 环境变量验证
 */
export const validateAuthConfig = (): void => {
  const errors: string[] = [];

  console.log("🔍 开始验证认证配置...");

  // 打印当前环境变量状态
  console.log("📋 当前环境变量状态:");
  console.log(`   NODE_ENV: ${process.env["NODE_ENV"] || "未设置"}`);
  console.log(
    `   JWT_SECRET: ${
      process.env["JWT_SECRET"]
        ? `已设置 (${process.env["JWT_SECRET"].length}字符)`
        : "未设置"
    }`
  );
  console.log(
    `   SESSION_SECRET: ${
      process.env["SESSION_SECRET"]
        ? `已设置 (${process.env["SESSION_SECRET"].length}字符)`
        : "未设置"
    }`
  );
  console.log(
    `   GOOGLE_CLIENT_ID: ${
      process.env["GOOGLE_CLIENT_ID"] ? "已设置" : "未设置"
    }`
  );
  console.log(
    `   GOOGLE_CLIENT_SECRET: ${
      process.env["GOOGLE_CLIENT_SECRET"] ? "已设置" : "未设置"
    }`
  );
  console.log(
    `   SUPABASE_URL: ${process.env["SUPABASE_URL"] ? "已设置" : "未设置"}`
  );
  console.log(
    `   SUPABASE_ANON_KEY: ${
      process.env["SUPABASE_ANON_KEY"] ? "已设置" : "未设置"
    }`
  );

  // 验证 JWT Secret
  console.log("🔐 验证JWT配置...");
  if (!jwtConfig.secret) {
    errors.push("JWT_SECRET 环境变量未设置");
  } else if (jwtConfig.secret === "your_jwt_secret_key_minimum_32_characters") {
    errors.push("JWT_SECRET 仍使用默认值，请设置真实的密钥");
  } else if (jwtConfig.secret.length < 32) {
    errors.push(
      `JWT_SECRET 长度不足 (当前: ${jwtConfig.secret.length}字符, 需要: 至少32字符)`
    );
  } else {
    console.log("   ✅ JWT_SECRET 验证通过");
  }

  // 验证 Session Secret
  console.log("🍪 验证Session配置...");
  if (!sessionConfig.secret) {
    errors.push("SESSION_SECRET 环境变量未设置");
  } else if (
    sessionConfig.secret === "your_session_secret_key_minimum_32_characters"
  ) {
    errors.push("SESSION_SECRET 仍使用默认值，请设置真实的密钥");
  } else if (sessionConfig.secret.length < 32) {
    errors.push(
      `SESSION_SECRET 长度不足 (当前: ${sessionConfig.secret.length}字符, 需要: 至少32字符)`
    );
  } else {
    console.log("   ✅ SESSION_SECRET 验证通过");
  }

  // 验证 Google OAuth 配置
  console.log("🔍 验证Google OAuth配置...");
  if (!authConfig.google.clientId) {
    console.log("   ⚠️  GOOGLE_CLIENT_ID 未设置 (Google OAuth功能将不可用)");
    // 不作为错误，因为Google OAuth是可选的
  } else {
    console.log("   ✅ GOOGLE_CLIENT_ID 已设置");
  }

  if (!authConfig.google.clientSecret) {
    console.log(
      "   ⚠️  GOOGLE_CLIENT_SECRET 未设置 (Google OAuth功能将不可用)"
    );
    // 不作为错误，因为Google OAuth是可选的
  } else {
    console.log("   ✅ GOOGLE_CLIENT_SECRET 已设置");
  }

  // 验证数据库配置
  console.log("🗄️  验证数据库配置...");
  if (!process.env["SUPABASE_URL"]) {
    errors.push("SUPABASE_URL 环境变量未设置");
  } else {
    console.log("   ✅ SUPABASE_URL 已设置");
  }

  if (!process.env["SUPABASE_ANON_KEY"]) {
    errors.push("SUPABASE_ANON_KEY 环境变量未设置");
  } else {
    console.log("   ✅ SUPABASE_ANON_KEY 已设置");
  }

  // 生产环境额外检查
  if (process.env["NODE_ENV"] === "production") {
    console.log("🚀 生产环境额外检查...");

    if (jwtConfig.secret === "your_jwt_secret_key_minimum_32_characters") {
      errors.push("生产环境不能使用默认的 JWT Secret");
    }

    if (
      sessionConfig.secret === "your_session_secret_key_minimum_32_characters"
    ) {
      errors.push("生产环境不能使用默认的 Session Secret");
    }

    if (!sessionConfig.cookie.secure) {
      console.warn("⚠️  生产环境建议启用 HTTPS 以确保 cookie 安全");
    }

    if (!authConfig.google.clientId || !authConfig.google.clientSecret) {
      console.warn("⚠️  生产环境建议配置 Google OAuth");
    }
  }

  if (errors.length > 0) {
    console.log("❌ 配置验证失败:");
    errors.forEach((error) => console.log(`   - ${error}`));
    throw new Error(
      `认证配置验证失败:\n${errors.map((err) => `  - ${err}`).join("\n")}`
    );
  }

  console.log("✅ 所有配置验证通过");
};

/**
 * 初始化认证配置
 */
export const initializeAuthConfig = (): void => {
  try {
    validateAuthConfig();
    console.log("✅ 认证配置验证成功");

    if (process.env["NODE_ENV"] === "development") {
      console.log("🔧 开发环境认证配置:");
      console.log(`   JWT Secret: ${jwtConfig.secret ? "已配置" : "未配置"}`);
      console.log(`   JWT 过期时间: ${jwtConfig.expiresIn}`);
      console.log(`   Session 过期时间: ${sessionConfig.cookie.maxAge}ms`);
      console.log(`   CORS 来源: ${corsConfig.origin}`);
    }
  } catch (error) {
    console.error(
      "❌ 认证配置验证失败:",
      error instanceof Error ? error.message : error
    );
    if (process.env["NODE_ENV"] === "production") {
      process.exit(1);
    }
  }
};

/**
 * 获取当前环境配置
 */
export const getEnvironmentConfig = () => {
  return {
    isDevelopment: process.env["NODE_ENV"] === "development",
    isProduction: process.env["NODE_ENV"] === "production",
    isTest: process.env["NODE_ENV"] === "test",
    port: parseInt(process.env["PORT"] || "3000", 10),
    host: process.env["HOST"] || "localhost",
  };
};
