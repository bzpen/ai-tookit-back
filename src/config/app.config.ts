import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

export const AppConfig = {
  port: parseInt(process.env['PORT'] || '3000', 10),
  env: process.env['NODE_ENV'] || 'development',
  cors: {
    origin: process.env['CORS_ORIGIN'] || 'http://localhost:3000',
    credentials: true
  },
  rateLimit: {
    windowMs: parseInt(process.env['RATE_LIMIT_WINDOW'] || '15', 10) * 60 * 1000, // 15分钟
    max: parseInt(process.env['RATE_LIMIT_MAX'] || '100', 10) // 限制每个IP 100次请求
  },
  log: {
    level: process.env['LOG_LEVEL'] || 'info',
    file: process.env['LOG_FILE'] || './logs/app.log'
  }
}; 