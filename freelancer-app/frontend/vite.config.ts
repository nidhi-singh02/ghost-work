import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    proxy: {
      // Local sandbox: Canton sandbox running in Docker on port 6870
      // Use 127.0.0.1 (not localhost) to avoid IPv6 resolution issues with Docker
      '/api/local': {
        target: 'http://127.0.0.1:6870',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/local/, ''),
      },
      // DevNet: SSH tunnel to DevNet nginx on port 8090
      // Requires Host header for nginx routing to the participant node
      '/api/devnet': {
        target: 'http://127.0.0.1:8090',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/devnet/, ''),
        headers: {
          'Host': 'json-ledger-api.localhost',
        },
      },
    },
  },
})
