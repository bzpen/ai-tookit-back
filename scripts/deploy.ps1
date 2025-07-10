# Railway 部署脚本 - PowerShell 版本
# 用于本地测试和手动部署

param(
    [switch]$SkipTests,
    [switch]$SkipDocker,
    [switch]$Deploy,
    [switch]$Help
)

# 错误处理
$ErrorActionPreference = "Stop"

Write-Host "🚀 开始部署准备..." -ForegroundColor Green

# 显示帮助信息
function Show-Help {
    Write-Host "Railway 部署脚本 - PowerShell 版本" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "用法:"
    Write-Host "  .\scripts\deploy.ps1 [选项]"
    Write-Host ""
    Write-Host "选项:"
    Write-Host "  -Help          显示帮助信息"
    Write-Host "  -SkipTests     跳过测试步骤"
    Write-Host "  -SkipDocker    跳过 Docker 构建测试"
    Write-Host "  -Deploy        执行实际部署"
    Write-Host ""
    Write-Host "示例:"
    Write-Host "  .\scripts\deploy.ps1                    # 完整的部署准备"
    Write-Host "  .\scripts\deploy.ps1 -SkipTests         # 跳过测试"
    Write-Host "  .\scripts\deploy.ps1 -Deploy            # 执行实际部署"
}

# 检查必要的工具
function Test-Dependencies {
    Write-Host "📋 检查依赖工具..." -ForegroundColor Blue
    
    # 检查 Node.js
    try {
        $nodeVersion = node --version
        Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Node.js 未安装" -ForegroundColor Red
        exit 1
    }
    
    # 检查 pnpm
    try {
        $pnpmVersion = pnpm --version
        Write-Host "✅ pnpm: v$pnpmVersion" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ pnpm 未安装" -ForegroundColor Red
        Write-Host "请运行: npm install -g pnpm" -ForegroundColor Yellow
        exit 1
    }
    
    # 检查 Docker
    try {
        $dockerVersion = docker --version
        Write-Host "✅ Docker: $dockerVersion" -ForegroundColor Green
        $script:HasDocker = $true
    }
    catch {
        Write-Host "⚠️  Docker 未安装，跳过 Docker 构建测试" -ForegroundColor Yellow
        $script:HasDocker = $false
    }
    
    Write-Host "✅ 依赖检查完成" -ForegroundColor Green
}

# 检查环境变量
function Test-Environment {
    Write-Host "🔍 检查环境变量..." -ForegroundColor Blue
    
    # 检查 .env 文件
    if (-not (Test-Path ".env")) {
        Write-Host "⚠️  .env 文件不存在，复制 .env.example" -ForegroundColor Yellow
        Copy-Item ".env.example" ".env"
    }
    
    # 加载 .env 文件
    if (Test-Path ".env") {
        Get-Content ".env" | ForEach-Object {
            if ($_ -match "^([^#][^=]+)=(.*)$") {
                [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
            }
        }
    }
    
    # 检查必要的环境变量
    $requiredVars = @("SUPABASE_URL", "SUPABASE_ANON_KEY", "JWT_SECRET")
    
    foreach ($var in $requiredVars) {
        $value = [Environment]::GetEnvironmentVariable($var, "Process")
        if ([string]::IsNullOrEmpty($value)) {
            Write-Host "❌ 环境变量 $var 未设置" -ForegroundColor Red
            Write-Host "请在 .env 文件中设置必要的环境变量" -ForegroundColor Yellow
            exit 1
        }
    }
    
    Write-Host "✅ 环境变量检查完成" -ForegroundColor Green
}

# 安装依赖
function Install-Dependencies {
    Write-Host "📦 安装依赖..." -ForegroundColor Blue
    
    try {
        pnpm install
        Write-Host "✅ 依赖安装完成" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ 依赖安装失败" -ForegroundColor Red
        exit 1
    }
}

# 运行测试
function Invoke-Tests {
    Write-Host "🧪 运行测试..." -ForegroundColor Blue
    
    # 运行单元测试
    try {
        pnpm run test:unit
        Write-Host "✅ 单元测试通过" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ 单元测试失败" -ForegroundColor Red
        exit 1
    }
    
    # 运行集成测试（可选）
    try {
        pnpm run test:integration
        Write-Host "✅ 集成测试通过" -ForegroundColor Green
    }
    catch {
        Write-Host "⚠️  集成测试失败，继续部署" -ForegroundColor Yellow
    }
}

# 构建项目
function Build-Project {
    Write-Host "🔨 构建项目..." -ForegroundColor Blue
    
    # 清理旧的构建文件
    if (Test-Path "dist") {
        Remove-Item -Recurse -Force "dist"
    }
    
    # 构建项目
    try {
        pnpm run build
        Write-Host "✅ 项目构建完成" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ 项目构建失败" -ForegroundColor Red
        exit 1
    }
}

# 测试生产构建
function Test-ProductionBuild {
    Write-Host "🔍 测试生产构建..." -ForegroundColor Blue
    
    # 设置生产环境变量
    $env:NODE_ENV = "production"
    
    # 启动应用（后台运行）
    $job = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        pnpm start
    }
    
    # 等待应用启动
    Start-Sleep -Seconds 10
    
    # 测试健康检查
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ 生产构建测试通过" -ForegroundColor Green
        } else {
            throw "健康检查失败"
        }
    }
    catch {
        Write-Host "❌ 生产构建测试失败: $_" -ForegroundColor Red
        Stop-Job $job
        Remove-Job $job
        exit 1
    }
    
    # 停止应用
    Stop-Job $job
    Remove-Job $job
}

# Docker 构建测试
function Test-DockerBuild {
    if ($script:HasDocker) {
        Write-Host "🐳 测试 Docker 构建..." -ForegroundColor Blue
        
        # 构建 Docker 镜像
        try {
            docker build -t test-back-deploy . --target production
            Write-Host "✅ Docker 构建成功" -ForegroundColor Green
        }
        catch {
            Write-Host "❌ Docker 构建失败" -ForegroundColor Red
            exit 1
        }
        
        # 测试 Docker 容器
        Write-Host "🧪 测试 Docker 容器..." -ForegroundColor Blue
        
        try {
            # 运行容器（后台）
            $containerId = docker run -d -p 3001:3000 test-back-deploy
            
            # 等待容器启动
            Start-Sleep -Seconds 15
            
            # 测试健康检查
            $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 10
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ Docker 容器测试通过" -ForegroundColor Green
            } else {
                throw "健康检查失败"
            }
            
            # 停止并删除容器
            docker stop $containerId
            docker rm $containerId
            
            # 清理镜像
            docker rmi test-back-deploy
        }
        catch {
            Write-Host "❌ Docker 容器测试失败: $_" -ForegroundColor Red
            docker stop $containerId -ErrorAction SilentlyContinue
            docker rm $containerId -ErrorAction SilentlyContinue
            exit 1
        }
    } else {
        Write-Host "⚠️  跳过 Docker 测试" -ForegroundColor Yellow
    }
}

# 部署到 Railway
function Deploy-ToRailway {
    Write-Host "🚀 部署到 Railway..." -ForegroundColor Blue
    
    # 检查是否安装了 Railway CLI
    try {
        railway --version
        Write-Host "使用 Railway CLI 部署..." -ForegroundColor Blue
        railway up
        Write-Host "✅ Railway 部署完成" -ForegroundColor Green
    }
    catch {
        Write-Host "⚠️  Railway CLI 未安装" -ForegroundColor Yellow
        Write-Host "请使用以下方式之一进行部署：" -ForegroundColor Blue
        Write-Host "1. 安装 Railway CLI: npm install -g @railway/cli" -ForegroundColor Yellow
        Write-Host "2. 推送到 GitHub 触发自动部署" -ForegroundColor Yellow
        Write-Host "3. 在 Railway 控制台手动部署" -ForegroundColor Yellow
    }
}

# 生成部署报告
function New-DeploymentReport {
    Write-Host "📊 生成部署报告..." -ForegroundColor Blue
    
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $reportFile = "deploy-report-$timestamp.txt"
    
    $nodeVersion = node --version
    $pnpmVersion = pnpm --version
    $packageInfo = Get-Content "package.json" | ConvertFrom-Json
    
    $gitCommit = try { git rev-parse HEAD } catch { "未知" }
    $gitBranch = try { git branch --show-current } catch { "未知" }
    
    $srcSize = if (Test-Path "src") { (Get-ChildItem -Recurse "src" | Measure-Object -Property Length -Sum).Sum } else { 0 }
    $distSize = if (Test-Path "dist") { (Get-ChildItem -Recurse "dist" | Measure-Object -Property Length -Sum).Sum } else { 0 }
    $nodeModulesSize = if (Test-Path "node_modules") { (Get-ChildItem -Recurse "node_modules" | Measure-Object -Property Length -Sum).Sum } else { 0 }
    
    $report = @"
部署报告 - $(Get-Date)
================================

项目信息:
- 项目名称: $($packageInfo.name)
- 版本: $($packageInfo.version)
- Node.js 版本: $nodeVersion
- pnpm 版本: v$pnpmVersion

构建信息:
- 构建时间: $(Get-Date)
- 构建环境: $($env:COMPUTERNAME) - $($env:OS)
- Git 提交: $gitCommit
- Git 分支: $gitBranch

文件大小:
- 源代码: $([math]::Round($srcSize/1MB, 2)) MB
- 构建产物: $([math]::Round($distSize/1MB, 2)) MB
- node_modules: $([math]::Round($nodeModulesSize/1MB, 2)) MB

"@
    
    $report | Out-File -FilePath $reportFile -Encoding UTF8
    Write-Host "✅ 部署报告已生成: $reportFile" -ForegroundColor Green
}

# 清理函数
function Invoke-Cleanup {
    Write-Host "🧹 清理临时文件..." -ForegroundColor Blue
    
    # 停止可能运行的进程
    Get-Job | Stop-Job -ErrorAction SilentlyContinue
    Get-Job | Remove-Job -ErrorAction SilentlyContinue
    
    # 清理 Docker 资源
    if ($script:HasDocker) {
        docker system prune -f 2>$null
    }
    
    Write-Host "✅ 清理完成" -ForegroundColor Green
}

# 主函数
function Main {
    # 显示帮助
    if ($Help) {
        Show-Help
        return
    }
    
    Write-Host "🚀 Railway 部署脚本 - PowerShell 版本" -ForegroundColor Green
    Write-Host "================================" -ForegroundColor Blue
    
    try {
        # 执行部署步骤
        Test-Dependencies
        Test-Environment
        Install-Dependencies
        
        # 可选步骤
        if (-not $SkipTests) {
            Invoke-Tests
        }
        
        Build-Project
        
        if (-not $SkipDocker) {
            Test-DockerBuild
        }
        
        Test-ProductionBuild
        
        # 生成报告
        New-DeploymentReport
        
        # 部署
        if ($Deploy) {
            Deploy-ToRailway
        } else {
            Write-Host "⚠️  跳过实际部署，使用 -Deploy 参数进行部署" -ForegroundColor Yellow
        }
        
        Write-Host "🎉 部署准备完成！" -ForegroundColor Green
        Write-Host "================================" -ForegroundColor Blue
        Write-Host "下一步：" -ForegroundColor Yellow
        Write-Host "1. 推送代码到 GitHub" -ForegroundColor Yellow
        Write-Host "2. 在 Railway 控制台查看部署状态" -ForegroundColor Yellow
        Write-Host "3. 验证部署结果" -ForegroundColor Yellow
        
    } catch {
        Write-Host "❌ 部署过程中出现错误: $_" -ForegroundColor Red
        exit 1
    } finally {
        Invoke-Cleanup
    }
}

# 执行主函数
Main 