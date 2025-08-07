import { Router, type Router as ExpressRouter } from "express";
import { ResponseUtil } from "@/utils/response.util";
import { LoggerUtil } from "@/utils/logger.util";
import { UserService } from "@/services/user.service";

const router: ExpressRouter = Router();

/**
 * 测试数据库连接和用户查询
 * GET /api/v1/test/db-test/:userId
 */
router.get("/db-test/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    LoggerUtil.info("测试数据库查询", { userId });

    // 尝试从数据库获取用户
    const user = await UserService.getUserById(userId);

    if (user) {
      ResponseUtil.success(
        res,
        {
          found: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            status: user.status,
          },
        },
        "用户存在"
      );
    } else {
      ResponseUtil.success(
        res,
        {
          found: false,
          message: "用户不存在",
        },
        "用户不存在"
      );
    }
  } catch (error) {
    LoggerUtil.error("数据库测试失败", { error });
    ResponseUtil.error(res, "数据库测试失败", 500);
  }
});

/**
 * 测试JWT Token解析
 * GET /api/v1/test/token-test
 */
router.get("/token-test", (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    LoggerUtil.info("测试Token解析", {
      hasAuthHeader: !!authHeader,
      authHeader: authHeader ? authHeader.substring(0, 20) + "..." : null,
    });

    if (!authHeader) {
      ResponseUtil.error(res, "缺少Authorization头", 400);
      return;
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      ResponseUtil.error(res, "无效的Token格式", 400);
      return;
    }

    ResponseUtil.success(
      res,
      {
        hasToken: true,
        tokenLength: token.length,
        tokenPreview: token.substring(0, 20) + "...",
      },
      "Token格式正确"
    );
  } catch (error) {
    ResponseUtil.error(res, "Token测试失败", 500);
  }
});

/**
 * 测试错误响应格式
 * GET /api/v1/test/error/:type
 */
router.get("/error/:type", (req, res) => {
  const errorType = req.params.type;

  switch (errorType) {
    case "unauthorized":
      ResponseUtil.unauthorized(res, "用户未登录");
      break;
    case "not-found":
      ResponseUtil.error(res, "用户信息不存在", 404);
      break;
    case "server-error":
      ResponseUtil.error(res, "获取用户信息失败", 500);
      break;
    default:
      ResponseUtil.error(res, "未知错误类型", 400);
  }
});

export { router as testRoutes };
