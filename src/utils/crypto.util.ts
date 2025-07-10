import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { JwtPayload, TokenValidationResult } from '../types/auth.types';

export class CryptoUtil {
  /**
   * 生成随机字符串
   */
  static generateRandomString(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * 生成 UUID
   */
  static generateUUID(): string {
    return crypto.randomUUID();
  }

  /**
   * 哈希密码
   */
  static async hashPassword(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const salt = crypto.randomBytes(16).toString('hex');
      crypto.pbkdf2(password, salt, 10000, 64, 'sha512', (err, derivedKey) => {
        if (err) reject(err);
        else resolve(`${salt}:${derivedKey.toString('hex')}`);
      });
    });
  }

  /**
   * 验证密码
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const parts = hash.split(':');
      if (parts.length !== 2) {
        resolve(false);
        return;
      }
      
      const [salt, key] = parts;
      if (!salt || !key) {
        resolve(false);
        return;
      }
      crypto.pbkdf2(password, salt, 10000, 64, 'sha512', (err, derivedKey) => {
        if (err) reject(err);
        else resolve(key === derivedKey.toString('hex'));
      });
    });
  }

  /**
   * 生成 JWT 令牌
   */
  static generateJWTToken(
    payload: JwtPayload,
    secret: string,
    options: jwt.SignOptions = {}
  ): string {
    return jwt.sign(payload, secret, {
      expiresIn: '1h',
      issuer: 'test-back',
      audience: 'test-back-client',
      ...options
    });
  }

  /**
   * 验证 JWT 令牌
   */
  static verifyJWTToken(
    token: string,
    secret: string,
    options: jwt.VerifyOptions = {}
  ): TokenValidationResult {
    try {
      const payload = jwt.verify(token, secret, {
        issuer: 'test-back',
        audience: 'test-back-client',
        ...options
      }) as JwtPayload;

      return {
        valid: true,
        payload
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Invalid token'
      };
    }
  }

  /**
   * 解码 JWT 令牌（不验证签名）
   */
  static decodeJWTToken(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch {
      return null;
    }
  }

  /**
   * 获取 JWT 令牌过期时间
   */
  static getJWTTokenExpiration(token: string): Date | null {
    const payload = this.decodeJWTToken(token);
    if (!payload || !payload.exp) return null;
    return new Date(payload.exp * 1000);
  }

  /**
   * 检查 JWT 令牌是否即将过期
   */
  static isJWTTokenExpiringSoon(token: string, minutesBeforeExpiry: number = 5): boolean {
    const expirationDate = this.getJWTTokenExpiration(token);
    if (!expirationDate) return true;
    
    const now = new Date();
    const timeDiff = expirationDate.getTime() - now.getTime();
    const minutesDiff = Math.floor(timeDiff / (1000 * 60));
    
    return minutesDiff <= minutesBeforeExpiry;
  }

  /**
   * 生成 HMAC
   */
  static generateHMAC(data: string, secret: string, algorithm: string = 'sha256'): string {
    return crypto.createHmac(algorithm, secret).update(data).digest('hex');
  }

  /**
   * 验证 HMAC
   */
  static verifyHMAC(data: string, secret: string, signature: string, algorithm: string = 'sha256'): boolean {
    const expectedSignature = this.generateHMAC(data, secret, algorithm);
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }

  /**
   * 生成哈希
   */
  static generateHash(data: string, algorithm: string = 'sha256'): string {
    return crypto.createHash(algorithm).update(data).digest('hex');
  }

  /**
   * 生成安全的随机数
   */
  static generateSecureRandom(min: number, max: number): number {
    const range = max - min + 1;
    const bytesNeeded = Math.ceil(Math.log2(range) / 8);
    const maxValue = Math.pow(256, bytesNeeded) - 1;
    const threshold = maxValue - (maxValue % range);
    
    let randomValue;
    do {
      randomValue = crypto.randomBytes(bytesNeeded).readUIntBE(0, bytesNeeded);
    } while (randomValue > threshold);
    
    return min + (randomValue % range);
  }

  /**
   * 生成加密密钥
   */
  static generateKey(length: number = 32): string {
    return crypto.randomBytes(length).toString('base64');
  }

  /**
   * 验证密码强度
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    errors: string[];
  } {
    const errors: string[] = [];
    let score = 0;

    if (password.length < 8) {
      errors.push('密码长度至少为8个字符');
    } else {
      score += 1;
    }

    if (!/[a-z]/.test(password)) {
      errors.push('密码必须包含小写字母');
    } else {
      score += 1;
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('密码必须包含大写字母');
    } else {
      score += 1;
    }

    if (!/[0-9]/.test(password)) {
      errors.push('密码必须包含数字');
    } else {
      score += 1;
    }

    if (!/[^a-zA-Z0-9]/.test(password)) {
      errors.push('密码必须包含特殊字符');
    } else {
      score += 1;
    }

    return {
      isValid: errors.length === 0,
      score,
      errors
    };
  }

  /**
   * 生成安全的会话 ID
   */
  static generateSessionId(): string {
    return `sess_${this.generateRandomString(32)}`;
  }

  /**
   * 生成 API 密钥
   */
  static generateAPIKey(): string {
    return `sk_${this.generateRandomString(48)}`;
  }

  /**
   * 生成邀请码
   */
  static generateInviteCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(this.generateSecureRandom(0, chars.length - 1));
    }
    return code;
  }

  /**
   * 生成短链接代码
   */
  static generateShortCode(length: number = 6): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(this.generateSecureRandom(0, chars.length - 1));
    }
    return code;
  }

  /**
   * 掩码敏感信息
   */
  static maskSensitiveInfo(value: string, visibleStart: number = 2, visibleEnd: number = 2): string {
    if (value.length <= visibleStart + visibleEnd) {
      return '*'.repeat(value.length);
    }
    
    const start = value.substring(0, visibleStart);
    const end = value.substring(value.length - visibleEnd);
    const middle = '*'.repeat(value.length - visibleStart - visibleEnd);
    
    return start + middle + end;
  }

  /**
   * 生成时间戳签名
   */
  static generateTimestampSignature(data: string, secret: string, timestamp?: number): string {
    const ts = timestamp || Date.now();
    const payload = `${ts}.${data}`;
    const signature = this.generateHMAC(payload, secret);
    return `t=${ts},v1=${signature}`;
  }

  /**
   * 验证时间戳签名
   */
  static verifyTimestampSignature(
    data: string,
    signature: string,
    secret: string,
    tolerance: number = 300000 // 5 minutes
  ): boolean {
    const parts = signature.split(',');
    const timestampPart = parts.find(part => part.startsWith('t='));
    const signaturePart = parts.find(part => part.startsWith('v1='));
    
    if (!timestampPart || !signaturePart) {
      return false;
    }
    
    const timestamp = parseInt(timestampPart.substring(2));
    const expectedSignature = signaturePart.substring(3);
    
    // 检查时间戳是否在允许范围内
    const now = Date.now();
    if (Math.abs(now - timestamp) > tolerance) {
      return false;
    }
    
    // 验证签名
    const payload = `${timestamp}.${data}`;
    return this.verifyHMAC(payload, secret, expectedSignature);
  }

  /**
   * Base64 编码
   */
  static base64Encode(text: string): string {
    return Buffer.from(text, 'utf8').toString('base64');
  }

  /**
   * Base64 解码
   */
  static base64Decode(encodedText: string): string {
    return Buffer.from(encodedText, 'base64').toString('utf8');
  }
} 