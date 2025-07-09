# 基于 Replicate 的AI工具后台项目

一个基于 Node.js + Express + TypeScript 的AI工具后端服务，集成 Replicate API，提供用户积分系统和图片处理功能。

## 技术栈

- **后端框架**: Node.js + Express + TypeScript
- **数据库**: SQLite (开发) / PostgreSQL (生产)
- **图片存储**: Cloudflare R2
- **部署**: Railway/Render
- **认证**: JWT Token

## 功能特性

- 🔐 用户认证与授权
- 💰 积分系统（充值、扣费、冻结）
- 🤖 Replicate AI API 集成
- 📸 图片上传与管理
- 🔄 定时任务（文件清理）
- 📊 API限流与监控
- 📝 结构化日志

## 项目结构

```
src/
├── controllers/     # 控制器层 - HTTP请求处理
├── services/       # 服务层 - 业务逻辑
├── models/         # 数据访问层 - 数据库操作
├── middleware/     # 中间件层 - 请求预处理
├── routes/         # 路由层 - API路由定义
├── utils/          # 工具层 - 通用工具函数
├── config/         # 配置层 - 环境配置
├── jobs/           # 定时任务层 - 后台任务
└── types/          # 类型定义层 - TypeScript类型
```

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 8.0.0

### 安装依赖

```bash
npm install
```

### 环境配置

1. 复制环境变量文件
```bash
cp .env.example .env
```

2. 配置必要的环境变量
```bash
# 必须配置
REPLICATE_API_TOKEN=your-replicate-api-token
JWT_SECRET=your-super-secret-jwt-key

# R2存储配置
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=your-bucket-name
```

### 运行项目

```bash
# 开发模式
npm run dev

# 构建项目
npm run build

# 生产模式
npm start
```

### 使用Docker

```bash
# 启动开发环境
docker-compose up -d

# 查看日志
docker-compose logs -f app

# 停止服务
docker-compose down
```

## API文档

项目启动后访问：http://localhost:3000/api/v1/docs

## 主要API端点

### 认证相关
- `POST /api/v1/auth/register` - 用户注册
- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/refresh` - 刷新Token

### 用户管理
- `GET /api/v1/users/profile` - 获取用户信息
- `PUT /api/v1/users/profile` - 更新用户信息

### 积分系统
- `GET /api/v1/credits/balance` - 获取积分余额
- `POST /api/v1/credits/recharge` - 积分充值
- `GET /api/v1/credits/transactions` - 交易记录

### AI工具
- `POST /api/v1/replicate/predict` - 创建AI预测
- `GET /api/v1/replicate/status/:id` - 查询预测状态

### 图片管理
- `POST /api/v1/images/upload` - 上传图片
- `GET /api/v1/images/:id` - 获取图片信息
- `DELETE /api/v1/images/:id` - 删除图片

## 开发规范

### 代码风格
- 使用 TypeScript 严格模式
- 遵循 ESLint 规则
- 使用 Prettier 格式化代码

### 命名规范
- 文件名：`user.service.ts`
- 类名：`UserService`
- 函数名：`getUserById`
- 常量：`MAX_FILE_SIZE`

### 提交规范
- feat: 新功能
- fix: 修复bug
- docs: 文档更新
- refactor: 重构代码
- test: 测试相关

## 测试

```bash
# 运行测试
npm test

# 监听模式
npm run test:watch
```

## 部署

### Railway部署

1. 连接GitHub仓库
2. 设置环境变量
3. 自动部署

### Render部署

1. 连接GitHub仓库
2. 设置构建命令：`npm run build`
3. 设置启动命令：`npm start`

## 监控与日志

- 应用日志：`./logs/app.log`
- 错误追踪：集成日志系统
- 性能监控：API响应时间统计

## 许可证

MIT License

## 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 提交 Pull Request 