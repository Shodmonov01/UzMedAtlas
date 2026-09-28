import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import tanstackRouter from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, dirname, "VITE_");
  const apiTarget = (env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "");

  return {
    plugins: [
      tanstackRouter({
        target: "react",
        autoCodeSplitting: true,
        routesDirectory: "./src/app/routes",
        generatedRouteTree: "./src/app/router/routeTree.gen.ts",
      }),
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(dirname, "./src"),
      },
    },
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
        },
        "/uploads": {
          target: apiTarget,
          changeOrigin: true,
        },
        // Only static clinic media — SPA owns /clinics/:slug pages
        "/clinics": {
          target: apiTarget,
          changeOrigin: true,
          bypass(req) {
            const url = req.url || "";
            if (req.headers.accept?.includes("text/html")) return url;
            if (!/\.(svg|png|jpe?g|webp|gif|ico)$/i.test(url)) return url;
          },
        },
      },
    },
    preview: {
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
        },
        "/uploads": {
          target: apiTarget,
          changeOrigin: true,
        },
        "/clinics": {
          target: apiTarget,
          changeOrigin: true,
          bypass(req) {
            const url = req.url || "";
            if (req.headers.accept?.includes("text/html")) return url;
            if (!/\.(svg|png|jpe?g|webp|gif|ico)$/i.test(url)) return url;
          },
        },
      },
    },
  };
});
