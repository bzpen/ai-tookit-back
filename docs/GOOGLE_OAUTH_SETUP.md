# Google OAuth 2.0 设置指南 (基于官方最新文档)

## 🎯 概述

本指南将带您完成在 Google Cloud Console 中配置 OAuth 2.0 的完整步骤，以便在您的应用程序中实现 Google 登录功能。本文档的流程和建议均遵循 [Google OAuth 2.0 官方文档](https://developers.google.com/identity/protocols/oauth2?hl=zh_CN)。

## 📋 前置条件

-   拥有一个 Google 账号
-   可以访问 [Google Cloud Console](https://console.cloud.google.com/)
-   已完成项目基础配置

## 🚀 步骤一：创建或选择 Google Cloud 项目

### 1.1 访问 Google Cloud Console
-   打开 [Google Cloud Console](https://console.cloud.google.com/)
-   使用您的 Google 账号登录

### 1.2 创建或选择项目
1.  点击页面顶部的项目选择器。
2.  选择一个现有项目，或点击 **“新建项目”**。
3.  如果新建项目，请输入项目名称（例如 `test-back-oauth-prod`），然后点击 **“创建”**。
4.  确保您操作的是目标项目。

## 🔧 步骤二：配置 OAuth 同意屏幕

这是向用户展示的授权请求页面，配置不当会导致应用无法正常使用。

1.  在左侧菜单中，导航至 **“API 和服务”** → **“OAuth 同意屏幕”**。
2.  **用户类型 (User Type)**:
    *   **内部 (Internal)**: 仅限您 Google Workspace 组织内的用户。
    *   **外部 (External)**: 适用于任何拥有 Google 账号的用户。**（请选择此项）**
3.  点击 **“创建”**。
4.  **填写应用信息**:
    *   **应用名称**: `Test Back Auth App` (将向用户显示)
    *   **用户支持电子邮件**: [您的开发者联系邮箱]
    *   **应用徽标**: (可选)
5.  **应用域**:
    *   **应用首页**: `http://localhost:3000` (开发时) 或 `https://your-production-domain.com` (生产时)
    *   **应用隐私权政策链接**: `http://localhost:3000/privacy` 或 `https://your-production-domain.com/privacy`
    *   **应用服务条款链接**: `http://localhost:3000/terms` 或 `https://your-production-domain.com/terms`
6.  **已获授权的网域**: 添加您的应用托管域名 (例如 `your-production-domain.com`)。对于本地开发，此项可留空。
7.  **开发者联系信息**: 填写您的邮箱地址。
8.  点击 **“保存并继续”**。

### 2.1 配置范围 (Scopes)
1.  在“范围”页面，点击 **“添加或移除范围”**。
2.  根据您的需求选择范围。对于基础的用户信息获取，请添加以下三个核心范围：
    *   `.../auth/userinfo.email` (获取用户邮箱)
    *   `.../auth/userinfo.profile` (获取用户基本个人资料)
    *   `openid` (遵循 OpenID Connect 规范)
3.  点击 **“更新”**，然后点击 **“保存并继续”**。

### 2.2 添加测试用户
1.  在“测试用户”页面，点击 **“添加用户”**。
2.  输入您用于登录测试的 Google 邮箱地址。
3.  点击 **“添加”**，然后点击 **“保存并继续”**。

> **⚠️ 关键提示**: 只要您的应用处于 **“测试”** 发布状态，就只有此处列出的测试用户才能成功登录。

## 🔑 步骤三：创建 OAuth 2.0 客户端 ID

1.  在左侧菜单中，导航至 **“API 和服务”** → **“凭据”**。
2.  点击 **“创建凭据”** → **“OAuth 客户端 ID”**。
3.  **应用类型**: 选择 **“Web 应用”**。
4.  **名称**: `test-back-web-client` (可自定义)。
5.  **已获授权的 JavaScript 来源**:
    *   `http://localhost:3000` (用于本地开发)
    *   `https://your-production-domain.com` (用于生产环境)
6.  **已获授权的重定向 URI**:
    *   `http://localhost:3000/api/v1/auth/google/callback` (用于本地开发)
    *   `https://your-production-domain.com/api/v1/auth/google/callback` (用于生产环境)

    > **⚠️ 注意**: 这里的重定向 URI **必须** 和您后端代码中配置的 `redirectUri` 完全一致，包括协议、域名、端口和路径。

7.  点击 **“创建”**。

## 📝 步骤四：获取客户端凭据

创建成功后，您会看到一个包含 **客户端 ID** 和 **客户端密钥** 的弹窗。

-   **客户端 ID**: 类似于 `1234567890-abcdefghijklmnop.apps.googleusercontent.com`
-   **客户端密钥**: 类似于 `GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx`

**请将这两个值妥善保管，它们是您应用的敏感信息。**

## 🌍 步骤五：配置环境变量

在项目根目录创建或更新 `.env` 文件：

```env
# Google OAuth 配置
GOOGLE_CLIENT_ID="您的客户端ID"
GOOGLE_CLIENT_SECRET="您的客户端密钥"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/v1/auth/google/callback"

# 其他必要配置
JWT_SECRET="your_jwt_secret_key_minimum_32_characters_long"
SESSION_SECRET="your_session_secret_key_minimum_32_characters_long"
NODE_ENV="development"
```

## 🧪 步骤六：测试与调试

### 6.1 启动应用
```bash
pnpm dev
```

### 6.2 测试流程
1.  访问后端的Google登录入口 (例如 `http://localhost:3000/api/v1/auth/google`)。
2.  您应该被重定向到 Google 登录页面。
3.  使用您在 **步骤 2.2** 中添加的测试用户邮箱登录。
4.  同意授权后，应该被成功重定向回您在 **步骤 3.6** 中配置的 `redirect_uri`。

### 6.3 常见错误调试

-   **`redirect_uri_mismatch`**:
    -   **原因**: Google Cloud Console 中配置的“已获授权的重定向 URI”与您后端代码或请求中发送的 `redirect_uri` 参数不完全匹配。
    -   **解决方案**: 仔细检查两个 URI，确保协议、域名、端口和路径（包括末尾的斜杠 `/`）都完全一致。

-   **`invalid_client`**:
    -   **原因**: 客户端 ID 或客户端密钥配置错误。
    -   **解决方案**: 从 `.env` 文件中检查 `GOOGLE_CLIENT_ID` 和 `GOOGLE_CLIENT_SECRET` 是否从 Google Cloud Console 正确复制。

-   **`access_denied`** 或 **`403 access_denied`**:
    -   **原因**: 您尝试登录的 Google 账户不是在“OAuth 同意屏幕”中指定的测试用户（因为应用仍处于“测试”发布状态）。
    -   **解决方案**: 返回 **步骤 2.2**，将您的测试账户邮箱添加进去。

## ✨ 步骤七：理解和管理刷新令牌 (Refresh Token)

刷新令牌是实现用户“离线”访问（即使用户关闭浏览器后，服务器仍能代表用户访问其数据）的关键。

### 7.1 刷新令牌的 7 天有效期（测试模式）
-   **这是一个非常常见的开发陷阱！**
-   当您的 OAuth 同意屏幕处于 **“测试”** 发布状态时，Google 颁发的 **刷新令牌将在 7 天后自动失效**。
-   您需要重新进行授权流程才能获取新的刷新令牌。
-   一旦您的应用发布为 **“生产”** 状态，获取的刷新令牌将长期有效，直到被主动撤销。

### 7.2 刷新令牌失效的常见原因
您的代码必须能够优雅地处理刷新令牌失效的情况。失效原因包括：
1.  **用户撤销授权**：用户在自己的 Google 账户设置中移除了对您应用的访问权限。
2.  **令牌长期未使用**：刷新令牌连续六个月未被使用。
3.  **用户更改密码**：如果您的应用请求了 Gmail 相关的范围，用户更改密码会导致刷新令牌失效。
4.  **令牌数量超限**：一个用户账号对同一个客户端 ID 最多拥有 100 个有效的刷新令牌。达到上限后，最新生成的令牌会使最旧的那个令牌失效。
5.  **GCP 会话控制策略**：如果您的应用访问 GCP 资源，组织管理员可能设置了会话时长限制，到期后令牌会失效（错误子类型为 `invalid_rapt`）。

## 🚀 步骤八：发布到生产环境

### 8.1 发布应用
1.  返回 **“OAuth 同意屏幕”** 页面。
2.  在“发布状态”下，点击 **“发布应用”**。
3.  根据 Google 的要求，可能需要进行应用验证。通过验证后，刷新令牌将不再有 7 天的有效期限制。

### 8.2 更新生产配置
在您的生产服务器上，更新环境变量：
```env
# 生产环境配置
GOOGLE_REDIRECT_URI="https://your-production-domain.com/api/v1/auth/google/callback"
NODE_ENV="production"
# ...其他生产密钥
```

## 🔒 安全注意事项

1.  **保护客户端密钥**: 绝不在任何前端代码中暴露 `GOOGLE_CLIENT_SECRET`。它必须只存在于您的后端服务器。
2.  **强制使用 HTTPS**: 生产环境的所有重定向 URI 和应用域都必须使用 `HTTPS`。
3.  **验证 State 参数**: 在认证流程中，使用 `state` 参数来防止跨站请求伪造 (CSRF) 攻击。
4.  **最小权限原则**: 只请求应用绝对必要的范围 (scopes)。如果未来需要更多权限，使用[增量授权](https://developers.google.com/identity/protocols/oauth2/web-server#incrementalAuth)来请求。
5.  **安全存储刷新令牌**：在您的数据库中加密存储刷新令牌。

## 📚 附录：技术细节

-   **令牌大小**:
    -   授权码 (Authorization Code): 最大 256 字节
    -   访问令牌 (Access Token): 最大 2048 字节
    -   刷新令牌 (Refresh Token): 最大 512 字节
    您的应用需要能够处理在此限制内的可变长度令牌。

---

**下一步**: 配置用户模型和认证路由，以完成完整的登录和会话管理流程。 