// vite.config.ts
import { defineConfig } from "file:///Users/luccalacerda/Desktop/APP/visit-hub-condo-11/node_modules/vite/dist/node/index.js";
import react from "file:///Users/luccalacerda/Desktop/APP/visit-hub-condo-11/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
var __vite_injected_original_dirname = "/Users/luccalacerda/Desktop/APP/visit-hub-condo-11";
var vite_config_default = defineConfig({
  server: {
    port: 5173,
    host: true
  },
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  build: {
    // Otimizações para produção
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          supabase: ["@supabase/supabase-js"],
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu"]
        }
      }
    },
    chunkSizeWarningLimit: 1e3
  },
  define: {
    // Garantir que as variáveis de ambiente sejam definidas
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "production")
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvbHVjY2FsYWNlcmRhL0Rlc2t0b3AvQVBQL3Zpc2l0LWh1Yi1jb25kby0xMVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL2x1Y2NhbGFjZXJkYS9EZXNrdG9wL0FQUC92aXNpdC1odWItY29uZG8tMTEvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL2x1Y2NhbGFjZXJkYS9EZXNrdG9wL0FQUC92aXNpdC1odWItY29uZG8tMTEvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBzZXJ2ZXI6IHtcbiAgICBwb3J0OiA1MTczLFxuICAgIGhvc3Q6IHRydWUsXG4gIH0sXG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLFxuICBdLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxuICAgIH0sXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgLy8gT3RpbWl6YVx1MDBFN1x1MDBGNWVzIHBhcmEgcHJvZHVcdTAwRTdcdTAwRTNvXG4gICAgc291cmNlbWFwOiBmYWxzZSxcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XG4gICAgICAgICAgdmVuZG9yOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbSddLFxuICAgICAgICAgIHN1cGFiYXNlOiBbJ0BzdXBhYmFzZS9zdXBhYmFzZS1qcyddLFxuICAgICAgICAgIHVpOiBbJ0ByYWRpeC11aS9yZWFjdC1kaWFsb2cnLCAnQHJhZGl4LXVpL3JlYWN0LWRyb3Bkb3duLW1lbnUnXVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDEwMDBcbiAgfSxcbiAgZGVmaW5lOiB7XG4gICAgLy8gR2FyYW50aXIgcXVlIGFzIHZhcmlcdTAwRTF2ZWlzIGRlIGFtYmllbnRlIHNlamFtIGRlZmluaWRhc1xuICAgICdwcm9jZXNzLmVudi5OT0RFX0VOVic6IEpTT04uc3RyaW5naWZ5KHByb2Nlc3MuZW52Lk5PREVfRU5WIHx8ICdwcm9kdWN0aW9uJylcbiAgfVxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXdVLFNBQVMsb0JBQW9CO0FBQ3JXLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFGakIsSUFBTSxtQ0FBbUM7QUFLekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLEVBQ1I7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxFQUNSO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUE7QUFBQSxJQUVMLFdBQVc7QUFBQSxJQUNYLGVBQWU7QUFBQSxNQUNiLFFBQVE7QUFBQSxRQUNOLGNBQWM7QUFBQSxVQUNaLFFBQVEsQ0FBQyxTQUFTLFdBQVc7QUFBQSxVQUM3QixVQUFVLENBQUMsdUJBQXVCO0FBQUEsVUFDbEMsSUFBSSxDQUFDLDBCQUEwQiwrQkFBK0I7QUFBQSxRQUNoRTtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFDQSx1QkFBdUI7QUFBQSxFQUN6QjtBQUFBLEVBQ0EsUUFBUTtBQUFBO0FBQUEsSUFFTix3QkFBd0IsS0FBSyxVQUFVLFFBQVEsSUFBSSxZQUFZLFlBQVk7QUFBQSxFQUM3RTtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
