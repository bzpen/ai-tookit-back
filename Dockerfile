# 多阶段构建 Dockerfile
FROM node:18-alpine AS base

# 启用corepack并安装pnpm（推荐方式）
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package.json pnpm-lock.yaml ./

# 开发阶段
FROM base AS development
ENV NODE_ENV=development
# 设置pnpm配置避免权限问题
RUN pnpm config set store-dir ~/.pnpm-store
RUN pnpm install --frozen-lockfile --prefer-offline
COPY . .
EXPOSE 3000
CMD ["pnpm", "run", "dev"]

# 构建阶段
FROM base AS build
ENV NODE_ENV=production
# 设置pnpm配置
RUN pnpm config set store-dir ~/.pnpm-store
# 跳过postinstall脚本避免构建问题
RUN pnpm install --frozen-lockfile --prefer-offline --ignore-scripts
COPY . .
# 手动构建
RUN pnpm run build
# 清理并重新安装生产依赖
RUN rm -rf node_modules && pnpm install --prod --frozen-lockfile --prefer-offline --ignore-scripts

# 生产阶段
FROM node:18-alpine AS production
ENV NODE_ENV=production
WORKDIR /app

# 启用corepack并安装pnpm
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

# 创建非root用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# 复制构建产物和生产依赖
COPY --from=build --chown=nodejs:nodejs /app/dist ./dist
COPY --from=build --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nodejs:nodejs /app/package.json ./

# 创建必要的目录
RUN mkdir -p logs uploads data && chown -R nodejs:nodejs logs uploads data

# 切换到非root用户
USER nodejs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# 启动应用
CMD ["pnpm", "start"] 