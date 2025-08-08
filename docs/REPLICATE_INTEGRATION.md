## Replicate 平台对接实施指南（后端）

### 目标

- **对接范围**: 文生文、文生图、语音转文字（可拓展）
- **产物**: 完整的配置、类型、服务、控制器、路由、模型与测试，支持同步查询与异步 Webhook 回调
- **一致性**: 严格遵循本项目分层规范与响应/日志风格

### 环境与依赖

- **新增环境变量（.env / .env.example）**
  - `REPLICATE_API_TOKEN`（必填）
  - `REPLICATE_WEBHOOK_SECRET`（建议）
  - `PUBLIC_API_BASE_URL`（用于 Webhook 回调，如 `https://your-domain.com/api`）
- **依赖（后端）**
  - `replicate`（官方 SDK）
  - `zod`（参数校验）
  - `nanoid`（可选：ID 生成）

安装（使用 pnpm）:

```bash
pnpm add replicate zod nanoid
```

---

### 架构与数据流

- **发起任务**: Client → `replicate.controller` → `replicate.service` → Replicate API（生成 prediction）
- **状态查询**: Client → `GET /predictions/:id` → `replicate.service.getPrediction`
- **异步回调**: Replicate → `POST /replicate/webhook`（验签）→ 更新任务/资源 → 返回 200
- **资源持久化**: 结果中的 URL（图像/音频）可落到 R2 或保留第三方链接（按需）

---

### 模块与任务清单（按目录）

#### 1) 配置层 `src/config/`

- [ ] 扩展 `replicate.config.ts`
  - 字段：`apiToken`、`baseUrl`、`timeout`、`retries`、`models`（已有）
  - 新增：`webhookSecret`、`webhookPath`（默认 `/v1/replicate/webhook`）、`publicApiBaseUrl`
  - `validate()` 增强：校验 `apiToken`、`publicApiBaseUrl`（若启用 webhook）
- [ ] 在 `src/config/index.ts` 中导出并在 `validateConfigs()` 中增加 Replicate 配置校验

建议片段（仅接口示意）:

```ts
// src/config/replicate.config.ts
export const ReplicateConfig = {
  apiToken: process.env["REPLICATE_API_TOKEN"],
  webhookSecret: process.env["REPLICATE_WEBHOOK_SECRET"],
  publicApiBaseUrl: process.env["PUBLIC_API_BASE_URL"],
  webhookPath: "/v1/replicate/webhook",
  // ...models, timeout, retries
  validate(): boolean {
    /* ... */
  },
};
```

#### 2) 类型层 `src/types/`

- [ ] 新增 `replicate.types.ts`
  - **核心类型**：`PredictionStatus`、`StartPredictionInput`、`StartTextGenInput`、`StartImageGenInput`、`StartSTTInput`、`PredictionRecord`、`WebhookPayload`
  - **统一响应**：`ReplicateResult<T>` 用于服务层返回标准化数据

#### 3) 工具层 `src/utils/`

- [ ] `replicate-sign.util.ts`：Webhook 签名校验（HMAC-SHA256 + 原始请求体；具体 Header 以官方为准，常见 `X-Replicate-Signature`）
- [ ] `validation.util.ts` 中增补 Zod schema 组合器（若复用现有文件即可不新建）

#### 4) 数据访问层 `src/models/`

- [ ] 新增 `task.model.ts`（prediction 任务表）
  - 字段建议：`id`（predictionId）、`user_id`、`type`（text|image|stt）、`model`、`input`（json）、`status`、`error_message`、`output`（json）、`created_at`、`updated_at`
- [ ] 可选：`image.model.ts`（若需落地图片/R2 元数据）
- [ ] `scripts/create_database_tables.sql` 增加建表 SQL（Supabase/SQLite 兼容字段）

示例（SQL 片段，按你数据库方言微调）:

```sql
CREATE TABLE IF NOT EXISTS predictions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  type TEXT NOT NULL,
  model TEXT NOT NULL,
  status TEXT NOT NULL,
  input JSON,
  output JSON,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 5) 服务层 `src/services/`

- [ ] 新增 `replicate.service.ts`
  - `startPrediction(input: StartPredictionInput)`
  - `getPrediction(id: string)` / `cancelPrediction(id: string)`（可选）
  - `mapOutput(...)`：将不同模型输出标准化
  - `persistPrediction(...)`：落库；若为图像可选落地 R2
  - 重试/超时策略依据 `ReplicateConfig`

接口示意:

```ts
export class ReplicateService {
  static async startPrediction(input: StartPredictionInput) {
    /* ... */
  }
  static async getPrediction(id: string) {
    /* ... */
  }
  static async handleWebhook(
    payload: WebhookPayload,
    rawBody: string,
    signature?: string
  ) {
    /* ... */
  }
}
```

#### 6) 控制器层 `src/controllers/`

- [ ] 新增 `replicate.controller.ts`
  - `createPrediction(req, res)`：根据 `type` 路由到对应服务
  - `getPrediction(req, res)`：查询状态
  - `webhook(req, res)`：校验签名、更新任务/落库
  - `listModels(req, res)`：返回 `ReplicateConfig.models`

#### 7) 路由层 `src/routes/v1/`

- [ ] 新增 `replicate.routes.ts`
  - `POST /replicate/predictions`（需 `verifyToken`、`rateLimit`）
  - `GET /replicate/predictions/:id`
  - `POST /replicate/webhook`（原始体解析 + 验签）
  - `GET /replicate/models`
- [ ] 在 `v1/index.ts` 中 `v1Routes.use('/replicate', replicateRoutes)`

示例（接口）：

```http
POST /api/v1/replicate/predictions
{
  "type": "image", // text | image | stt
  "model": "stability-ai/stable-diffusion:...",
  "input": { "prompt": "a cat in space" },
  "webhook": true // 可选：强制使用 webhook
}
```

#### 8) 中间件层 `src/middleware/`

- [ ] `validation.middleware.ts`：Zod 入参校验（按 `type` 切换 schema）
- [ ] `rate-limit.middleware.ts`：对创建预测接口限流
- [ ] Webhook 路由需使用原始体中间件（例如 `express.raw({ type: '*/*' })`）仅用于该路由，再转回 JSON 解析

#### 9) 定时任务层 `src/jobs/`

- [ ] `cleanup.job.ts`：定期清理失败/过期任务与本地临时文件
- [ ] `scheduler.ts`：注册以上任务

#### 10) 测试 `tests/`

- [ ] 单元测试：`replicate.service.test.ts`（使用 `nock`/SDK stub）
- [ ] 控制器测试：参数校验/错误码/响应结构
- [ ] 集成测试：创建预测 → 查询状态 → 模拟 webhook 回调

---

### API 约定与响应

- 成功：`ResponseUtil.success(res, data, '操作成功')`
- 失败：`ResponseUtil.error(res, '错误消息', 4xx/5xx, { code })`

示例响应：

```json
{
  "success": true,
  "data": {
    "id": "pred-xxx",
    "status": "processing",
    "type": "image",
    "model": "...",
    "created_at": "2025-01-01T00:00:00.000Z"
  },
  "message": "操作成功",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

---

### 安全与合规

- Webhook 验签（HMAC-SHA256，基于原始请求体与 `REPLICATE_WEBHOOK_SECRET`）
- 仅对 `POST /predictions` 开放认证用户（`verifyToken`）
- 限流/审计日志（`LoggerUtil`）
- 避免日志记录敏感输入（脱敏）

---

### 变更点汇总（代码改动点）

- 新增：`src/types/replicate.types.ts`
- 新增：`src/services/replicate.service.ts`
- 新增：`src/controllers/replicate.controller.ts`
- 新增：`src/routes/v1/replicate.routes.ts`，并在 `src/routes/v1/index.ts` 注册
- 新增：`src/models/task.model.ts`（可选 `image.model.ts`）与建表 SQL
- 扩展：`src/config/replicate.config.ts` 与 `src/config/index.ts` 的校验
- 可选：`src/utils/replicate-sign.util.ts`（Webhook 验签）

---

### 里程碑与验收

- M1 配置与类型（0.5d）
  - 通过 `validateConfigs()`；.env.example 更新
- M2 服务与控制器（1.0d）
  - 可发起预测、查询状态；错误处理符合规范
- M3 Webhook（0.5d）
  - 验签通过；能落库并更新任务状态
- M4 模型/SQL/清理（0.5d）
  - 表创建脚本可运行；定期清理可运行
- M5 测试与文档（0.5d）
  - 单元/集成测试通过；README/此文档更新

验收标准：

- 路由：`POST /predictions`、`GET /predictions/:id`、`POST /webhook`、`GET /models` 可用
- 响应结构与错误码符合 `ResponseUtil` 与 `ErrorMiddleware`
- 预测生命周期（创建 → 处理中 → 完成/失败）可被完整追踪，并在 DB 中可查

---

### 最小可用示例（调用示意）

```bash
curl -X POST "$API_BASE/api/v1/replicate/predictions" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "text",
    "model": "meta/llama-2-70b-chat:...",
    "input": { "prompt": "Hello" }
  }'
```

---

### 注意事项

- Webhook 需要公网可达；本地调试可用 `ngrok` 映射，并设置 `PUBLIC_API_BASE_URL`
- SDK 与直连 REST 任选其一；如用 REST，需实现重试/超时与错误归一化
- 输出对象体量大时，建议只存储关键字段或外链
