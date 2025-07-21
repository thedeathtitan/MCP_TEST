import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, '../', '')
  
  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
    },
    define: {
      // Make env variables available globally
      __VITE_OPENAI_API_KEY__: JSON.stringify(env.VITE_OPENAI_API_KEY),
    },
    envDir: '../', // Look for .env files in the parent directory (MCP_TEST/)
  }
})
