# 使用官方Node.js镜像
FROM node:20-alpine

# 启用corepack并安装pnpm
RUN corepack enable && corepack prepare pnpm@9.9.0 --activate

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建应用
RUN pnpm run build

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["pnpm", "start"] 