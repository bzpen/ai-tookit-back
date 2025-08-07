import { Router } from "express";
import { AuthController } from "../../controllers/auth.controller";
import { verifyToken, optionalAuth } from "../../middleware/auth.middleware";

const router = Router();

// CORS预检请求由全局中间件处理，无需在此重复配置

/**
 * Google OAuth 登录路由
 * GET /api/v1/auth/google
 *
 * 发起 Google OAuth 登录请求
 */
router.get("/google", AuthController.googleLogin);

/**
 * Google OAuth 回调路由
 * GET /api/v1/auth/google/callback
 *
 * 处理 Google OAuth 回调
 */
router.get("/google/callback", AuthController.googleCallback);

/**
 * 用户登出路由
 * POST /api/v1/auth/logout
 *
 * 用户登出，清除会话
 */
router.post("/logout", optionalAuth, AuthController.logout);

/**
 * 获取当前用户信息路由
 * GET /api/v1/auth/me
 *
 * 获取当前登录用户的信息
 */
router.get("/me", verifyToken, AuthController.getCurrentUser);

/**
 * 刷新 Token 路由
 * POST /api/v1/auth/refresh
 *
 * 刷新访问令牌
 */
router.post("/refresh", verifyToken, AuthController.refreshToken);

/**
 * 健康检查路由
 * GET /api/v1/auth/health
 *
 * 认证模块健康检查
 */
router.get("/health", (_req, res) => {
  res.json({
    status: "healthy",
    module: "auth",
    timestamp: new Date().toISOString(),
  });
});

export const authRoutes: Router = router;
