import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      // NOTE: 排除后端数据目录的文件监听
      // 抽卡时后端会写入 users.json / cards.json，触发 HMR 全页刷新导致状态丢失
      watch: {
        ignored: ['**/backend/**'],
      },
      // NOTE: 开发代理，将 /api 请求转发到 FastAPI 后端
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          // NOTE: AI 生图 API 耗时较长（60s+），默认超时会截断响应
          timeout: 120000,
        },
        '/uploads': {
          target: 'http://localhost:8000',
          changeOrigin: true,
        },
      },
    },
  };
});
