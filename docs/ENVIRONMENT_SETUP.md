# 环境变量配置指南

## 概述

本项目使用多种云服务和第三方API，需要正确配置环境变量才能正常运行。所有环境变量都在 `.env.example` 文件中有示例。

## 快速开始

1. 复制环境变量模板：
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，填入真实的配置值

## 必需配置

### 应用基础配置
```env
NODE_ENV=development           # 运行环境: development/production
PORT=3000                     # 服务器端口
CORS_ORIGIN=http://localhost:3000  # 允许的跨域来源
```

### Supabase 数据库配置 ⭐
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
```

**获取方式：**
1. 注册 [Supabase](https://supabase.com) 账户
2. 创建新项目
3. 在项目设置 → API 中找到 URL 和 anon key

### JWT 认证配置 ⭐
```env
JWT_SECRET=your_jwt_secret_key_minimum_32_characters  # 至少32位字符
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
```

## 可选配置

### Google OAuth (社交登录)
```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback
```

**获取方式：**
1. 访问 [Google Cloud Console](https://console.cloud.google.com)
2. 创建项目 → 启用 Google+ API
3. 创建 OAuth 2.0 客户端 ID

### Replicate AI API (AI功能)
```env
REPLICATE_API_TOKEN=your_replicate_api_token
```

**获取方式：**
1. 注册 [Replicate](https://replicate.com) 账户
2. 在账户设置中生成 API token

### Cloudflare R2 (云存储)
```env
R2_ACCOUNT_ID=your_r2_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=your_r2_bucket_name
R2_PUBLIC_URL=https://your_bucket.your_account_id.r2.cloudflarestorage.com
```

**获取方式：**
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 R2 Object Storage
3. 创建存储桶和 API token

### 邮件服务 (通知功能)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_app_password
FROM_EMAIL=noreply@yourdomain.com
```

**Gmail 配置：**
1. 启用两步验证
2. 生成应用专用密码
3. 使用应用密码作为 SMTP_PASS

### Redis 缓存
```env
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password
```

### 支付功能 (Stripe)
```env
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### 监控服务 (Sentry)
```env
SENTRY_DSN=https://your_sentry_dsn@sentry.io/project_id
```

## 安全配置

### 加密和会话
```env
SESSION_SECRET=your_session_secret_here_change_in_production
ENCRYPTION_KEY=your_encryption_key_exactly_32_chars  # 必须32位
BCRYPT_ROUNDS=12
```

### 文件上传
```env
MAX_FILE_SIZE=10485760  # 10MB in bytes
UPLOAD_PATH=./uploads
```

### 限流配置
```env
RATE_LIMIT_WINDOW=15  # 时间窗口(分钟)
RATE_LIMIT_MAX=100    # 最大请求数
```

## 环境区分

### 开发环境 (.env.development)
```env
NODE_ENV=development
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:3000
```

### 生产环境 (.env.production)
```env
NODE_ENV=production
LOG_LEVEL=error
CORS_ORIGIN=https://yourdomain.com
```

## 配置验证

应用启动时会自动验证配置：

- ✅ **必需配置**：缺失会导致启动失败
- ⚠️ **可选配置**：缺失会显示警告但不影响启动
- 📝 **日志输出**：显示当前使用的服务状态

## 故障排除

### 常见错误

1. **JWT配置无效**
   - 确保 JWT_SECRET 至少32位字符

2. **Supabase配置缺失**
   - 检查 SUPABASE_URL 和 SUPABASE_ANON_KEY

3. **端口被占用**
   - 修改 PORT 环境变量或关闭占用进程

### 本地开发提示

1. 使用本地数据库：注释掉 Supabase 配置
2. 跳过第三方服务：留空相关配置即可
3. 生成测试密钥：
```bash
# 生成32位随机字符串
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 部署注意事项

1. **生产环境**必须配置所有安全相关环境变量
2. 使用**强密码**和**随机密钥**
3. 定期**轮换**API密钥和访问令牌
4. 确保敏感信息不被提交到版本控制系统 