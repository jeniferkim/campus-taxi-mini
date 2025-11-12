import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,          // ← 0.0.0.0에 바인딩
    port: 5173,          // (선택) 고정
    strictPort: true     // (선택) 포트 고정 실패 시 종료
  }
})