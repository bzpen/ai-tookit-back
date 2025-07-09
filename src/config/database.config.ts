import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export class DatabaseConfig {
  private static db: Database.Database;

  static get database(): Database.Database {
    if (!this.db) {
      throw new Error('数据库未初始化');
    }
    return this.db;
  }

  static async initialize(): Promise<void> {
    try {
      // 创建data目录
      const dataDir = path.dirname(process.env['DATABASE_URL'] || './data/app.db');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // 初始化数据库连接
      this.db = new Database(process.env['DATABASE_URL'] || './data/app.db');
      
      // 设置数据库配置
      this.db.pragma('foreign_keys = ON');
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = NORMAL');
      this.db.pragma('temp_store = MEMORY');
      this.db.pragma('mmap_size = 268435456'); // 256MB

      console.log('数据库初始化成功');
    } catch (error) {
      console.error('数据库初始化失败:', error);
      throw error;
    }
  }

  static close(): void {
    if (this.db) {
      this.db.close();
      console.log('数据库连接已关闭');
    }
  }
} 