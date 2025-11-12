import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,          // ← 0.0.0.0에 바인딩
    port: 5173,          // (선택) 고정
    // Nginx를 통해 들어오는 경우를 대비해 안전핀으로 허용
    allowedHosts: ['localhost', 'frontend'],
  }
})