import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // A linha 'base' foi removida para usar o padrão da Vercel.
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
})