import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// API_TARGET permite apuntar el proxy a otro traductor (p. ej. para probar el modo sin conexión).
const api = process.env.API_TARGET ?? "http://localhost:8002";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.js",
      injectRegister: null, // se registra a mano en main.tsx, solo en producción
      injectManifest: { globPatterns: ["**/*.{js,css,html,svg,png,webmanifest}"] },
      manifest: {
        name: "Diablos Stuff+",
        short_name: "Stuff+",
        description: "Calidad de pitcheo ajustada por altitud para decidir a quién usar y a quién fichar.",
        lang: "es",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#0b0b0d",
        theme_color: "#0b0b0d",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: { "/api": api },
  },
  preview: {
    proxy: { "/api": api },
  },
});
