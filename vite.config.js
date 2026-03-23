import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // هذا الاختصار سيسمح لك باستخدام '@' للوصول لمجلد src مباشرة
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@data': path.resolve(__dirname, './src/data'),
      '@assets': path.resolve(__dirname, './src/assets'),
    },
  },
  server: {
    port: 3000, // تشغيل المشروع على بورت 3000 (اختياري)
    open: true, // لفتح المتصفح تلقائياً عند التشغيل
    proxy: {
      // توجيه طلبات الـ API إلى سيرفر Node.js (Backend) مستقبلاً
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
