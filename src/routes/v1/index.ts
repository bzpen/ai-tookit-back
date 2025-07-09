import { Router, type Router as ExpressRouter } from 'express';

export const v1Routes: ExpressRouter = Router();

// 测试路由
v1Routes.get('/test', (_req, res) => {
  res.json({
    message: 'Test API v1',
    timestamp: new Date().toISOString()
  });
});

// 健康检查路由
v1Routes.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
}); 