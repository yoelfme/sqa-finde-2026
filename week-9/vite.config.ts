import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'

export default defineConfig({
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    tailwindcss(),
    // tanstackStart runs the router codegen itself via @tanstack/router-plugin.
    // Adding tanstackRouter() alongside it would generate the route tree twice.
    tanstackStart(),
    react(),
  ],
})
