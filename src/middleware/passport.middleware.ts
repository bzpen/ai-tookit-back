import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { googleConfig } from '../config/google.config';
import { UserModel } from '../models/user.model';

/**
 * 配置 Google OAuth 策略
 */
const configureGoogleStrategy = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: googleConfig.clientId,
        clientSecret: googleConfig.clientSecret,
        callbackURL: googleConfig.redirectUri
      },
      async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
        try {
          const email = profile.emails?.[0]?.value;
          const name = profile.displayName || '';
          const picture = profile.photos?.[0]?.value || '';
          const googleId = profile.id;

          // 验证必要字段
          if (!email) {
            console.error('Google OAuth: 用户邮箱为空', { profileId: profile.id });
            return done(new Error('无法获取用户邮箱信息'), null);
          }

          console.log('Google OAuth 登录尝试', {
            googleId,
            email,
            name
          });

          // 查找或创建用户
          let user = await UserModel.findByEmail(email);
          
          if (!user) {
            // 创建新用户
            user = await UserModel.create({
              email,
              name,
              avatar_url: picture,
              google_id: googleId,
              status: 'active'
            });
            console.log('通过 Google OAuth 创建新用户', {
              userId: user.id,
              email
            });
          } else {
            // 更新用户信息
            user = await UserModel.update(user.id, {
              name,
              avatar_url: picture,
              google_id: googleId,
              last_login_at: new Date().toISOString()
            });
            console.log('更新 Google 用户信息', {
              userId: user.id,
              email
            });
          }

          return done(null, user);

        } catch (error) {
          console.error('Google OAuth 策略错误', {
            error: error instanceof Error ? error.message : error,
            profileId: profile?.id
          });
          
          return done(error, null);
        }
      }
    )
  );
};

/**
 * 配置用户序列化和反序列化
 */
const configureUserSerialization = () => {
  // 序列化用户信息到 Session
  passport.serializeUser((user: any, done) => {
    try {
      const userId = user.id;
      if (!userId) {
        return done(new Error('用户 ID 不存在'), null);
      }
      
      console.log('序列化用户到 Session', { userId });
      done(null, userId);
    } catch (error) {
      console.error('用户序列化失败', { error });
      done(error, null);
    }
  });

  // 从 Session 反序列化用户信息
  passport.deserializeUser(async (userId: string, done) => {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        console.warn('反序列化时用户不存在', { userId });
        return done(null, null);
      }

      // 检查用户状态
      if (user.status !== 'active') {
        console.warn('用户状态异常', { userId, status: user.status });
        return done(null, null);
      }

      console.log('从 Session 反序列化用户', { userId });
      done(null, user);
    } catch (error) {
      console.error('用户反序列化失败', { error, userId });
      done(error, null);
    }
  });
};

/**
 * 初始化 Passport 配置
 */
export const initializePassport = () => {
  try {
    // 检查必要的配置
    if (!googleConfig.clientId || !googleConfig.clientSecret) {
      throw new Error('Google OAuth 配置缺失');
    }

    // 配置策略
    configureGoogleStrategy();
    configureUserSerialization();

    console.log('✅ Passport 配置初始化完成');
    console.log('🔧 Google OAuth 策略已配置');
    
    return passport;
  } catch (error) {
    console.error('❌ Passport 配置初始化失败', { error });
    throw error;
  }
};

/**
 * Passport 认证中间件
 */
export const authenticateGoogle = passport.authenticate('google', {
  scope: googleConfig.scopes,
  accessType: 'offline',
  prompt: 'consent'
});

/**
 * Google OAuth 回调处理中间件
 */
export const authenticateGoogleCallback = passport.authenticate('google', {
  failureRedirect: '/auth/login?error=google_auth_failed',
  session: true
});

/**
 * 检查用户是否已认证的中间件
 */
export const requireAuth = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  
  console.warn('未认证用户尝试访问受保护资源', {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });
  
  res.status(401).json({
    success: false,
    message: '请先登录',
    code: 'UNAUTHORIZED'
  });
};

/**
 * 检查用户角色的中间件
 */
export const requireRole = (roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: '请先登录',
        code: 'UNAUTHORIZED'
      });
    }

    const userRole = req.user?.role || 'user';
    if (!roles.includes(userRole)) {
      console.warn('用户角色权限不足', {
        userId: req.user?.id,
        userRole,
        requiredRoles: roles,
        url: req.originalUrl
      });
      
      return res.status(403).json({
        success: false,
        message: '权限不足',
        code: 'FORBIDDEN'
      });
    }

    next();
  };
};

/**
 * 可选认证中间件（不强制登录）
 */
export const optionalAuth = (req: any, _res: any, next: any) => {
  if (req.isAuthenticated()) {
    console.log('已认证用户访问', {
      userId: req.user?.id,
      url: req.originalUrl
    });
  }
  next();
};

/**
 * 登出中间件
 */
export const logout = (req: any, res: any, next: any) => {
  const userId = req.user?.id;
  
  req.logout((err: any) => {
    if (err) {
      console.error('登出失败', { error: err, userId });
      return next(err);
    }
    
    // 清除 session
    req.session.destroy((err: any) => {
      if (err) {
        console.error('Session 清除失败', { error: err, userId });
      }
      
      console.log('用户登出成功', { userId });
      res.clearCookie('test-back-session');
      res.json({
        success: true,
        message: '登出成功'
      });
    });
  });
};

export default passport; 