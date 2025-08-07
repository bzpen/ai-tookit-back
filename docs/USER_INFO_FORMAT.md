# 用户信息返回格式

## 概述

用户信息 API 现在返回完整的用户数据，包含所有必要的字段，格式统一且类型安全。

## API 端点

### GET /api/v1/auth/me

获取当前登录用户的完整信息。

**请求头：**

```
Authorization: Bearer <jwt_token>
```

**响应格式：**

```json
{
  "success": true,
  "message": "获取用户信息成功",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "google_id": "123456789",
      "email": "user@example.com",
      "name": "张三",
      "avatar_url": "https://example.com/avatar.jpg",
      "status": "active",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z",
      "last_login_at": "2024-01-01T00:00:00.000Z",
      "email_verified": true,
      "preferences": {
        "theme": "dark",
        "language": "zh-CN"
      }
    }
  }
}
```

## 字段说明

| 字段名           | 类型           | 必填 | 描述                                  |
| ---------------- | -------------- | ---- | ------------------------------------- |
| `id`             | string         | 是   | 用户唯一标识符（UUID）                |
| `google_id`      | string         | 是   | Google OAuth ID                       |
| `email`          | string         | 是   | 用户邮箱地址                          |
| `name`           | string         | 是   | 用户显示名称                          |
| `avatar_url`     | string \| null | 否   | 用户头像 URL                          |
| `status`         | string         | 是   | 用户状态（active/inactive/suspended） |
| `created_at`     | string         | 是   | 账号创建时间（ISO 8601 格式）         |
| `updated_at`     | string         | 是   | 最后更新时间（ISO 8601 格式）         |
| `last_login_at`  | string \| null | 否   | 最后登录时间（ISO 8601 格式）         |
| `email_verified` | boolean        | 是   | 邮箱是否已验证                        |
| `preferences`    | object \| null | 否   | 用户偏好设置                          |

## 状态值说明

- `active`: 活跃用户，可以正常使用所有功能
- `inactive`: 非活跃用户，账号已停用
- `suspended`: 暂停用户，账号被管理员暂停

## 错误响应

### 401 未授权

```json
{
  "success": false,
  "message": "用户未登录",
  "error": "UNAUTHORIZED"
}
```

### 404 用户不存在

```json
{
  "success": false,
  "message": "用户信息不存在",
  "error": "NOT_FOUND"
}
```

### 500 服务器错误

```json
{
  "success": false,
  "message": "获取用户信息失败",
  "error": "INTERNAL_SERVER_ERROR"
}
```

## 类型定义

```typescript
interface UserInfoResponse {
  id: string;
  google_id: string;
  email: string;
  name: string;
  avatar_url?: string | null;
  status: UserStatus;
  created_at: string;
  updated_at: string;
  last_login_at?: string | null;
  email_verified: boolean;
  preferences?: Record<string, any> | null;
}

type UserStatus = "active" | "inactive" | "suspended";
```

## 更新历史

- **v1.0.0**: 初始版本，返回基本用户信息
- **v1.1.0**: 更新为完整用户信息格式，包含所有数据库字段
- **v1.2.0**: 添加类型安全，统一字段命名规范
