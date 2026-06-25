import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // host: true => accesible desde la tablet en la misma red (kiosco).
  server: { host: true },
  preview: { host: true },
  build: {
    // Firebase es pesado; subimos el umbral para no ensuciar el log de build.
    chunkSizeWarningLimit: 1500,
  },
});
