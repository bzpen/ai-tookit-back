# RLS 策略错误修复指南

## 问题描述

当遇到 `new row violates row-level security policy for table "users"` 错误时，表明 Supabase 的 Row-Level Security (RLS) 策略阻止了匿名key执行数据插入操作。

## 解决方案

### 1. 配置环境变量

在你的 `.env` 文件中添加以下配置：

```bash
# Supabase 基础配置
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# 重要：添加服务端密钥用于绕过RLS策略
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 2. 获取 Service Role Key

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 进入 **Settings** > **API**
4. 在 **Project API keys** 部分找到 **service_role** key
5. 复制该密钥并添加到环境变量

⚠️ **安全提醒**: Service Role Key 拥有完全的数据库访问权限，请妥善保管，不要泄露。

### 3. 修改完成的功能

已修改以下功能使用管理员权限绕过RLS：

- ✅ 用户创建 (`UserModel.create`)
- ✅ 用户信息更新 (`UserModel.update`)
- ✅ 最后登录时间更新 (`UserModel.updateLastLogin`)
- ✅ 用户状态更新 (`UserModel.updateStatus`)
- ✅ 邮箱验证 (`UserModel.verifyEmail`)
- ✅ 偏好设置更新 (`UserModel.updatePreferences`)
- ✅ 用户软删除 (`UserModel.softDelete`)

### 4. 权限说明

- **匿名Key (ANON_KEY)**: 用于客户端操作，受RLS策略限制
- **服务端Key (SERVICE_ROLE_KEY)**: 用于服务端操作，绕过RLS策略

### 5. 测试修复

重启应用后，用户注册和登录功能应该正常工作：

```bash
pnpm run dev
```

### 6. 可选：配置RLS策略

如果你希望使用更细粒度的RLS策略而不是完全绕过，可以在Supabase中配置：

```sql
-- 允许认证用户插入自己的记录
CREATE POLICY "Users can insert their own record" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 允许认证用户查看自己的记录
CREATE POLICY "Users can view their own record" ON users
  FOR SELECT USING (auth.uid() = id);

-- 允许认证用户更新自己的记录
CREATE POLICY "Users can update their own record" ON users
  FOR UPDATE USING (auth.uid() = id);
```

但在服务端OAuth认证场景下，使用Service Role Key是更简单有效的方案。

## 故障排除

### 如果仍然出现错误：

1. 确认环境变量正确加载
2. 重启应用服务
3. 检查Service Role Key是否正确
4. 确认Supabase项目配置正常

### 检查配置：

```bash
# 检查环境变量
echo $SUPABASE_SERVICE_ROLE_KEY

# 测试数据库连接
pnpm run db:health-check
``` 