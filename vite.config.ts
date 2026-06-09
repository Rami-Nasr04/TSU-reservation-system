import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import tailwindcss from "@tailwindcss/vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
react(), tailwindcss()],
  // amazon-cognito-identity-js references the Node `global` object, which does
  // not exist in browsers. Map it to globalThis so the bundle runs in prod.
  define: {
    global: "globalThis",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
