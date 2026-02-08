import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from "vite-plugin-svgr";
import checker from 'vite-plugin-checker';
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

export default defineConfig({
  plugins: [react(),
  tsconfigPaths(),
  svgr({
    svgrOptions: {
    },
  }),

  ],
  base: process.env.PUBLIC_URL || "/",
  resolve: {
    alias: {
      "~bootstrap": path.resolve(__dirname, "node_modules/bootstrap"),
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom", "@mui/material", "@mui/icons-material", "@mui/lab", "three", "@react-three/fiber"],
    esbuildOptions: {
      target: "esnext",
    },
  },
  server: {
    host: "0.0.0.0",
    port: 8000,
    strictPort: true,
    hmr: true,
    watch: {
      usePolling: false,
    },
    allowedHosts: true,
    fs: {
      strict: false,
    },
    proxy: {
      '/api': {
        target: 'http://111.92.105.222:8081',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  cacheDir: "node_modules/.vite_cache",
  build: {
    outDir: 'build',
    rollupOptions: {

      output: {
        manualChunks: {
          reactVendor: ["react", "react-dom"],
          mui: ["@mui/material", "@mui/icons-material", "@mui/lab", "@mui/styles"],
          lodash: ["lodash-es"],
          highlight: ["highlight.js"],
          materialTable: ["@material-table/core"],
          jspdf: ["jspdf"],
          apexcharts: ["react-apexcharts", "apexcharts"],
        },
      },
    },
  },
  define: {
    global: 'window'
  }

})



