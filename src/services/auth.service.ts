import * as jwt from "jsonwebtoken";
import crypto from "crypto";
import { UserModel } from "@/models/user.model";
import { TokenModel } from "@/models/token.model";
import { LogModel } from "@/models/log.model";
import { authConfig } from "@/config/auth.config";
import { LoggerUtil } from "@/utils/logger.util";
import type {
  User,
  UserInsert,
  TokenType,
  LoginLogInsert,
} from "@/types/database.types";
import type { JwtPayload as JWTPayload } from "jsonwebtoken";

// 扩展的Google Profile类型，匹配Passport Google OAuth返回的数据
interface GoogleOAuthProfile {
  id: string;
  displayName: string;
  name: {
    givenName: string;
    familyName: string;
  };
  emails: Array<{
    value: string;
    verified: boolean;
  }>;
  photos: Array<{
    value: string;
  }>;
}

// AuthTokens类型定义
interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}

export class AuthService {
  /**
   * 处理Google OAuth登录/注册
   */
  static async handleGoogleAuth(
    profile: GoogleOAuthProfile,
    _accessToken?: string
  ): Promise<{
    user: User;
    tokens: AuthTokens;
    isNewUser: boolean;
  }> {
    try {
      LoggerUtil.info("开始处理Google OAuth认证", { googleId: profile.id });

      // 查找现有用户
      let user = await UserModel.findByGoogleId(profile.id);
      let isNewUser = false;

      if (!user) {
        // 检查是否存在相同邮箱的用户
        const email = profile.emails?.[0]?.value;
        if (!email) {
          throw new Error("Google账号缺少邮箱信息");
        }
        const existingUser = await UserModel.findByEmail(email);

        if (existingUser) {
          // 更新现有用户的Google ID
          user = await UserModel.update(existingUser.id, {
            google_id: profile.id,
            avatar_url: profile.photos?.[0]?.value || null,
          });
          LoggerUtil.info("关联Google账号到现有用户", { userId: user.id });
        } else {
          // 创建新用户
          const userData: UserInsert = {
            google_id: profile.id,
            email: profile.emails?.[0]?.value || "",
            name: profile.displayName,
            avatar_url: profile.photos?.[0]?.value || null,
            email_verified: profile.emails?.[0]?.verified || false,
            status: "active",
            preferences: {},
          };

          user = await UserModel.create(userData);
          isNewUser = true;
          LoggerUtil.info("创建新用户", { userId: user.id });
        }
      } else {
        // 更新现有用户信息
        user = await UserModel.update(user.id, {
          name: profile.displayName,
          avatar_url: profile.photos?.[0]?.value || null,
        });
      }

      // 更新最后登录时间
      user = await UserModel.updateLastLogin(user.id);

      // 生成JWT令牌
      const tokens = await this.generateTokens(user);

      // 记录登录日志
      const logData: LoginLogInsert = {
        user_id: user.id,
        login_method: "google",
        success: true,
        ip_address: null,
        user_agent: null,
        location: {
          provider: "google",
          isNewUser,
        },
      };
      await LogModel.create(logData);

      LoggerUtil.info("Google OAuth认证成功", {
        userId: user.id,
        isNewUser,
      });

      return { user, tokens, isNewUser };
    } catch (error) {
      LoggerUtil.error("Google OAuth认证失败", error);
      throw new Error("认证失败，请重试");
    }
  }

  /**
   * 生成JWT访问令牌和刷新令牌
   */
  static async generateTokens(user: User): Promise<AuthTokens> {
    try {
      const jwtPayload = {
        userId: user.id,
        email: user.email,
        username: user.name,
        role: "user",
      };

      // 生成访问令牌
      const accessToken = jwt.sign(jwtPayload, authConfig.jwt.secret as string);

      // 生成刷新令牌
      const refreshToken = this.generateSecureToken();
      const refreshTokenHash = this.hashToken(refreshToken);

      // 计算过期时间
      const expiresAt = new Date();
      expiresAt.setTime(
        expiresAt.getTime() + this.parseExpiry(authConfig.jwt.refreshExpiresIn)
      );

      // 存储刷新令牌
      await TokenModel.create({
        user_id: user.id,
        token_hash: refreshTokenHash,
        token_type: "refresh" as TokenType,
        expires_at: expiresAt.toISOString(),
        device_info: {},
      });

      return {
        accessToken,
        refreshToken,
        accessTokenExpiresAt: new Date(
          Date.now() + this.parseExpiry(authConfig.jwt.expiresIn)
        ),
        refreshTokenExpiresAt: expiresAt,
      };
    } catch (error) {
      LoggerUtil.error("生成令牌失败", error);
      throw new Error("令牌生成失败");
    }
  }

  /**
   * 验证JWT访问令牌
   */
  static async verifyAccessToken(token: string): Promise<JWTPayload> {
    try {
      const decoded = jwt.verify(token, authConfig.jwt.secret, {
        issuer: authConfig.jwt.issuer,
        audience: authConfig.jwt.audience,
      }) as JWTPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error("访问令牌已过期");
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error("无效的访问令牌");
      }
      throw new Error("令牌验证失败");
    }
  }

  /**
   * 刷新访问令牌
   */
  static async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // 查找并验证刷新令牌
      const tokenHash = this.hashToken(refreshToken);
      const tokenRecord = await TokenModel.validateToken(tokenHash);

      if (!tokenRecord) {
        throw new Error("无效的刷新令牌");
      }

      // 获取用户信息
      const user = await UserModel.findById(tokenRecord.user_id);
      if (!user) {
        throw new Error("用户不存在");
      }

      // 删除旧的刷新令牌
      await TokenModel.revoke(tokenRecord.id);

      // 生成新的令牌对
      const tokens = await this.generateTokens(user);

      // 记录令牌刷新日志
      const logData: LoginLogInsert = {
        user_id: user.id,
        login_method: "token_refresh",
        success: true,
        ip_address: null,
        user_agent: null,
      };
      await LogModel.create(logData);

      LoggerUtil.info("令牌刷新成功", { userId: user.id });
      return tokens;
    } catch (error) {
      LoggerUtil.error("令牌刷新失败", error);
      throw error;
    }
  }

  /**
   * 撤销刷新令牌
   */
  static async revokeRefreshToken(refreshToken: string): Promise<void> {
    try {
      const tokenHash = this.hashToken(refreshToken);
      await TokenModel.revokeByTokenHash(tokenHash);
      LoggerUtil.info("刷新令牌已撤销");
    } catch (error) {
      LoggerUtil.error("撤销令牌失败", error);
      throw error;
    }
  }

  /**
   * 撤销用户所有令牌
   */
  static async revokeAllUserTokens(userId: string): Promise<void> {
    try {
      await TokenModel.revokeAllUserTokens(userId);

      // 记录注销日志
      const logData: LoginLogInsert = {
        user_id: userId,
        login_method: "google",
        success: true,
        ip_address: null,
        user_agent: null,
      };
      await LogModel.create(logData);

      LoggerUtil.info("用户所有令牌已撤销", { userId });
    } catch (error) {
      LoggerUtil.error("撤销所有令牌失败", error);
      throw error;
    }
  }

  /**
   * 获取当前用户信息
   */
  static async getCurrentUser(accessToken: string): Promise<User> {
    try {
      const decoded = await this.verifyAccessToken(accessToken);
      const userId = (decoded as any).userId || decoded.sub;

      if (!userId) {
        throw new Error("令牌中缺少用户ID");
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        throw new Error("用户不存在");
      }

      return user;
    } catch (error) {
      LoggerUtil.error("获取当前用户失败", error);
      throw error;
    }
  }

  /**
   * 生成安全的随机令牌
   */
  private static generateSecureToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * 对令牌进行哈希处理
   */
  private static hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  /**
   * 解析过期时间字符串为毫秒数
   */
  private static parseExpiry(expiry: string): number {
    const unit = expiry.slice(-1);
    const value = parseInt(expiry.slice(0, -1));

    switch (unit) {
      case "s":
        return value * 1000;
      case "m":
        return value * 60 * 1000;
      case "h":
        return value * 60 * 60 * 1000;
      case "d":
        return value * 24 * 60 * 60 * 1000;
      default:
        throw new Error(`无效的过期时间格式: ${expiry}`);
    }
  }

  /**
   * 清理过期的令牌（定时任务使用）
   */
  static async cleanupExpiredTokens(): Promise<number> {
    try {
      const count = await TokenModel.cleanupExpiredTokens();
      LoggerUtil.info("清理过期令牌完成", { count });
      return count;
    } catch (error) {
      LoggerUtil.error("清理过期令牌失败", error);
      throw error;
    }
  }

  /**
   * 检查用户权限
   */
  static async checkPermission(
    userId: string,
    permission: string
  ): Promise<boolean> {
    try {
      const user = await UserModel.findById(userId);
      if (!user) return false;

      const userPermissions = (user.preferences as any)?.permissions || [];
      return userPermissions.includes(permission) || user.status === "active";
    } catch (error) {
      LoggerUtil.error("权限检查失败", error);
      return false;
    }
  }

  /**
   * 更新用户最后活动时间
   */
  static async updateLastActivity(userId: string): Promise<void> {
    try {
      await UserModel.updateLastLogin(userId);
    } catch (error) {
      LoggerUtil.error("更新最后活动时间失败", error);
    }
  }
}
