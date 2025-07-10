import { AuthService } from "../../../src/services/auth.service";
import { UserModel } from "../../../src/models/user.model";
import { TokenModel } from "../../../src/models/token.model";
import { LogModel } from "../../../src/models/log.model";
// import { testUtils } from "../../setup";
import type { User } from "../../../src/types/database.types";

// Mock依赖模型
jest.mock("../../../src/models/user.model");
jest.mock("../../../src/models/token.model");
jest.mock("../../../src/models/log.model");
jest.mock("jsonwebtoken");

const mockUserModel = UserModel as jest.Mocked<typeof UserModel>;
const mockTokenModel = TokenModel as jest.Mocked<typeof TokenModel>;
const mockLogModel = LogModel as jest.Mocked<typeof LogModel>;

describe("AuthService", () => {
  const mockUser: User = {
    id: "test-user-id",
    google_id: "google-123",
    email: "test@example.com",
    name: "Test User",
    avatar_url: "https://example.com/avatar.jpg",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_login_at: new Date().toISOString(),
    email_verified: true,
    preferences: {},
  };

  const mockGoogleProfile = {
    id: "google-123",
    displayName: "Test User",
    name: {
      givenName: "Test",
      familyName: "User",
    },
    emails: [{ value: "test@example.com", verified: true }],
    photos: [{ value: "https://example.com/photo.jpg" }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("handleGoogleAuth", () => {
    it("应该处理新用户的Google认证", async () => {
      // 模拟新用户（不存在）
      mockUserModel.findByGoogleId.mockResolvedValue(null);
      mockUserModel.findByEmail.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue(mockUser);
      mockUserModel.updateLastLogin.mockResolvedValue(mockUser);
      mockTokenModel.create.mockResolvedValue({} as any);
      mockLogModel.create.mockResolvedValue({} as any);

      const result = await AuthService.handleGoogleAuth(mockGoogleProfile);

      expect(mockUserModel.findByGoogleId).toHaveBeenCalledWith("google-123");
      expect(mockUserModel.create).toHaveBeenCalled();
      expect(mockUserModel.updateLastLogin).toHaveBeenCalledWith(mockUser.id);
      expect(mockLogModel.create).toHaveBeenCalled();
      expect(result.user).toEqual(mockUser);
      expect(result.isNewUser).toBe(true);
      expect(result.tokens).toBeDefined();
    });

    it("应该处理现有用户的Google认证", async () => {
      // 模拟现有用户
      mockUserModel.findByGoogleId.mockResolvedValue(mockUser);
      mockUserModel.update.mockResolvedValue(mockUser);
      mockUserModel.updateLastLogin.mockResolvedValue(mockUser);
      mockTokenModel.create.mockResolvedValue({} as any);
      mockLogModel.create.mockResolvedValue({} as any);

      const result = await AuthService.handleGoogleAuth(mockGoogleProfile);

      expect(mockUserModel.findByGoogleId).toHaveBeenCalledWith("google-123");
      expect(mockUserModel.update).toHaveBeenCalled();
      expect(mockUserModel.updateLastLogin).toHaveBeenCalledWith(mockUser.id);
      expect(result.user).toEqual(mockUser);
      expect(result.isNewUser).toBe(false);
    });

    it("应该处理Google认证错误", async () => {
      mockUserModel.findByGoogleId.mockRejectedValue(new Error("数据库错误"));

      await expect(
        AuthService.handleGoogleAuth(mockGoogleProfile)
      ).rejects.toThrow("认证失败，请重试");
    });

    it("应该处理缺少邮箱的Google账号", async () => {
      const profileWithoutEmail = {
        ...mockGoogleProfile,
        emails: [],
      };

      mockUserModel.findByGoogleId.mockResolvedValue(null);

      await expect(
        AuthService.handleGoogleAuth(profileWithoutEmail)
      ).rejects.toThrow("认证失败，请重试");
    });
  });

  describe("generateTokens", () => {
    it("应该生成访问令牌和刷新令牌", async () => {
      const jwt = require("jsonwebtoken");
      jwt.sign = jest.fn().mockReturnValue("access-token");

      mockTokenModel.create.mockResolvedValue({} as any);

      const result = await AuthService.generateTokens(mockUser);

      expect(jwt.sign).toHaveBeenCalled();
      expect(mockTokenModel.create).toHaveBeenCalled();
      expect(result.accessToken).toBe("access-token");
      expect(result.refreshToken).toBeDefined();
      expect(result.accessTokenExpiresAt).toBeInstanceOf(Date);
      expect(result.refreshTokenExpiresAt).toBeInstanceOf(Date);
    });

    it("应该处理令牌生成错误", async () => {
      const jwt = require("jsonwebtoken");
      jwt.sign = jest.fn().mockImplementation(() => {
        throw new Error("JWT错误");
      });

      await expect(AuthService.generateTokens(mockUser)).rejects.toThrow(
        "令牌生成失败"
      );
    });
  });

  describe("verifyAccessToken", () => {
    it("应该验证有效的访问令牌", async () => {
      const jwt = require("jsonwebtoken");
      const mockPayload = {
        userId: mockUser.id,
        email: mockUser.email,
        username: mockUser.name,
        role: "user",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      jwt.verify = jest.fn().mockReturnValue(mockPayload);

      const result = await AuthService.verifyAccessToken("valid-token");

      expect(jwt.verify).toHaveBeenCalledWith(
        "valid-token",
        expect.any(String),
        expect.any(Object)
      );
      expect(result).toEqual(mockPayload);
    });

    it("应该拒绝过期的令牌", async () => {
      const jwt = require("jsonwebtoken");
      const TokenExpiredError = jwt.TokenExpiredError;
      jwt.verify = jest.fn().mockImplementation(() => {
        throw new TokenExpiredError("令牌已过期", new Date());
      });

      await expect(
        AuthService.verifyAccessToken("expired-token")
      ).rejects.toThrow("访问令牌已过期");
    });

    it("应该拒绝无效的令牌", async () => {
      const jwt = require("jsonwebtoken");
      const JsonWebTokenError = jwt.JsonWebTokenError;
      jwt.verify = jest.fn().mockImplementation(() => {
        throw new JsonWebTokenError("无效令牌");
      });

      await expect(
        AuthService.verifyAccessToken("invalid-token")
      ).rejects.toThrow("无效的访问令牌");
    });
  });

  describe("refreshAccessToken", () => {
    it("应该使用有效的刷新令牌生成新令牌", async () => {
      const jwt = require("jsonwebtoken");
      jwt.sign = jest.fn().mockReturnValue("new-access-token");

      const mockTokenRecord = {
        id: "token-id",
        user_id: mockUser.id,
        token_hash: "hash",
        token_type: "refresh" as const,
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        is_revoked: false,
        created_at: new Date().toISOString(),
        device_info: null,
      };

      mockTokenModel.validateToken.mockResolvedValue(mockTokenRecord);
      mockUserModel.findById.mockResolvedValue(mockUser);
      mockTokenModel.create.mockResolvedValue({} as any);

      const result = await AuthService.refreshAccessToken(
        "valid-refresh-token"
      );

      expect(mockTokenModel.validateToken).toHaveBeenCalled();
      expect(mockUserModel.findById).toHaveBeenCalledWith(mockUser.id);
      expect(result.accessToken).toBe("new-access-token");
    });

    it("应该拒绝无效的刷新令牌", async () => {
      mockTokenModel.validateToken.mockRejectedValue(new Error("令牌无效"));

      await expect(
        AuthService.refreshAccessToken("invalid-refresh-token")
      ).rejects.toThrow("令牌刷新失败");
    });
  });

  describe("getCurrentUser", () => {
    it("应该通过访问令牌获取当前用户", async () => {
      const jwt = require("jsonwebtoken");
      jwt.verify = jest.fn().mockReturnValue({
        userId: mockUser.id,
        email: mockUser.email,
        username: mockUser.name,
        role: "user",
      });

      mockUserModel.findById.mockResolvedValue(mockUser);

      const result = await AuthService.getCurrentUser("valid-token");

      expect(jwt.verify).toHaveBeenCalledWith(
        "valid-token",
        expect.any(String),
        expect.any(Object)
      );
      expect(mockUserModel.findById).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockUser);
    });

    it("应该拒绝不存在的用户", async () => {
      const jwt = require("jsonwebtoken");
      jwt.verify = jest.fn().mockReturnValue({
        userId: "non-existent-id",
        email: "test@example.com",
        username: "Test User",
        role: "user",
      });

      mockUserModel.findById.mockResolvedValue(null);

      await expect(AuthService.getCurrentUser("valid-token")).rejects.toThrow(
        "用户不存在"
      );
    });
  });

  describe("revokeRefreshToken", () => {
    it("应该成功撤销刷新令牌", async () => {
      mockTokenModel.revokeByTokenHash.mockResolvedValue({} as any);

      await expect(
        AuthService.revokeRefreshToken("valid-refresh-token")
      ).resolves.not.toThrow();

      expect(mockTokenModel.revokeByTokenHash).toHaveBeenCalled();
    });
  });

  describe("cleanupExpiredTokens", () => {
    it("应该清理过期的令牌", async () => {
      mockTokenModel.cleanupExpiredTokens.mockResolvedValue(5);

      const result = await AuthService.cleanupExpiredTokens();

      expect(mockTokenModel.cleanupExpiredTokens).toHaveBeenCalled();
      expect(result).toBe(5);
    });
  });
});
