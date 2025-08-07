# CORS 配置指南

## 概述

本项目已配置支持多域名 CORS 访问，支持以下域名：

- `https://www.ai-toolkit.org`
- `http://localhost:3001`
- `https://ai-toolkit.org`

## 环境变量配置

在 `.env` 文件中设置：

```env
CORS_ORIGIN=https://www.ai-toolkit.org,http://localhost:3001,https://ai-toolkit.org
```

## 配置说明

### 支持的请求头

- `Content-Type`
- `Authorization`
- `X-Requested-With`

### 支持的 HTTP 方法

- `GET`
- `POST`
- `PUT`
- `DELETE`
- `OPTIONS`

### 凭证支持

- `credentials: true` - 支持携带 cookies 和认证信息

## 故障排除

### 1. 检查环境变量

确保 `CORS_ORIGIN` 环境变量正确设置，多个域名用逗号分隔。

### 2. 检查域名格式

- 确保包含协议（http:// 或 https://）
- 确保域名拼写正确
- 注意端口号（如 localhost:3001）

### 3. 检查请求头

确保前端请求包含正确的 `Origin` 头。

### 4. 日志调试

服务器会记录被 CORS 阻止的请求，查看日志：

```bash
npm run dev
```

## 开发环境配置

本地开发时，可以添加更多域名：

```env
CORS_ORIGIN=https://www.ai-toolkit.org,http://localhost:3001,https://ai-toolkit.org,http://localhost:3000
```

## 生产环境注意事项

1. 只允许必要的域名
2. 使用 HTTPS 协议
3. 定期审查允许的域名列表
4. 监控 CORS 错误日志
