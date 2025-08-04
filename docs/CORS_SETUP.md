# CORS 配置说明

## 概述

本项目已配置支持多个域名的 CORS (跨域资源共享)，包括 `https://ai-toolkit.org/` 域名。

## 当前配置

### 默认支持的域名

- `http://localhost:3000` (开发环境)
- `https://ai-toolkit.org` (生产环境)
- `https://www.ai-toolkit.org` (生产环境)

### 配置位置

1. **主应用配置**: `src/config/app.config.ts`
2. **认证配置**: `src/config/auth.config.ts`

## 环境变量配置

### 方法一：使用环境变量

在 `.env` 文件中设置：

```bash
# 支持多个域名，用逗号分隔
CORS_ORIGIN=http://localhost:3000,https://ai-toolkit.org,https://www.ai-toolkit.org
```

### 方法二：直接修改代码

如果不想使用环境变量，可以直接修改配置文件中的默认值。

## CORS 配置详情

```typescript
cors: {
  origin: ['http://localhost:3000', 'https://ai-toolkit.org', 'https://www.ai-toolkit.org'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}
```

## 支持的请求方法

- GET
- POST
- PUT
- DELETE
- OPTIONS (预检请求)

## 支持的请求头

- Content-Type
- Authorization
- X-Requested-With

## 启用凭据

`credentials: true` 允许跨域请求携带 cookies 和认证信息。

## 测试 CORS 配置

### 1. 使用 curl 测试

```bash
# 测试预检请求
curl -X OPTIONS \
  -H "Origin: https://ai-toolkit.org" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  http://localhost:3000/api/v1/auth/me

# 测试实际请求
curl -X GET \
  -H "Origin: https://ai-toolkit.org" \
  -H "Authorization: Bearer your_token" \
  http://localhost:3000/api/v1/auth/me
```

### 2. 使用浏览器开发者工具

在浏览器控制台中测试：

```javascript
fetch("http://localhost:3000/api/v1/auth/me", {
  method: "GET",
  headers: {
    Authorization: "Bearer your_token",
    "Content-Type": "application/json",
  },
  credentials: "include",
})
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.error("CORS Error:", error));
```

## 常见问题解决

### 1. 跨域错误仍然存在

检查以下几点：

1. **域名格式**: 确保域名格式正确，包含协议 (http:// 或 https://)
2. **端口号**: 如果使用非标准端口，需要明确指定
3. **子域名**: 如果需要支持子域名，需要单独添加

### 2. 预检请求失败

确保服务器正确处理 OPTIONS 请求：

```typescript
// 在路由中添加 OPTIONS 处理
app.options("*", cors()); // 处理所有预检请求
```

### 3. 凭据问题

如果使用 `credentials: 'include'`，确保：

1. CORS 配置中 `credentials: true`
2. 域名完全匹配（不能使用通配符 `*`）

## 生产环境建议

1. **限制域名**: 只允许必要的域名
2. **HTTPS**: 生产环境使用 HTTPS
3. **监控**: 监控 CORS 错误日志
4. **安全**: 定期审查允许的域名列表

## 添加新域名

要添加新的域名支持，修改以下文件：

1. `src/config/app.config.ts`
2. `src/config/auth.config.ts`

或者设置环境变量：

```bash
CORS_ORIGIN=http://localhost:3000,https://ai-toolkit.org,https://your-new-domain.com
```

## 重启服务

修改 CORS 配置后，需要重启服务器使配置生效：

```bash
pnpm dev
```
