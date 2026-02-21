import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The SSH tunnel maps localhost:8090 → DevNet nginx:8080
// Nginx routes requests with Host: json-ledger-api.localhost → participant:7575
const TUNNEL_PORT = process.env.TUNNEL_PORT || '8090'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: `http://localhost:${TUNNEL_PORT}`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        headers: {
          'Host': 'json-ledger-api.localhost',
        },
      },
    },
  },
})
