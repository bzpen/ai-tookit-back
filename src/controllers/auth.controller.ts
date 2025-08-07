import { Request, Response, NextFunction } from "express";
import passport from "passport";
import { jwtConfig } from "../config/auth.config";
import { googleConfig } from "../config/google.config";
import { ResponseUtil } from "../utils/response.util";
import { LoggerUtil } from "../utils/logger.util";
import { CryptoUtil } from "../utils/crypto.util";
import { UserService } from "../services/user.service";
import type { UserInfoResponse } from "../types/user.types";

/**
 * 认证控制器
 */
export class AuthController {
  /**
   * 发起 Google OAuth 登录
   */
  public static googleLogin(
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    LoggerUtil.info("发起 Google OAuth 登录请求", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });

    // 构建认证参数
    const authOptions: any = {
      scope: googleConfig.scopes,
      accessType: "offline",
      prompt: "consent",
    };

    // 只有当 state 存在且不为空时才添加
    if (req.query["state"]) {
      authOptions.state = req.query["state"] as string;
    }

    // 使用 Passport Google OAuth 策略
    passport.authenticate("google", authOptions)(req, res, next);
  }

  /**
   * Google OAuth 回调处理
   */
  public static async googleCallback(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      passport.authenticate(
        "google",
        {
          failureRedirect: "/login?error=oauth_failed",
          session: false,
        },
        async (err: any, user: any, info: any) => {
          if (err) {
            LoggerUtil.error("Google OAuth 回调错误", { error: err });
            return res.redirect("/login?error=oauth_error");
          }

          if (!user) {
            LoggerUtil.warn("Google OAuth 未返回用户信息", { info });
            return res.redirect("/login?error=no_user");
          }

          try {
            // 生成 JWT token
            const token = CryptoUtil.generateJWTToken(
              {
                userId: user.id,
                email: user.email,
                username: user.username || user.email,
                role: user.role || "user",
              },
              jwtConfig.secret
            );

            // 记录登录日志
            LoggerUtil.info("用户登录成功", {
              userId: user.id,
              email: user.email,
              provider: "google",
              ip: req.ip,
            });

            // 重定向到前端，携带 token
            const redirectUrl =
              process.env["FRONTEND_URL"] || "http://localhost:3000";
            res.redirect(`${redirectUrl}/auth/success?token=${token}`);
          } catch (tokenError) {
            LoggerUtil.error("Token 生成失败", { error: tokenError });
            res.redirect("/login?error=token_error");
          }
        }
      )(req, res, next);
    } catch (error) {
      LoggerUtil.error("Google OAuth 回调处理失败", { error });
      res.redirect("/login?error=callback_error");
    }
  }

  /**
   * 用户登出
   */
  public static async logout(req: Request, res: Response): Promise<void> {
    try {
      const user = req.authUser;

      // 记录登出日志
      if (user) {
        LoggerUtil.info("用户登出", {
          userId: user.userId,
          email: user.email,
          ip: req.ip,
        });
      }

      // 清除会话
      req.logout((err) => {
        if (err) {
          LoggerUtil.error("登出时清除会话失败", { error: err });
        }
      });

      ResponseUtil.success(res, null, "登出成功");
    } catch (error) {
      LoggerUtil.error("登出失败", { error });
      ResponseUtil.error(res, "登出失败", 500);
    }
  }

  /**
   * 获取当前用户信息
   */
  public static async getCurrentUser(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const user = req.authUser;

      if (!user) {
        ResponseUtil.unauthorized(res, "用户未登录");
        return;
      }

      // 从数据库获取完整的用户信息
      const fullUser = await UserService.getUserById(user.userId);

      if (!fullUser) {
        ResponseUtil.error(res, "用户信息不存在", 404);
        return;
      }

      const userInfo: UserInfoResponse = {
        id: fullUser.id,
        google_id: fullUser.google_id,
        email: fullUser.email,
        name: fullUser.name,
        avatar_url: fullUser.avatar_url,
        status: fullUser.status,
        created_at: fullUser.created_at,
        updated_at: fullUser.updated_at,
        last_login_at: fullUser.last_login_at,
        email_verified: fullUser.email_verified,
        preferences: fullUser.preferences,
      };

      ResponseUtil.success(
        res,
        {
          user: userInfo,
        },
        "获取用户信息成功"
      );
    } catch (error) {
      LoggerUtil.error("获取用户信息失败", { error });
      ResponseUtil.error(res, "获取用户信息失败", 500);
    }
  }

  /**
   * 刷新 Token
   */
  public static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const user = req.authUser;

      if (!user) {
        ResponseUtil.unauthorized(res, "用户未登录");
        return;
      }

      // 生成新的 token
      const newToken = CryptoUtil.generateJWTToken(
        {
          userId: user.userId,
          email: user.email,
          username: user.username,
          role: user.role,
        },
        jwtConfig.secret
      );

      LoggerUtil.info("Token 刷新成功", {
        userId: user.userId,
        email: user.email,
      });

      ResponseUtil.success(
        res,
        {
          token: newToken,
        },
        "Token 刷新成功"
      );
    } catch (error) {
      LoggerUtil.error("Token 刷新失败", { error });
      ResponseUtil.error(res, "Token 刷新失败", 500);
    }
  }
}
