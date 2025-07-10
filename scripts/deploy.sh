#!/bin/bash

# Railway 部署脚本
# 用于本地测试和手动部署

set -e

echo "🚀 开始部署准备..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查必要的工具
check_dependencies() {
    echo -e "${BLUE}📋 检查依赖工具...${NC}"
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js 未安装${NC}"
        exit 1
    fi
    
    if ! command -v pnpm &> /dev/null; then
        echo -e "${RED}❌ pnpm 未安装${NC}"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        echo -e "${YELLOW}⚠️  Docker 未安装，跳过 Docker 构建测试${NC}"
    fi
    
    echo -e "${GREEN}✅ 依赖检查完成${NC}"
}

# 检查环境变量
check_env() {
    echo -e "${BLUE}🔍 检查环境变量...${NC}"
    
    if [ ! -f .env ]; then
        echo -e "${YELLOW}⚠️  .env 文件不存在，复制 .env.example${NC}"
        cp .env.example .env
    fi
    
    # 检查必要的环境变量
    required_vars=("SUPABASE_URL" "SUPABASE_ANON_KEY" "JWT_SECRET")
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            echo -e "${RED}❌ 环境变量 $var 未设置${NC}"
            echo -e "${YELLOW}请在 .env 文件中设置必要的环境变量${NC}"
            exit 1
        fi
    done
    
    echo -e "${GREEN}✅ 环境变量检查完成${NC}"
}

# 安装依赖
install_dependencies() {
    echo -e "${BLUE}📦 安装依赖...${NC}"
    pnpm install
    echo -e "${GREEN}✅ 依赖安装完成${NC}"
}

# 运行测试
run_tests() {
    echo -e "${BLUE}🧪 运行测试...${NC}"
    
    # 运行单元测试
    if pnpm test:unit; then
        echo -e "${GREEN}✅ 单元测试通过${NC}"
    else
        echo -e "${RED}❌ 单元测试失败${NC}"
        exit 1
    fi
    
    # 运行集成测试（可选）
    if pnpm test:integration; then
        echo -e "${GREEN}✅ 集成测试通过${NC}"
    else
        echo -e "${YELLOW}⚠️  集成测试失败，继续部署${NC}"
    fi
}

# 构建项目
build_project() {
    echo -e "${BLUE}🔨 构建项目...${NC}"
    
    # 清理旧的构建文件
    rm -rf dist/
    
    # 构建项目
    if pnpm run build; then
        echo -e "${GREEN}✅ 项目构建完成${NC}"
    else
        echo -e "${RED}❌ 项目构建失败${NC}"
        exit 1
    fi
}

# 测试生产构建
test_production_build() {
    echo -e "${BLUE}🔍 测试生产构建...${NC}"
    
    # 设置生产环境变量
    export NODE_ENV=production
    
    # 启动应用（后台运行）
    pnpm start &
    APP_PID=$!
    
    # 等待应用启动
    sleep 5
    
    # 测试健康检查
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 生产构建测试通过${NC}"
    else
        echo -e "${RED}❌ 生产构建测试失败${NC}"
        kill $APP_PID
        exit 1
    fi
    
    # 停止应用
    kill $APP_PID
}

# Docker 构建测试
test_docker_build() {
    if command -v docker &> /dev/null; then
        echo -e "${BLUE}🐳 测试 Docker 构建...${NC}"
        
        # 构建 Docker 镜像
        if docker build -t test-back-deploy . --target production; then
            echo -e "${GREEN}✅ Docker 构建成功${NC}"
        else
            echo -e "${RED}❌ Docker 构建失败${NC}"
            exit 1
        fi
        
        # 测试 Docker 容器
        echo -e "${BLUE}🧪 测试 Docker 容器...${NC}"
        
        # 运行容器（后台）
        CONTAINER_ID=$(docker run -d -p 3001:3000 test-back-deploy)
        
        # 等待容器启动
        sleep 10
        
        # 测试健康检查
        if curl -f http://localhost:3001/health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Docker 容器测试通过${NC}"
        else
            echo -e "${RED}❌ Docker 容器测试失败${NC}"
            docker stop $CONTAINER_ID
            exit 1
        fi
        
        # 停止并删除容器
        docker stop $CONTAINER_ID
        docker rm $CONTAINER_ID
        
        # 清理镜像
        docker rmi test-back-deploy
    else
        echo -e "${YELLOW}⚠️  跳过 Docker 测试${NC}"
    fi
}

# 部署到 Railway
deploy_to_railway() {
    echo -e "${BLUE}🚀 部署到 Railway...${NC}"
    
    # 检查是否安装了 Railway CLI
    if command -v railway &> /dev/null; then
        echo -e "${BLUE}使用 Railway CLI 部署...${NC}"
        railway up
        echo -e "${GREEN}✅ Railway 部署完成${NC}"
    else
        echo -e "${YELLOW}⚠️  Railway CLI 未安装${NC}"
        echo -e "${BLUE}请使用以下方式之一进行部署：${NC}"
        echo -e "${YELLOW}1. 安装 Railway CLI: npm install -g @railway/cli${NC}"
        echo -e "${YELLOW}2. 推送到 GitHub 触发自动部署${NC}"
        echo -e "${YELLOW}3. 在 Railway 控制台手动部署${NC}"
    fi
}

# 生成部署报告
generate_report() {
    echo -e "${BLUE}📊 生成部署报告...${NC}"
    
    REPORT_FILE="deploy-report-$(date +%Y%m%d-%H%M%S).txt"
    
    cat > $REPORT_FILE << EOF
部署报告 - $(date)
================================

项目信息:
- 项目名称: $(node -p "require('./package.json').name")
- 版本: $(node -p "require('./package.json').version")
- Node.js 版本: $(node --version)
- pnpm 版本: $(pnpm --version)

构建信息:
- 构建时间: $(date)
- 构建环境: $(uname -a)
- Git 提交: $(git rev-parse HEAD 2>/dev/null || echo "未知")
- Git 分支: $(git branch --show-current 2>/dev/null || echo "未知")

文件大小:
- 源代码: $(du -sh src/ 2>/dev/null || echo "未知")
- 构建产物: $(du -sh dist/ 2>/dev/null || echo "未知")
- node_modules: $(du -sh node_modules/ 2>/dev/null || echo "未知")

依赖信息:
$(pnpm list --depth=0 2>/dev/null || echo "依赖信息获取失败")

EOF
    
    echo -e "${GREEN}✅ 部署报告已生成: $REPORT_FILE${NC}"
}

# 清理函数
cleanup() {
    echo -e "${BLUE}🧹 清理临时文件...${NC}"
    
    # 停止可能运行的进程
    if [ ! -z "$APP_PID" ]; then
        kill $APP_PID 2>/dev/null || true
    fi
    
    # 清理 Docker 资源
    docker system prune -f 2>/dev/null || true
    
    echo -e "${GREEN}✅ 清理完成${NC}"
}

# 主函数
main() {
    echo -e "${GREEN}🚀 Railway 部署脚本${NC}"
    echo -e "${BLUE}================================${NC}"
    
    # 设置错误处理
    trap cleanup EXIT
    
    # 执行部署步骤
    check_dependencies
    check_env
    install_dependencies
    
    # 可选步骤（通过参数控制）
    if [ "$1" != "--skip-tests" ]; then
        run_tests
    fi
    
    build_project
    
    if [ "$1" != "--skip-docker" ]; then
        test_docker_build
    fi
    
    test_production_build
    
    # 生成报告
    generate_report
    
    # 部署
    if [ "$1" = "--deploy" ]; then
        deploy_to_railway
    else
        echo -e "${YELLOW}⚠️  跳过实际部署，使用 --deploy 参数进行部署${NC}"
    fi
    
    echo -e "${GREEN}🎉 部署准备完成！${NC}"
    echo -e "${BLUE}================================${NC}"
    echo -e "${YELLOW}下一步：${NC}"
    echo -e "${YELLOW}1. 推送代码到 GitHub${NC}"
    echo -e "${YELLOW}2. 在 Railway 控制台查看部署状态${NC}"
    echo -e "${YELLOW}3. 验证部署结果${NC}"
}

# 显示帮助信息
show_help() {
    echo "Railway 部署脚本"
    echo ""
    echo "用法:"
    echo "  ./scripts/deploy.sh [选项]"
    echo ""
    echo "选项:"
    echo "  --help          显示帮助信息"
    echo "  --skip-tests    跳过测试步骤"
    echo "  --skip-docker   跳过 Docker 构建测试"
    echo "  --deploy        执行实际部署"
    echo ""
    echo "示例:"
    echo "  ./scripts/deploy.sh                    # 完整的部署准备"
    echo "  ./scripts/deploy.sh --skip-tests       # 跳过测试"
    echo "  ./scripts/deploy.sh --deploy           # 执行实际部署"
}

# 检查参数
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    show_help
    exit 0
fi

# 执行主函数
main "$@" 