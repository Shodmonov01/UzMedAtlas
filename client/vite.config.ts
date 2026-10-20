import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import tanstackRouter from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type ProxyOptions } from "vite";

const dirname = path.dirname(fileURLToPath(import.meta.url));

function apiOrigin(raw: string) {
  return raw.trim().replace(/\/+$/, "").replace(/\/api$/, "");
}

function proxyCommon(target: string): Pick<ProxyOptions, "target" | "changeOrigin" | "configure"> {
  return {
    target,
    changeOrigin: true,
    configure(proxy) {
      proxy.on("proxyReq", (proxyReq) => {
        // Прод отклоняет чужой Origin (CORS → 500). Без заголовка API отвечает.
        proxyReq.removeHeader("origin");
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, dirname, "");
  const apiTarget = apiOrigin(env.API_PROXY_TARGET || env.VITE_API_URL || "http://localhost:4000");

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
        "/api": proxyCommon(apiTarget),
        "/uploads": proxyCommon(apiTarget),
        // Only static clinic media — SPA owns /clinics/:slug pages
        "/clinics": {
          ...proxyCommon(apiTarget),
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
        "/api": proxyCommon(apiTarget),
        "/uploads": proxyCommon(apiTarget),
        "/clinics": {
          ...proxyCommon(apiTarget),
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
