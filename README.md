# Test-Back API 服务

Node.js + Express + TypeScript + Supabase 后端API服务

## 快速开始

### 环境配置

复制环境变量示例：
```bash
cp .env.example .env
```

配置必要的环境变量：
```bash
# Supabase 配置
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # 重要：用于绕过RLS

# JWT 配置
JWT_SECRET=your-jwt-secret

# Google OAuth 配置
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 安装依赖

```bash
pnpm install
```

### 数据库初始化

```bash
pnpm run db:init
```

### 启动开发服务器

```bash
pnpm run dev
```

## 重要更新：RLS 策略修复

### 问题描述
之前遇到 `new row violates row-level security policy for table "users"` 错误，这是由于 Supabase 的 Row-Level Security (RLS) 策略限制了匿名key的写入权限。

### 解决方案
✅ **已实现服务端key方案**

- 配置了双客户端架构：匿名key用于读取，服务端key用于写入
- 修改了所有写操作使用管理员权限绕过RLS策略
- 确保用户注册、登录、令牌管理等功能正常工作

### 修改的文件
- `src/config/database.config.ts` - 添加管理员客户端
- `src/models/user.model.ts` - 用户相关写操作使用管理员权限
- `src/models/token.model.ts` - 令牌相关写操作使用管理员权限  
- `src/models/log.model.ts` - 日志相关写操作使用管理员权限

详细说明请参考：[RLS修复指南](./docs/RLS_FIX_GUIDE.md)

## 项目结构

```
src/
├── config/         # 配置文件
├── controllers/    # 控制器层
├── middleware/     # 中间件
├── models/         # 数据模型
├── routes/         # 路由定义
├── services/       # 业务逻辑
├── types/          # TypeScript类型
└── utils/          # 工具函数
```

## API 文档

### 认证相关
- `GET /api/v1/auth/google` - Google OAuth登录
- `POST /api/v1/auth/refresh` - 刷新访问令牌
- `POST /api/v1/auth/logout` - 退出登录

### 健康检查
- `GET /api/health` - 服务健康检查
- `GET /api/health/db` - 数据库健康检查

## 部署

### 使用 Docker

```bash
docker-compose up -d
```

### 手动部署

```bash
pnpm run build
pnpm start
```

## 开发命令

```bash
# 开发模式
pnpm run dev

# 类型检查
pnpm run type-check

# 代码格式化
pnpm run format

# 运行测试
pnpm test

# 数据库操作
pnpm run db:init     # 初始化数据库
pnpm run db:migrate  # 运行迁移
pnpm run db:health   # 健康检查
```

## 环境变量说明

| 变量名 | 描述 | 必需 |
|--------|------|------|
| `SUPABASE_URL` | Supabase项目URL | ✅ |
| `SUPABASE_ANON_KEY` | Supabase匿名key | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase服务端key | ✅ |
| `JWT_SECRET` | JWT签名密钥 | ✅ |
| `GOOGLE_CLIENT_ID` | Google OAuth客户端ID | ✅ |
| `GOOGLE_CLIENT_SECRET` | Google OAuth客户端密钥 | ✅ |

## 技术栈

- **运行时**: Node.js 18+
- **框架**: Express.js
- **语言**: TypeScript
- **数据库**: Supabase (PostgreSQL)
- **认证**: JWT + Google OAuth
- **包管理**: pnpm

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 许可证

MIT License
