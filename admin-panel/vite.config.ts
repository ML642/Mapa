import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Mapbox is loaded lazily from the event drawer, but its published bundle is still a single large file.
    chunkSizeWarningLimit: 1800,
  },
  server: {
    host: '127.0.0.1',
    port: 4174,
  },
});
