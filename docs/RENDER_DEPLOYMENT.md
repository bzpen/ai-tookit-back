# Render 部署指南

## 概述

本项目配置了自动部署到 Render 平台，支持从 GitHub 仓库自动构建和部署。Render 提供免费的 Web 服务托管，非常适合 Node.js 应用。

## 前置条件

1. **GitHub 仓库**: 项目代码已推送到 GitHub
2. **Render 账户**: 注册 [Render](https://render.com) 账户
3. **环境变量**: 准备好生产环境的配置

## 快速部署

### 1. 连接 GitHub 仓库

1. 登录 [Render Dashboard](https://dashboard.render.com)
2. 点击 "New +" → "Web Service"
3. 选择 "Connect a repository"
4. 连接你的 GitHub 账户
5. 选择 `ai-toolkit-back` 仓库
6. 点击 "Connect"

### 2. 配置服务设置

Render 会自动检测到 `render.yaml` 配置文件，但你也可以手动配置：

#### 基本设置

```
Name: ai-toolkit-back
Region: Singapore (或选择离你最近的区域)
Branch: main
Runtime: Node
Build Command: pnpm install && pnpm run build
Start Command: pnpm start
```

#### 高级设置

```
Auto-Deploy: Yes
Health Check Path: /health
```

### 3. 配置环境变量

在 Render 服务设置中添加以下环境变量：

#### 必需环境变量 ⭐

```env
# 应用配置
NODE_ENV=production
PORT=10000

# Supabase 数据库
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT 认证
JWT_SECRET=your_production_jwt_secret_32_chars_minimum
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# 会话密钥
SESSION_SECRET=your_session_secret_32_chars_minimum
```

#### 可选环境变量

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://your-app.onrender.com/api/v1/auth/google/callback

# CORS 配置
CORS_ORIGIN=https://your-frontend-domain.com

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

### 4. 部署应用

1. 点击 "Create Web Service"
2. Render 会自动开始构建和部署
3. 等待部署完成（通常需要 2-5 分钟）

### 5. 验证部署

部署完成后，访问以下端点验证：

- **健康检查**: `https://your-app.onrender.com/health`
- **API 文档**: `https://your-app.onrender.com/api/v1/docs`
- **Google OAuth**: `https://your-app.onrender.com/api/v1/auth/google`

## 自动部署配置

### render.yaml 配置文件

项目包含 `render.yaml` 配置文件，定义了：

```yaml
services:
  - type: web
    name: ai-toolkit-back
    env: node
    region: singapore
    plan: free
    buildCommand: pnpm install && pnpm run build
    startCommand: pnpm start
    healthCheckPath: /health
```

### 部署触发器

- **自动部署**: 推送到 `main` 分支时自动部署
- **手动部署**: 在 Render 控制台手动触发
- **环境变量更新**: 修改环境变量后自动重启

## 免费计划限制

### Render 免费计划包含：

- ✅ **750 小时/月** 的运行时间
- ✅ **自动 HTTPS** 证书
- ✅ **全球 CDN**
- ✅ **DDoS 保护**
- ✅ **自动部署**

### 限制：

- ⚠️ **冷启动**: 15 分钟无活动后服务会休眠
- ⚠️ **带宽限制**: 100GB/月
- ⚠️ **构建时间**: 最多 20 分钟

## 监控和日志

### 查看日志

1. 在 Render 控制台点击你的服务
2. 选择 "Logs" 标签
3. 查看实时日志输出
4. 使用搜索功能查找特定日志

### 监控指标

Render 提供以下监控指标：

- **CPU 使用率**
- **内存使用量**
- **响应时间**
- **请求数量**
- **错误率**

### 设置告警

1. 在服务设置中点击 "Alerts"
2. 配置告警规则
3. 设置通知方式（邮件）

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

### 应对冷启动

```javascript
// 在 src/index.ts 中添加保活机制
setInterval(() => {
  // 每 14 分钟向自己发送请求保持活跃
  if (process.env.NODE_ENV === "production") {
    fetch(`${process.env.RENDER_EXTERNAL_URL}/health`).catch(() => {});
  }
}, 14 * 60 * 1000);
```

### 缓存策略

```env
# 启用缓存
CACHE_ENABLED=true
CACHE_TTL=300
```

## 故障排除

### 常见问题

1. **部署失败**

   - 检查构建日志
   - 验证 `package.json` 脚本
   - 确认 pnpm 版本兼容性

2. **应用无法启动**

   - 检查环境变量配置
   - 验证端口配置 (必须使用 PORT=10000)
   - 查看应用日志

3. **OAuth 回调失败**

   - 更新 Google OAuth 回调 URL
   - 检查 HTTPS 设置
   - 验证域名配置

4. **服务休眠**
   - 实现保活机制
   - 考虑升级到付费计划
   - 使用外部监控服务

### 调试技巧

1. **本地测试生产构建**:

   ```bash
   pnpm run build
   NODE_ENV=production PORT=10000 pnpm start
   ```

2. **检查健康状态**:

   ```bash
   curl https://your-app.onrender.com/health
   ```

3. **查看详细日志**:
   ```bash
   # 在 Render 控制台查看实时日志
   # 或者在代码中添加更多日志
   ```

## 自定义域名

### 配置步骤

1. 在 Render 服务设置中点击 "Custom Domains"
2. 点击 "Add Custom Domain"
3. 输入你的域名
4. 配置 DNS 记录：
   ```
   Type: CNAME
   Name: your-subdomain (或 @)
   Value: your-app.onrender.com
   ```

## 安全考虑

### 环境变量安全

- 使用强密码和随机密钥
- 定期轮换 API 密钥
- 不要在代码中硬编码敏感信息

### 网络安全

- 启用 HTTPS（Render 自动提供）
- 配置 CORS 策略
- 使用安全头部

### 访问控制

- 限制数据库访问权限
- 启用 API 限流
- 监控异常访问

## 升级到付费计划

### 付费计划优势

- **无冷启动**: 服务始终运行
- **更多资源**: 更高的 CPU 和内存
- **优先支持**: 更快的技术支持
- **高级功能**: 更多监控和分析功能

### 升级步骤

1. 在 Render 控制台点击 "Billing"
2. 选择适合的付费计划
3. 更新服务配置

## 持续集成

### GitHub Actions 集成

可以配置 GitHub Actions 进行更复杂的 CI/CD：

```yaml
# .github/workflows/deploy.yml
name: Deploy to Render

on:
  push:
    branches: [main]

jobs:
  test:
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

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to Render
        run: |
          echo "Deployment triggered by push to main"
          # Render 会自动部署，无需额外操作
```

## 支持和文档

- [Render 官方文档](https://render.com/docs)
- [Node.js 部署指南](https://render.com/docs/deploy-node-express-app)
- [环境变量管理](https://render.com/docs/environment-variables)

## 联系支持

如果遇到部署问题：

1. 检查本文档的故障排除部分
2. 查看 Render 社区论坛
3. 联系 Render 技术支持

## 成本优化

### 免费计划优化

1. **优化构建时间**: 使用缓存
2. **减少冷启动**: 实现保活机制
3. **监控使用量**: 避免超出限制

### 付费计划选择

- **Starter**: $7/月，适合小型应用
- **Standard**: $25/月，适合中型应用
- **Pro**: $85/月，适合大型应用

---

## 总结

Render 是一个优秀的免费部署平台，特别适合：

- ✅ **Node.js 应用**
- ✅ **小到中型项目**
- ✅ **原型和演示项目**
- ✅ **学习和实验项目**

通过本指南，你应该能够成功将 AI Toolkit 后端部署到 Render 平台。
