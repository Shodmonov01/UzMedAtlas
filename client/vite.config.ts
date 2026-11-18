import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";
import tailwindcss from "@tailwindcss/vite";
import tanstackRouter from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin, type ProxyOptions } from "vite";

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

/** Writes a brotli (.br) and a gzip (.gz) copy next to every text file of the build, once, at the strongest level.
 *  The server sends them instead of the plain file to browsers that accept them (server/src/app.ts, preCompressed). */
function precompress(): Plugin {
  let outDir = "";
  return {
    name: "precompress",
    apply: "build",
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    async closeBundle() {
      const walk = (dir: string): string[] =>
        fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
          const file = path.join(dir, entry.name);
          return entry.isDirectory() ? walk(file) : [file];
        });
      const files = walk(outDir).filter((file) => /\.(js|mjs|css|svg|json|webmanifest|txt|xml)$/i.test(file));
      await Promise.all(
        files.map(async (file) => {
          const source = await fs.promises.readFile(file);
          if (source.length < 1024) return;
          const br = zlib.brotliCompressSync(source, {
            params: {
              [zlib.constants.BROTLI_PARAM_QUALITY]: zlib.constants.BROTLI_MAX_QUALITY,
              [zlib.constants.BROTLI_PARAM_SIZE_HINT]: source.length,
            },
          });
          const gz = zlib.gzipSync(source, { level: zlib.constants.Z_BEST_COMPRESSION });
          await Promise.all([fs.promises.writeFile(`${file}.br`, br), fs.promises.writeFile(`${file}.gz`, gz)]);
        }),
      );
    },
  };
}

/** Libraries go into their own long-lived files: a site update changes only the app's code, so returning visitors
 *  keep React, the router and GSAP from their cache. */
function vendorChunk(id: string) {
  if (!id.includes("node_modules")) return undefined;
  if (/node_modules\/(react|react-dom|scheduler|use-sync-external-store)\//.test(id)) return "react";
  if (/node_modules\/@tanstack\//.test(id)) return "tanstack";
  if (/node_modules\/(gsap|@gsap)\//.test(id)) return "gsap";
  return undefined;
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
      precompress(),
    ],
    build: {
      rollupOptions: {
        output: { manualChunks: vendorChunk },
      },
    },
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
