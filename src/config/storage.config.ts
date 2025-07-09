import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

export const StorageConfig = {
  r2: {
    accountId: process.env['R2_ACCOUNT_ID'],
    accessKeyId: process.env['R2_ACCESS_KEY_ID'],
    secretAccessKey: process.env['R2_SECRET_ACCESS_KEY'],
    bucketName: process.env['R2_BUCKET_NAME'],
    publicUrl: process.env['R2_PUBLIC_URL'],
    region: 'auto', // R2默认region
    endpoint: `https://${process.env['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com`
  },
  local: {
    uploadPath: process.env['UPLOAD_PATH'] || './uploads',
    maxFileSize: parseInt(process.env['MAX_FILE_SIZE'] || '10485760', 10), // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'text/plain', 'application/pdf']
  },
  // 验证R2配置
  validateR2(): boolean {
    const { accountId, accessKeyId, secretAccessKey, bucketName } = this.r2;
    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
      console.warn('Cloudflare R2 configuration incomplete');
      return false;
    }
    return true;
  },
  // 获取存储策略（R2优先，本地备用）
  getStorageStrategy(): 'r2' | 'local' {
    return this.validateR2() ? 'r2' : 'local';
  }
}; 