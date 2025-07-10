import Joi from 'joi';

export class ValidationUtil {
  /**
   * 邮箱验证
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 手机号验证（中国大陆）
   */
  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  /**
   * 用户名验证
   */
  static isValidUsername(username: string): boolean {
    // 3-20位字符，只能包含字母、数字、下划线
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  }

  /**
   * 密码强度验证
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    errors: string[];
    suggestions: string[];
  } {
    const errors: string[] = [];
    const suggestions: string[] = [];
    let score = 0;

    // 长度检查
    if (password.length < 8) {
      errors.push('密码长度至少为8个字符');
      suggestions.push('增加密码长度');
    } else if (password.length >= 8 && password.length < 12) {
      score += 1;
      suggestions.push('建议密码长度为12位以上');
    } else {
      score += 2;
    }

    // 小写字母检查
    if (!/[a-z]/.test(password)) {
      errors.push('密码必须包含小写字母');
      suggestions.push('添加小写字母');
    } else {
      score += 1;
    }

    // 大写字母检查
    if (!/[A-Z]/.test(password)) {
      errors.push('密码必须包含大写字母');
      suggestions.push('添加大写字母');
    } else {
      score += 1;
    }

    // 数字检查
    if (!/[0-9]/.test(password)) {
      errors.push('密码必须包含数字');
      suggestions.push('添加数字');
    } else {
      score += 1;
    }

    // 特殊字符检查
    if (!/[^a-zA-Z0-9]/.test(password)) {
      errors.push('密码必须包含特殊字符');
      suggestions.push('添加特殊字符（如 !@#$%^&*）');
    } else {
      score += 1;
    }

    // 常见密码检查
    const commonPasswords = [
      '123456', 'password', '123456789', '12345678', '12345',
      '1234567', 'qwerty', 'abc123', 'Password', 'admin'
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('请勿使用常见密码');
      suggestions.push('使用更复杂的密码组合');
      score = Math.max(0, score - 2);
    }

    // 重复字符检查
    const hasRepeatedChars = /(.)\1{2,}/.test(password);
    if (hasRepeatedChars) {
      suggestions.push('避免使用连续重复的字符');
      score = Math.max(0, score - 1);
    }

    return {
      isValid: errors.length === 0,
      score: Math.min(score, 5),
      errors,
      suggestions
    };
  }

  /**
   * URL 验证
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * IP 地址验证
   */
  static isValidIP(ip: string): boolean {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  /**
   * 身份证号验证（中国大陆）
   */
  static isValidIDCard(idCard: string): boolean {
    const idCardRegex = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
    return idCardRegex.test(idCard);
  }

  /**
   * 银行卡号验证
   */
  static isValidBankCard(cardNumber: string): boolean {
    // 移除空格和破折号
    const cleanCardNumber = cardNumber.replace(/[\s-]/g, '');
    
    // 检查是否为数字
    if (!/^\d+$/.test(cleanCardNumber)) {
      return false;
    }
    
    // 检查长度
    if (cleanCardNumber.length < 12 || cleanCardNumber.length > 19) {
      return false;
    }
    
    // Luhn 算法验证
    let sum = 0;
    let shouldDouble = false;
    
    for (let i = cleanCardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanCardNumber.charAt(i));
      
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    
    return sum % 10 === 0;
  }

  /**
   * 创建 Joi 验证 schema
   */
  static createValidationSchema(rules: Record<string, any>): Joi.ObjectSchema {
    return Joi.object(rules);
  }

  /**
   * 用户注册验证 schema
   */
  static getUserRegistrationSchema(): Joi.ObjectSchema {
    return Joi.object({
      username: Joi.string()
        .alphanum()
        .min(3)
        .max(20)
        .required()
        .messages({
          'string.alphanum': '用户名只能包含字母和数字',
          'string.min': '用户名长度至少为3个字符',
          'string.max': '用户名长度不能超过20个字符',
          'any.required': '用户名是必需的'
        }),
      email: Joi.string()
        .email()
        .required()
        .messages({
          'string.email': '请输入有效的邮箱地址',
          'any.required': '邮箱是必需的'
        }),
      password: Joi.string()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .required()
        .messages({
          'string.min': '密码长度至少为8个字符',
          'string.pattern.base': '密码必须包含大小写字母、数字和特殊字符',
          'any.required': '密码是必需的'
        }),
      confirmPassword: Joi.string()
        .valid(Joi.ref('password'))
        .required()
        .messages({
          'any.only': '确认密码必须与密码相同',
          'any.required': '确认密码是必需的'
        })
    });
  }

  /**
   * 用户登录验证 schema
   */
  static getUserLoginSchema(): Joi.ObjectSchema {
    return Joi.object({
      email: Joi.string()
        .email()
        .required()
        .messages({
          'string.email': '请输入有效的邮箱地址',
          'any.required': '邮箱是必需的'
        }),
      password: Joi.string()
        .required()
        .messages({
          'any.required': '密码是必需的'
        })
    });
  }

  /**
   * 用户信息更新验证 schema
   */
  static getUserUpdateSchema(): Joi.ObjectSchema {
    return Joi.object({
      username: Joi.string()
        .alphanum()
        .min(3)
        .max(20)
        .optional()
        .messages({
          'string.alphanum': '用户名只能包含字母和数字',
          'string.min': '用户名长度至少为3个字符',
          'string.max': '用户名长度不能超过20个字符'
        }),
      email: Joi.string()
        .email()
        .optional()
        .messages({
          'string.email': '请输入有效的邮箱地址'
        }),
      avatar: Joi.string()
        .uri()
        .optional()
        .messages({
          'string.uri': '请输入有效的头像链接'
        })
    });
  }

  /**
   * 分页参数验证 schema
   */
  static getPaginationSchema(): Joi.ObjectSchema {
    return Joi.object({
      page: Joi.number()
        .integer()
        .min(1)
        .default(1)
        .messages({
          'number.integer': '页码必须是整数',
          'number.min': '页码不能小于1'
        }),
      limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(10)
        .messages({
          'number.integer': '每页数量必须是整数',
          'number.min': '每页数量不能小于1',
          'number.max': '每页数量不能超过100'
        }),
      orderBy: Joi.string()
        .valid('createdAt', 'updatedAt', 'username', 'email')
        .default('createdAt')
        .messages({
          'any.only': '排序字段无效'
        }),
      orderDirection: Joi.string()
        .valid('asc', 'desc')
        .default('desc')
        .messages({
          'any.only': '排序方向必须是 asc 或 desc'
        })
    });
  }

  /**
   * 文件上传验证 schema
   */
  static getFileUploadSchema(): Joi.ObjectSchema {
    return Joi.object({
      fileName: Joi.string()
        .max(255)
        .required()
        .messages({
          'string.max': '文件名长度不能超过255个字符',
          'any.required': '文件名是必需的'
        }),
      fileSize: Joi.number()
        .integer()
        .min(1)
        .max(10 * 1024 * 1024) // 10MB
        .required()
        .messages({
          'number.integer': '文件大小必须是整数',
          'number.min': '文件大小不能为空',
          'number.max': '文件大小不能超过10MB',
          'any.required': '文件大小是必需的'
        }),
      fileType: Joi.string()
        .valid('image/jpeg', 'image/png', 'image/gif', 'image/webp')
        .required()
        .messages({
          'any.only': '文件类型必须是 JPEG、PNG、GIF 或 WebP',
          'any.required': '文件类型是必需的'
        })
    });
  }

  /**
   * 验证数据
   */
  static async validateData<T>(schema: Joi.ObjectSchema, data: any): Promise<{
    isValid: boolean;
    value?: T;
    errors?: string[];
  }> {
    try {
      const { error, value } = schema.validate(data, { abortEarly: false });
      
      if (error) {
        const errors = error.details.map(detail => detail.message);
        return {
          isValid: false,
          errors
        };
      }
      
      return {
        isValid: true,
        value
      };
    } catch (error) {
      return {
        isValid: false,
        errors: ['验证过程中发生错误']
      };
    }
  }

  /**
   * 清理和转换数据
   */
  static sanitizeString(input: string): string {
    return input.trim().replace(/\s+/g, ' ');
  }

  /**
   * 转义 HTML 特殊字符
   */
  static escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (char) => map[char] || char);
  }

  /**
   * 检查字符串是否为空或只包含空白字符
   */
  static isEmptyOrWhitespace(str: string): boolean {
    return !str || !str.trim();
  }

  /**
   * 限制字符串长度
   */
  static truncateString(str: string, maxLength: number, suffix: string = '...'): string {
    if (str.length <= maxLength) {
      return str;
    }
    return str.substring(0, maxLength - suffix.length) + suffix;
  }

  /**
   * 检查是否为有效的十六进制颜色码
   */
  static isValidHexColor(color: string): boolean {
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexColorRegex.test(color);
  }

  /**
   * 检查是否为有效的 UUID
   */
  static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * 检查是否为有效的 JSON 字符串
   */
  static isValidJSON(str: string): boolean {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 检查是否为正整数
   */
  static isPositiveInteger(value: any): boolean {
    return Number.isInteger(value) && value > 0;
  }

  /**
   * 检查是否为非负整数
   */
  static isNonNegativeInteger(value: any): boolean {
    return Number.isInteger(value) && value >= 0;
  }

  /**
   * 检查数组是否为空
   */
  static isEmptyArray(arr: any[]): boolean {
    return !Array.isArray(arr) || arr.length === 0;
  }

  /**
   * 检查对象是否为空
   */
  static isEmptyObject(obj: any): boolean {
    return !obj || Object.keys(obj).length === 0;
  }
} 