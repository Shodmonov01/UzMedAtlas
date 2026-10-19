import assert from "node:assert/strict";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

// Load the actual API helpers with Vite's import.meta.env support.
const vite = await createServer({
  configFile: false,
  root: fileURLToPath(new URL("..", import.meta.url)),
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, hmr: false, watch: null },
  appType: "custom",
  logLevel: "error",
});
after(() => vite.close());

const { api } = await vite.ssrLoadModule("/src/shared/api/client.ts");
const { uploadCabinetFile, cabinetLogin } = await vite.ssrLoadModule("/src/shared/api/cabinet.ts");

function captureRequest(check) {
  // Axios calls adapters after transformRequest, where the JSON header used
  // to replace the upload with {"file":{}} and discard all file bytes.
  api.defaults.adapter = async (config) => {
    await check(config);
    return {
      status: 200,
      statusText: "OK",
      headers: {},
      config,
      data: { url: "/uploads/kimyo.png" },
    };
  };
}

test("cabinet upload preserves a 178 KB photo as multipart data", async () => {
  const bytes = new Uint8Array(178 * 1024).fill(137);
  const file = new File([bytes], "kimyo.png", { type: "image/png" });
  captureRequest(async (config) => {
    assert.equal(config.url, "/api/cabinet/upload");
    assert.equal(config.withCredentials, true);
    assert.ok(config.data instanceof FormData);
    assert.notEqual(config.headers.getContentType(), "application/json");

    // Like the browser transport, Request generates the multipart boundary.
    const request = new Request("http://localhost/api/cabinet/upload", {
      method: "POST",
      body: config.data,
    });
    assert.match(request.headers.get("content-type"), /^multipart\/form-data; boundary=/);
    const form = await request.formData();
    const uploaded = form.get("file");
    assert.equal(uploaded.name, file.name);
    assert.equal(uploaded.type, file.type);
    assert.deepEqual(new Uint8Array(await uploaded.arrayBuffer()), bytes);
    assert.equal(form.has("purpose"), false);
  });
  assert.equal(await uploadCabinetFile(file), "/uploads/kimyo.png");
});

test("logo upload retains its purpose before the file", async () => {
  captureRequest((config) => {
    assert.ok(config.data instanceof FormData);
    assert.deepEqual([...config.data.keys()], ["purpose", "file"]);
    assert.equal(config.data.get("purpose"), "logo");
    assert.equal(config.data.get("file").size, 3);
  });
  await uploadCabinetFile(new File(["png"], "logo.png", { type: "image/png" }), "logo");
});

test("ordinary cabinet requests still serialize as JSON", async () => {
  captureRequest((config) => {
    assert.equal(config.url, "/api/cabinet/login");
    assert.equal(config.headers.getContentType(), "application/json");
    assert.deepEqual(JSON.parse(config.data), {
      email: "owner@example.com",
      password: "test-password",
    });
  });
  await cabinetLogin("owner@example.com", "test-password");
});
