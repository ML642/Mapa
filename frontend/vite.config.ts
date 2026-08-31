import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: ['fleet-quail-actively.ngrok-free.app', 'dev.my-mapa.by'],
  },
})
