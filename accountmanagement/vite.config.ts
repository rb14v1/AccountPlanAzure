import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // PROXY RULE: Catch anything starting with /webhook
      // This works for BOTH '/webhook/chat' AND '/webhook-test/chat'
      '/webhook': {
        target: 'http://54.226.23.150:5678',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})