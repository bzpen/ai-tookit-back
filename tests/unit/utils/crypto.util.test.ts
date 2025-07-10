import { CryptoUtil } from "../../../src/utils/crypto.util";

describe("CryptoUtil", () => {
  describe("generateRandomString", () => {
    it("应该生成指定长度的随机字符串", () => {
      const length = 16;
      const result = CryptoUtil.generateRandomString(length);

      expect(result).toHaveLength(length * 2); // hex编码长度是原长度的2倍
      expect(typeof result).toBe("string");
    });

    it("应该生成不同的随机字符串", () => {
      const result1 = CryptoUtil.generateRandomString(16);
      const result2 = CryptoUtil.generateRandomString(16);

      expect(result1).not.toBe(result2);
    });

    it("应该只包含十六进制字符", () => {
      const result = CryptoUtil.generateRandomString(16);

      expect(result).toMatch(/^[0-9a-f]+$/i);
    });
  });

  describe("generateUUID", () => {
    it("应该生成UUID", () => {
      const result = CryptoUtil.generateUUID();

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
      expect(result).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });

    it("应该生成不同的UUID", () => {
      const uuid1 = CryptoUtil.generateUUID();
      const uuid2 = CryptoUtil.generateUUID();

      expect(uuid1).not.toBe(uuid2);
    });
  });

  describe("hashPassword", () => {
    it("应该对密码进行哈希处理", async () => {
      const password = "test123456";
      const result = await CryptoUtil.hashPassword(password);

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
      expect(result).not.toBe(password);
      expect(result.length).toBeGreaterThan(password.length);
      expect(result).toContain(":"); // 包含salt分隔符
    });

    it("应该为相同密码生成不同的哈希", async () => {
      const password = "test123456";
      const hash1 = await CryptoUtil.hashPassword(password);
      const hash2 = await CryptoUtil.hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe("verifyPassword", () => {
    it("应该验证正确的密码", async () => {
      const password = "test123456";
      const hash = await CryptoUtil.hashPassword(password);

      const result = await CryptoUtil.verifyPassword(password, hash);

      expect(result).toBe(true);
    });

    it("应该拒绝错误的密码", async () => {
      const password = "test123456";
      const wrongPassword = "wrong123456";
      const hash = await CryptoUtil.hashPassword(password);

      const result = await CryptoUtil.verifyPassword(wrongPassword, hash);

      expect(result).toBe(false);
    });

    it("应该处理无效的哈希格式", async () => {
      const password = "test123456";
      const invalidHash = "invalid-hash";

      const result = await CryptoUtil.verifyPassword(password, invalidHash);

      expect(result).toBe(false);
    });
  });

  describe("generateJWTToken", () => {
    it("应该生成JWT令牌", () => {
      const payload = {
        userId: "test-user-id",
        email: "test@example.com",
        username: "testuser",
        role: "user",
      };
      const secret = "test-secret";

      const result = CryptoUtil.generateJWTToken(payload, secret);

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
      expect(result.split(".")).toHaveLength(3); // JWT格式：header.payload.signature
    });

    it("应该生成包含指定载荷的令牌", () => {
      const payload = {
        userId: "test-user-id",
        email: "test@example.com",
        username: "testuser",
        role: "user",
      };
      const secret = "test-secret";

      const token = CryptoUtil.generateJWTToken(payload, secret);
      const decoded = CryptoUtil.decodeJWTToken(token);

      expect(decoded).toMatchObject(payload);
    });
  });

  describe("verifyJWTToken", () => {
    it("应该验证有效的JWT令牌", () => {
      const payload = {
        userId: "test-user-id",
        email: "test@example.com",
        username: "testuser",
        role: "user",
      };
      const secret = "test-secret";

      const token = CryptoUtil.generateJWTToken(payload, secret);
      const result = CryptoUtil.verifyJWTToken(token, secret);

      expect(result.valid).toBe(true);
      expect(result.payload).toMatchObject(payload);
    });

    it("应该拒绝无效的JWT令牌", () => {
      const secret = "test-secret";
      const invalidToken = "invalid.token.here";

      const result = CryptoUtil.verifyJWTToken(invalidToken, secret);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("应该拒绝错误密钥签名的令牌", () => {
      const payload = {
        userId: "test-user-id",
        email: "test@example.com",
        username: "testuser",
        role: "user",
      };
      const secret = "test-secret";
      const wrongSecret = "wrong-secret";

      const token = CryptoUtil.generateJWTToken(payload, secret);
      const result = CryptoUtil.verifyJWTToken(token, wrongSecret);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("generateHMAC", () => {
    it("应该生成HMAC", () => {
      const data = "test-data";
      const secret = "test-secret";

      const result = CryptoUtil.generateHMAC(data, secret);

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
      expect(result).toMatch(/^[0-9a-f]+$/i);
    });

    it("应该为相同数据生成相同的HMAC", () => {
      const data = "test-data";
      const secret = "test-secret";

      const hmac1 = CryptoUtil.generateHMAC(data, secret);
      const hmac2 = CryptoUtil.generateHMAC(data, secret);

      expect(hmac1).toBe(hmac2);
    });
  });

  describe("verifyHMAC", () => {
    it("应该验证有效的HMAC", () => {
      const data = "test-data";
      const secret = "test-secret";
      const signature = CryptoUtil.generateHMAC(data, secret);

      const result = CryptoUtil.verifyHMAC(data, secret, signature);

      expect(result).toBe(true);
    });

    it("应该拒绝无效的HMAC", () => {
      const data = "test-data";
      const secret = "test-secret";
      const invalidSignature = "invalid-signature";

      const result = CryptoUtil.verifyHMAC(data, secret, invalidSignature);

      expect(result).toBe(false);
    });
  });

  describe("generateHash", () => {
    it("应该生成哈希", () => {
      const data = "test-data";

      const result = CryptoUtil.generateHash(data);

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
      expect(result).toMatch(/^[0-9a-f]+$/i);
    });

    it("应该为相同数据生成相同的哈希", () => {
      const data = "test-data";

      const hash1 = CryptoUtil.generateHash(data);
      const hash2 = CryptoUtil.generateHash(data);

      expect(hash1).toBe(hash2);
    });
  });

  describe("validatePasswordStrength", () => {
    it("应该验证强密码", () => {
      const strongPassword = "Test123!@#";

      const result = CryptoUtil.validatePasswordStrength(strongPassword);

      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(0);
    });

    it("应该拒绝弱密码", () => {
      const weakPassword = "123";

      const result = CryptoUtil.validatePasswordStrength(weakPassword);

      expect(result.isValid).toBe(false);
      expect(result.score).toBeLessThan(5);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("base64Encode", () => {
    it("应该编码base64", () => {
      const text = "Hello, World!";

      const result = CryptoUtil.base64Encode(text);

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
      expect(result).not.toBe(text);
    });
  });

  describe("base64Decode", () => {
    it("应该解码base64", () => {
      const text = "Hello, World!";
      const encoded = CryptoUtil.base64Encode(text);

      const result = CryptoUtil.base64Decode(encoded);

      expect(result).toBe(text);
    });
  });
});
