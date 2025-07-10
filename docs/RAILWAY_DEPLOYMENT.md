# Railway 部署指南

## 概述

本项目配置了自动部署到 Railway 平台，支持从 GitHub 仓库自动构建和部署。

## 前置条件

1. **GitHub 仓库**: 项目代码已推送到 GitHub
2. **Railway 账户**: 注册 [Railway](https://railway.app) 账户
3. **环境变量**: 准备好生产环境的配置

## 快速部署

### 1. 连接 GitHub 仓库

1. 登录 [Railway Dashboard](https://railway.app/dashboard)
2. 点击 "New Project"
3. 选择 "Deploy from GitHub repo"
4. 选择你的项目仓库
5. 点击 "Deploy Now"

### 2. 配置环境变量

在 Railway 项目设置中添加以下环境变量：

#### 必需环境变量

```env
# 应用配置
NODE_ENV=production
PORT=3000

# Supabase 数据库
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT 认证
JWT_SECRET=your_production_jwt_secret_32_chars_minimum
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://your-app.railway.app/api/v1/auth/google/callback

# 会话密钥
SESSION_SECRET=your_session_secret_32_chars_minimum
```

#### 可选环境变量

```env
# Replicate AI API
REPLICATE_API_TOKEN=your_replicate_api_token

# Cloudflare R2 存储
R2_ACCOUNT_ID=your_r2_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=your_r2_bucket_name

# 邮件服务
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_app_password

# 监控服务
SENTRY_DSN=your_sentry_dsn

# 日志配置
LOG_LEVEL=info
```

### 3. 配置自定义域名（可选）

1. 在 Railway 项目设置中点击 "Domains"
2. 点击 "Custom Domain"
3. 输入你的域名
4. 按照提示配置 DNS 记录

### 4. 验证部署

部署完成后，访问以下端点验证：

- **健康检查**: `https://your-app.railway.app/health`
- **API 文档**: `https://your-app.railway.app/api/v1/docs`
- **Google OAuth**: `https://your-app.railway.app/api/v1/auth/google`

## 自动部署配置

### Railway 配置文件

项目包含 `railway.json` 配置文件，定义了：

- **构建命令**: `pnpm install && pnpm run build`
- **启动命令**: `pnpm start`
- **健康检查**: `/health` 端点
- **重启策略**: 失败时自动重启

### 部署触发器

- **自动部署**: 推送到 `main` 分支时自动部署
- **手动部署**: 在 Railway 控制台手动触发
- **环境变量更新**: 修改环境变量后自动重启

## 监控和日志

### 查看日志

1. 在 Railway 项目页面点击 "Logs"
2. 查看实时日志输出
3. 使用过滤器查找特定日志

### 监控指标

Railway 提供以下监控指标：

- **CPU 使用率**
- **内存使用量**
- **网络流量**
- **响应时间**

### 设置告警

1. 在项目设置中点击 "Metrics"
2. 配置告警规则
3. 设置通知方式

## 数据库管理

### Supabase 配置

确保 Supabase 项目已正确配置：

1. **表结构**: 使用 `docs/DATABASE_SETUP.md` 创建表
2. **RLS 策略**: 配置行级安全策略
3. **API 密钥**: 使用生产环境密钥

### 数据备份

建议定期备份数据：

1. 使用 Supabase 自动备份功能
2. 导出重要数据到外部存储
3. 定期测试数据恢复流程

## 性能优化

### 缓存配置

```env
# Redis 缓存（可选）
REDIS_URL=redis://your-redis-instance
```

### CDN 配置

对于静态资源，建议使用 CDN：

1. 配置 Cloudflare R2 + CDN
2. 设置缓存策略
3. 优化图片和文件传输

## 故障排除

### 常见问题

1. **部署失败**

   - 检查构建日志
   - 验证 package.json 脚本
   - 确认依赖版本兼容性

2. **应用无法启动**

   - 检查环境变量配置
   - 验证数据库连接
   - 查看应用日志

3. **OAuth 回调失败**
   - 更新 Google OAuth 回调 URL
   - 检查域名配置
   - 验证 HTTPS 设置

### 调试技巧

1. **本地测试生产构建**:

   ```bash
   pnpm run build
   NODE_ENV=production pnpm start
   ```

2. **使用 Docker 测试**:

   ```bash
   docker build -t test-back .
   docker run -p 3000:3000 test-back
   ```

3. **检查健康状态**:
   ```bash
   curl https://your-app.railway.app/health
   ```

## 安全考虑

### 环境变量安全

- 使用强密码和随机密钥
- 定期轮换 API 密钥
- 不要在代码中硬编码敏感信息

### 网络安全

- 启用 HTTPS
- 配置 CORS 策略
- 使用安全头部

### 访问控制

- 限制数据库访问权限
- 配置 IP 白名单（如需要）
- 启用 API 限流

## 成本优化

### 资源配置

Railway 提供不同的资源配置：

- **Starter**: 免费层，适合开发和测试
- **Pro**: 付费层，适合生产环境

### 监控用量

1. 定期检查资源使用情况
2. 优化代码性能
3. 配置自动扩缩容

## 回滚策略

### 版本管理

1. 每次部署创建版本标签
2. 保留最近几个版本的构建
3. 准备快速回滚方案

### 回滚步骤

1. 在 Railway 控制台选择历史版本
2. 点击 "Redeploy"
3. 验证回滚成功

## 持续集成

### GitHub Actions 集成

可以配置 GitHub Actions 进行更复杂的 CI/CD：

```yaml
# .github/workflows/deploy.yml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      - name: Install dependencies
        run: pnpm install
      - name: Run tests
        run: pnpm test
      - name: Build
        run: pnpm build
      - name: Deploy to Railway
        uses: railwayapp/railway-deploy@v1
        with:
          railway-token: ${{ secrets.RAILWAY_TOKEN }}
```

## 支持和文档

- [Railway 官方文档](https://docs.railway.app)
- [Node.js 部署指南](https://docs.railway.app/deploy/deployments)
- [环境变量管理](https://docs.railway.app/deploy/variables)

## 联系支持

如果遇到部署问题：

1. 检查本文档的故障排除部分
2. 查看 Railway 社区论坛
3. 联系 Railway 技术支持
