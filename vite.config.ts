import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// import { componentTagger } from "lovable-tagger"; // Removed lovable dependency

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()], // Removed lovable componentTagger
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: mode === 'development',
    rollupOptions: {
      output: {
        // Force cache bust with timestamp
        entryFileNames: `[name]-[hash]-${Date.now()}.js`,
        chunkFileNames: `[name]-[hash]-${Date.now()}.js`,
        assetFileNames: `[name]-[hash]-${Date.now()}.[ext]`,
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // Keep React together to avoid context issues
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-core';
            }
            // Separate UI libraries
            if (id.includes('@radix-ui') || id.includes('sonner') || id.includes('@tanstack')) {
              return 'ui-libs';
            }
            // Supabase and other services
            if (id.includes('@supabase')) {
              return 'supabase';
            }
            // Everything else
            return 'vendor';
          }
        },
      },
    },
  },
}));
