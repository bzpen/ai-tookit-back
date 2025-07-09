import { Router } from 'express';
import { v1Routes } from './v1/index';

export const routes = Router();

// 版本1路由
routes.use('/v1', v1Routes);

// 默认路由
routes.get('/', (_req, res) => {
  res.json({
    message: 'Test Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
}); 