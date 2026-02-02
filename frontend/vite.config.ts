import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Set base to '/rakutan/' for production deployment under pai314.jp/rakutan
  // For local development, this will be overridden by dev server
  base: process.env.NODE_ENV === 'production' ? '/rakutan/' : '/',
})
