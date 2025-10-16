import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 8080,
    host: true,
    hmr: {
      protocol: 'ws',
      port: 8081,
      host: 'localhost',
      clientPort: 8081
    },
    watch: {
      usePolling: true,
    }
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Otimizações para produção
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  define: {
    // Garantir que as variáveis de ambiente sejam definidas
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
  }
});