# Render 部署指南

## 概述

本项目配置了自动部署到 Render 平台，支持从 GitHub 仓库自动构建和部署。Render 提供免费的 Web 服务托管，非常适合 Node.js 应用。

## 前置条件

1. **GitHub 仓库**: 项目代码已推送到 GitHub
2. **Render 账户**: 注册 [Render](https://render.com) 账户
3. **环境变量**: 准备好生产环境的配置

## 免费版本限制

Render 免费版本有以下限制：

- **内存**: 512MB RAM
- **CPU**: 0.1 CPU
- **构建时间**: 最大 15 分钟
- **休眠**: 15 分钟无活动后自动休眠
- **带宽**: 100GB/月

## 常见构建问题和解决方案

### 1. pnpm 版本兼容性问题

**问题**: `error: failed to solve: process "/bin/sh -c pnpm install --frozen-lockfile" did not complete successfully: exit code: 1`

**解决方案**:

```bash
# 方案1: 更新pnpm-lock.yaml
pnpm install --lockfile-only

# 方案2: 如果内存不足，使用npm
# 修改render.yaml中的buildCommand为:
# buildCommand: npm ci && npm run build
```

### 2. 内存不足问题

**症状**: 构建过程中出现内存错误或被终止

**解决方案**:

```yaml
# 在render.yaml中添加内存优化配置
buildCommand: |
  export NODE_OPTIONS="--max-old-space-size=400" &&
  corepack enable &&
  corepack prepare pnpm@9.9.0 --activate &&
  pnpm install --frozen-lockfile --reporter=silent &&
  pnpm run build
```

### 3. 构建超时问题

**解决方案**: 简化构建过程

```yaml
# 最小化构建配置
buildCommand: |
  corepack enable &&
  pnpm install --prod --frozen-lockfile &&
  pnpm run build:simple
```

然后在 package.json 中添加：

```json
{
  "scripts": {
    "build:simple": "tsc --skipLibCheck"
  }
}
```

### 4. 备用 npm 方案

如果 pnpm 持续有问题，可以临时切换到 npm：

1. 删除 `pnpm-lock.yaml`
2. 生成 `package-lock.json`: `npm install --package-lock-only`
3. 修改 `render.yaml`:

```yaml
buildCommand: npm ci && npm run build
startCommand: npm start
```

## 环境变量配置

在 Render 控制台中设置以下环境变量：

### 必需变量

- `NODE_ENV`: `production`
- `PORT`: `3000`
- `SUPABASE_URL`: 你的 Supabase 项目 URL
- `SUPABASE_ANON_KEY`: 你的 Supabase 匿名密钥
- `JWT_SECRET`: JWT 密钥（建议使用强随机字符串）
- `SESSION_SECRET`: 会话密钥

### 可选变量

- `GOOGLE_CLIENT_ID`: Google OAuth 客户端 ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth 客户端密钥
- `REPLICATE_API_TOKEN`: Replicate API 令牌
- `R2_ACCOUNT_ID`: Cloudflare R2 账户 ID
- `R2_ACCESS_KEY_ID`: R2 访问密钥 ID
- `R2_SECRET_ACCESS_KEY`: R2 秘密访问密钥
- `R2_BUCKET_NAME`: R2 存储桶名称

## 部署步骤

1. **推送代码到 GitHub**:

```bash
git add .
git commit -m "Deploy to Render"
git push origin main
```

2. **在 Render 中创建服务**:

   - 访问 [Render Dashboard](https://dashboard.render.com/)
   - 点击 "New +" → "Web Service"
   - 连接你的 GitHub 仓库
   - 选择 `ai-toolkit-back` 仓库

3. **配置服务**:

   - **Name**: `ai-toolkit-back`
   - **Region**: `Singapore`
   - **Branch**: `main`
   - **Build Command**: 自动检测（使用 render.yaml）
   - **Start Command**: 自动检测（使用 render.yaml）

4. **设置环境变量**:

   - 在服务设置中添加上述环境变量

5. **部署**:
   - 点击 "Create Web Service"
   - 等待构建和部署完成

## 监控和调试

### 查看构建日志

```bash
# 在Render控制台中查看构建日志
# 或使用Render CLI
render logs --service ai-toolkit-back
```

### 健康检查

服务启动后，访问：

- `https://your-service.onrender.com/health` - 健康检查
- `https://your-service.onrender.com/api/v1/auth/status` - API 状态

### 常见错误排查

1. **503 Service Unavailable**

   - 检查应用是否正确启动
   - 查看启动日志中的错误信息

2. **应用启动失败**

   - 检查环境变量是否正确设置
   - 确认数据库连接配置

3. **构建失败**
   - 检查 package.json 中的 scripts
   - 确认所有依赖都在 dependencies 中

## 性能优化建议

1. **启用 gzip 压缩**（已在代码中实现）
2. **使用 CDN**（Render 自动提供）
3. **数据库连接池**（已在代码中实现）
4. **缓存策略**（根据需要实现）

## 升级到付费版本

如果免费版本不够用，可以考虑升级：

- **Starter**: $7/月，512MB RAM，0.5 CPU
- **Standard**: $25/月，2GB RAM，1 CPU
- **Pro**: $85/月，4GB RAM，2 CPU

## 故障排除清单

- [ ] 检查 pnpm 版本是否匹配
- [ ] 确认所有环境变量已设置
- [ ] 验证数据库连接配置
- [ ] 检查构建日志中的错误
- [ ] 确认端口配置正确
- [ ] 测试健康检查端点

## 联系支持

如果遇到问题：

1. 查看 Render 官方文档
2. 检查 Render 状态页面
3. 联系 Render 支持团队

---

**注意**: 免费版本有 15 分钟无活动自动休眠的限制，首次访问可能需要等待 30 秒左右的冷启动时间。
