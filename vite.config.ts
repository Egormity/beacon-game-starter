import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const value = (process.env.PORT ?? loadEnv(mode, process.cwd(), 'PORT').PORT)?.trim();
  const port = value ? Number(value) : undefined;
  if (port !== undefined && (!Number.isInteger(port) || port < 1 || port > 65535)) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }
  return {
    plugins: [react()],
    base: './',
    server: { host: '0.0.0.0', port: port ?? 4420, strictPort: true },
    preview: { host: '0.0.0.0', port: port ?? 4421, strictPort: true },
    // Rapier's compatibility package embeds WASM; keep that independently cacheable chunk explicit.
    build: {
      rollupOptions: {
        output: { manualChunks: { three: ['three'], physics: ['@dimforge/rapier3d-compat'] } },
      },
      chunkSizeWarningLimit: 4500,
    },
  };
});
