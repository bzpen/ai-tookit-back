import dotenv from "dotenv";

// 加载环境变量
dotenv.config();

export const AppConfig = {
  port: parseInt(process.env["PORT"] || "3000", 10),
  env: process.env["NODE_ENV"] || "development",
  cors: {
    origin: process.env["CORS_ORIGIN"]
      ? process.env["CORS_ORIGIN"].split(",").map((origin) => origin.trim())
      : ["http://localhost:3000"],
    credentials: true,
  },
  rateLimit: {
    windowMs:
      parseInt(process.env["RATE_LIMIT_WINDOW"] || "15", 10) * 60 * 1000, // 15分钟
    max: parseInt(process.env["RATE_LIMIT_MAX"] || "100", 10), // 限制每个IP 100次请求
  },
  log: {
    level: process.env["LOG_LEVEL"] || "info",
    file: process.env["LOG_FILE"] || "./logs/app.log",
  },
  jwt: {
    secret:
      process.env["JWT_SECRET"] || "your_jwt_secret_key_minimum_32_characters",
    expiresIn: process.env["JWT_EXPIRES_IN"] || "7d",
  },
  security: {
    bcryptRounds: parseInt(process.env["BCRYPT_ROUNDS"] || "12", 10),
  },
};
