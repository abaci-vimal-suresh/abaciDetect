import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from "vite-plugin-svgr";
import checker from 'vite-plugin-checker';
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(),
  tsconfigPaths(),
  svgr({
    svgrOptions: {
      // svgr options (optional)
    },
  }),
    // checker({
    //   typescript: {
    //     tsconfigPath: './tsconfig.json',
    //   },
    //   // eslint: {
    //     //   lintCommand: "eslint --ext .js,.jsx,.ts,.tsx src", // ESLint for `.js`, `.jsx`, `.ts`, `.tsx`
    //   // },
    // })
  ],
  base: process.env.PUBLIC_URL || "/",
  resolve: {
    alias: {
      "~bootstrap": path.resolve(__dirname, "node_modules/bootstrap"),
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom", "@mui/material", "@mui/icons-material", "@mui/lab",],
    esbuildOptions: {
      target: "esnext",
    },
  },
  server: {
    host: "0.0.0.0", // Listen on all network interfaces
    port: 5173,
    strictPort: true,
    hmr: false, // Bypass WebSocket/HMR completely as requested
    watch: {
      usePolling: true,
    },
    allowedHosts: true, // Allow any host for debugging purposes
    fs: {
      strict: false, // Less restrictive for file access
    },
  },

  cacheDir: "node_modules/.vite_cache",
  build: {
    outDir: 'build',
    rollupOptions: {

      output: {
        manualChunks: {
          reactVendor: ["react", "react-dom"], // Separate React
          mui: ["@mui/material", "@mui/icons-material", "@mui/lab", "@mui/styles"], // Separate MUI
          lodash: ["lodash-es"], // Separate Lodash
          highlight: ["highlight.js"], // Separate Highlight.js
          materialTable: ["@material-table/core"], // Separate Material-Table
          jspdf: ["jspdf"],
          apexcharts: ["react-apexcharts", "apexcharts"],
        },
      },
    },
  },
  define: {
    global: 'window' // Polyfill global for browser use
  }

})



