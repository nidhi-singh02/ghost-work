import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Local sandbox: localhost:6870 (shared network via network_mode: service:sandbox)
// DevNet tunnel: localhost:8090 → DevNet nginx → participant:7575
const LEDGER_API_PORT = process.env.LEDGER_API_PORT || '6870'
const LEDGER_API_HOST = process.env.LEDGER_API_HOST || 'localhost'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: `http://${LEDGER_API_HOST}:${LEDGER_API_PORT}`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
