-- 创建用户状态枚举
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');

-- 创建令牌类型枚举
CREATE TYPE token_type AS ENUM ('access', 'refresh');

-- 创建登录方式枚举
CREATE TYPE login_method AS ENUM ('google', 'token_refresh');

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    status user_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    email_verified BOOLEAN DEFAULT FALSE,
    preferences JSONB,
    
    -- 添加索引
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- 创建用户令牌表
CREATE TABLE IF NOT EXISTS user_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_type token_type NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_revoked BOOLEAN DEFAULT FALSE,
    device_info JSONB,
    
    -- 添加索引
    CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

-- 创建登录日志表
CREATE TABLE IF NOT EXISTS login_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    login_method login_method NOT NULL,
    ip_address INET,
    user_agent TEXT,
    login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    location JSONB
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON user_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tokens_type ON user_tokens(token_type);
CREATE INDEX IF NOT EXISTS idx_user_tokens_expires_at ON user_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_tokens_is_revoked ON user_tokens(is_revoked);

CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_login_at ON login_logs(login_at);
CREATE INDEX IF NOT EXISTS idx_login_logs_success ON login_logs(success);
CREATE INDEX IF NOT EXISTS idx_login_logs_login_method ON login_logs(login_method);

-- 创建 updated_at 触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为用户表添加 updated_at 触发器
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 启用行级安全策略（RLS）
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_logs ENABLE ROW LEVEL SECURITY;

-- 创建基础的 RLS 策略（可以根据需要调整）
-- 用户只能查看自己的数据
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- 令牌策略
CREATE POLICY "Users can view own tokens" ON user_tokens
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tokens" ON user_tokens
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tokens" ON user_tokens
    FOR UPDATE USING (auth.uid() = user_id);

-- 登录日志策略
CREATE POLICY "Users can view own login logs" ON login_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own login logs" ON login_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 为 service_role 创建管理员策略
CREATE POLICY "Service role can manage all users" ON users
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all tokens" ON user_tokens
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all logs" ON login_logs
    FOR ALL USING (auth.role() = 'service_role'); 