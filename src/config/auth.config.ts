import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

export const AuthConfig = {
  jwt: {
    secret: process.env['JWT_SECRET'] || 'your_jwt_secret_key_minimum_32_characters',
    expiresIn: process.env['JWT_EXPIRES_IN'] || '7d',
    algorithm: 'HS256' as const,
    issuer: 'test-back-api',
    audience: 'test-back-client'
  },
  bcrypt: {
    rounds: parseInt(process.env['BCRYPT_ROUNDS'] || '12', 10)
  },
  // 验证JWT配置
  validateJWT(): boolean {
    if (!this.jwt.secret || this.jwt.secret.length < 32) {
      console.warn('JWT secret should be at least 32 characters long');
      return false;
    }
    return true;
  }
}; 