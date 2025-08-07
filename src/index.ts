// 注册模块别名（必须在其他导入之前）
import "module-alias/register";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import dotenv from "dotenv";
import session from "express-session";
import passport from "passport";

import { AppConfig } from "./config/app.config";
import { DatabaseConfig } from "./config/database.config";
import { sessionConfig } from "./config/auth.config";
import { validateConfigs } from "./config";
import { routes } from "./routes/index";
import { ErrorMiddleware } from "./middleware/error.middleware";
import { LoggerMiddleware } from "./middleware/logger.middleware";
import { initializePassport } from "./middleware/passport.middleware";
import { LoggerUtil } from "./utils/logger.util";

// 加载环境变量
dotenv.config();

class App {
  private app: express.Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = AppConfig.port;
    this.initializeMiddlewares();
    this.initializeAuthentication();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // 安全中间件
    this.app.use(helmet());

    // 启用CORS
    this.app.use(
      cors({
        origin: (origin, callback) => {
          // 允许没有origin的请求（如移动端应用）
          if (!origin) return callback(null, true);

          const allowedOrigins = Array.isArray(AppConfig.cors.origin)
            ? AppConfig.cors.origin
            : [AppConfig.cors.origin];

          if (allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            LoggerUtil.warn(`CORS blocked origin: ${origin}`);
            callback(new Error("Not allowed by CORS"));
          }
        },
        credentials: AppConfig.cors.credentials,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
        optionsSuccessStatus: 200,
      })
    );

    // 压缩响应
    this.app.use(compression());

    // 日志中间件
    this.app.use(morgan("combined"));
    this.app.use(LoggerMiddleware.requestLogger);

    // 解析JSON和URL编码的请求体
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // 静态文件服务
    this.app.use("/uploads", express.static("uploads"));
  }

  private initializeAuthentication(): void {
    // 会话配置
    this.app.use(session(sessionConfig));

    // 初始化Passport
    this.app.use(passport.initialize());
    this.app.use(passport.session());

    // 配置Passport策略
    initializePassport();
  }

  private initializeRoutes(): void {
    // 健康检查
    this.app.get("/health", (_req, res) => {
      res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });

    // API路由
    this.app.use("/api", routes);

    // 404处理
    this.app.use("*", (req, res) => {
      res.status(404).json({
        error: "接口不存在",
        path: req.originalUrl,
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(ErrorMiddleware.errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // 验证配置
      LoggerUtil.info("正在验证配置...");
      validateConfigs();

      // 初始化数据库
      LoggerUtil.info("正在初始化数据库...");
      await DatabaseConfig.initialize();

      // 启动服务器
      this.app.listen(this.port, () => {
        LoggerUtil.info(`服务器启动成功，端口: ${this.port}`);
        LoggerUtil.info(`环境: ${process.env["NODE_ENV"] || "development"}`);
        LoggerUtil.info(`健康检查: http://localhost:${this.port}/health`);
        LoggerUtil.info(
          `Google OAuth: http://localhost:${this.port}/api/v1/auth/google`
        );
        LoggerUtil.info(
          `数据库: ${process.env["SUPABASE_URL"] ? "Supabase" : "Local SQLite"}`
        );
      });
    } catch (error) {
      LoggerUtil.error("服务器启动失败:", error);
      process.exit(1);
    }
  }
}

// 启动应用
const app = new App();
app.start().catch((error) => {
  LoggerUtil.error("应用启动失败:", error);
  process.exit(1);
});

// 优雅关闭
process.on("SIGTERM", () => {
  LoggerUtil.info("收到SIGTERM信号，正在关闭服务器...");
  process.exit(0);
});

process.on("SIGINT", () => {
  LoggerUtil.info("收到SIGINT信号，正在关闭服务器...");
  process.exit(0);
});

export default app;
