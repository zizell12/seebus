import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: ['seebus.local', 'localhost'],
    hmr: {
      host: 'seebus.local',
      protocol: 'http',
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
})
