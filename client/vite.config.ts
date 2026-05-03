import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
      plugins: [react(), tailwindcss()],
      server: {
            headers: {
                  "Cross-Origin-Opener-Policy": "unsafe-none",
                  "Cross-Origin-Embedder-Policy": "unsafe-none",
                  "Permissions-Policy": "otp-credentials=*",
            },
      },
      build: {
            rollupOptions: {
                  output: {
                        manualChunks: {
                              vendor: ['react', 'react-dom', 'react-router-dom'],
                              icons: ['lucide-react', 'react-icons'],
                              maps: ['leaflet', 'react-leaflet'],
                              payment: ['@stripe/stripe-js'],
                        },
                  },
            },
      },
});
