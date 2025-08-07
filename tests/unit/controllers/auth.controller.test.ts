import { Request, Response } from "express";
import { AuthController } from "../../../src/controllers/auth.controller";
import { UserService } from "../../../src/services/user.service";
import { ResponseUtil } from "../../../src/utils/response.util";

// Mock依赖
jest.mock("../../../src/services/user.service");
jest.mock("../../../src/utils/response.util");

const mockUserService = UserService as jest.Mocked<typeof UserService>;
const mockResponseUtil = ResponseUtil as jest.Mocked<typeof ResponseUtil>;

describe("AuthController", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  beforeEach(() => {
    mockRequest = {
      authUser: {
        userId: "test-user-id",
        email: "test@example.com",
        username: "Test User",
        role: "user",
      },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // 重置所有mock
    jest.clearAllMocks();
  });

  describe("getCurrentUser", () => {
    it("应该返回完整的用户信息格式", async () => {
      // 模拟用户服务返回的数据
      const mockUser = {
        id: "test-user-id",
        google_id: "google-123",
        email: "test@example.com",
        name: "Test User",
        avatar_url: "https://example.com/avatar.jpg",
        status: "active" as const,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        last_login_at: "2024-01-01T00:00:00Z",
        email_verified: true,
        preferences: { theme: "dark" },
      };

      mockUserService.getUserById.mockResolvedValue(mockUser);
      mockResponseUtil.success.mockImplementation((res, data, message) => {
        (res as any).json({ success: true, data, message });
      });

      await AuthController.getCurrentUser(
        mockRequest as Request,
        mockResponse as Response
      );

      // 验证调用了用户服务
      expect(mockUserService.getUserById).toHaveBeenCalledWith("test-user-id");

      // 验证返回的用户信息格式
      expect(mockResponseUtil.success).toHaveBeenCalledWith(
        mockResponse,
        {
          user: {
            id: "test-user-id",
            google_id: "google-123",
            email: "test@example.com",
            name: "Test User",
            avatar_url: "https://example.com/avatar.jpg",
            status: "active",
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
            last_login_at: "2024-01-01T00:00:00Z",
            email_verified: true,
            preferences: { theme: "dark" },
          },
        },
        "获取用户信息成功"
      );
    });

    it("应该处理用户不存在的情况", async () => {
      mockUserService.getUserById.mockResolvedValue(null);
      mockResponseUtil.error.mockImplementation((res, message, status) => {
        (res as any).status(status).json({ success: false, message });
      });

      await AuthController.getCurrentUser(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        "用户信息不存在",
        404
      );
    });

    it("应该处理未认证用户", async () => {
      mockRequest.authUser = undefined as any;
      mockResponseUtil.unauthorized.mockImplementation((res, message) => {
        (res as any).status(401).json({ success: false, message });
      });

      await AuthController.getCurrentUser(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponseUtil.unauthorized).toHaveBeenCalledWith(
        mockResponse,
        "用户未登录"
      );
    });

    it("应该处理服务错误", async () => {
      mockUserService.getUserById.mockRejectedValue(new Error("数据库错误"));
      mockResponseUtil.error.mockImplementation((res, message, status) => {
        (res as any).status(status).json({ success: false, message });
      });

      await AuthController.getCurrentUser(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponseUtil.error).toHaveBeenCalledWith(
        mockResponse,
        "获取用户信息失败",
        500
      );
    });
  });
});
