import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { compression } from 'vite-plugin-compression2';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
      plugins: [
            react(),
            tailwindcss(),
            compression({ algorithms: ['gzip'] }),
            compression({ algorithms: ['brotliCompress'], filename: '[path][base].br' }),
      ],
      resolve: {
            alias: {
                  '@': path.resolve(__dirname, './src'),
            },
      },
      server: {
            headers: {
                  "Cross-Origin-Opener-Policy": "unsafe-none",
                  "Cross-Origin-Embedder-Policy": "unsafe-none",
                  "Permissions-Policy": "otp-credentials=*",
            },
      },
      build: {
            chunkSizeWarningLimit: 1000,
            assetsInlineLimit: 4096,
            cssCodeSplit: true,
            rollupOptions: {
                  output: {
                        manualChunks(id) {
                              if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/') || id.includes('node_modules/react-router-dom')) {
                                    return 'vendor';
                              }
                              if (id.includes('node_modules/lucide-react') || id.includes('node_modules/react-icons')) {
                                    return 'icons';
                              }
                              if (id.includes('node_modules/leaflet') || id.includes('node_modules/react-leaflet') || id.includes('node_modules/leaflet-routing-machine')) {
                                    return 'maps';
                              }
                              if (id.includes('node_modules/socket.io-client')) {
                                    return 'socket';
                              }
                              if (id.includes('node_modules/@stripe')) {
                                    return 'payment';
                              }
                        },
                  },
            },
      },
});
