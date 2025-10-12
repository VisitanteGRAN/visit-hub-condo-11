import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 5173,
    host: true,
    hmr: {
      // Configuração específica para HMR (Hot Module Replacement)
      protocol: 'ws',
      port: 5174, // Porta diferente para WebSocket
      host: 'localhost',
      clientPort: 5174 // Porta que o cliente vai usar para conectar
    },
    watch: {
      usePolling: true, // Ajuda em ambientes onde o file watching não funciona bem
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