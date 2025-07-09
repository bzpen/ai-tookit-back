import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

export const ReplicateConfig = {
  apiToken: process.env['REPLICATE_API_TOKEN'],
  baseUrl: 'https://api.replicate.com/v1',
  timeout: 30000, // 30秒超时
  retries: 3, // 重试次数
  models: {
    // 常用模型配置
    textGeneration: 'meta/llama-2-70b-chat:02e509c789964a7ea8736978a43525956ef40397be9033abf9fd2badfe68c9e3',
    imageGeneration: 'stability-ai/stable-diffusion:27b93a2413e7f36cd83da926f3656280b2931564ff050bf9575f1fdf9bcd7478',
    speechToText: 'openai/whisper:30414ee7c4fffc37e260fcab7842b5be470b9b840f2b608f5baa9bbef9a259ed'
  },
  // 验证配置
  validate(): boolean {
    if (!this.apiToken) {
      console.warn('Replicate API token not configured');
      return false;
    }
    return true;
  }
}; 