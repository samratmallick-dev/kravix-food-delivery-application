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
                        manualChunks: {
                              vendor: ['react', 'react-dom', 'react-router-dom'],
                              icons: ['lucide-react', 'react-icons'],
                              maps: ['leaflet', 'react-leaflet', 'leaflet-routing-machine'],
                              socket: ['socket.io-client'],
                              payment: ['@stripe/stripe-js'],
                        },
                  },
            },
      },
});
