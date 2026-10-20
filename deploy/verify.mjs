// Read-only checks used after activation and when validating a rollback.
const base = (process.argv[2] || "http://127.0.0.1:8082").replace(/\/$/, "");
const expected = process.argv[3];
async function get(path) {
  const response = await fetch(base + path, { signal: AbortSignal.timeout(10000), cache: "no-store" });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response;
}
const health = await (await get("/api/health")).json();
if (health.ok !== true) throw new Error("API unhealthy");
await (await get("/api/clinics")).json();
await (await get("/api/specialties")).json();
const html = await (await get("/")).text();
const assets = [...new Set([...html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)/g)].map(match => match[1]))];
if (!assets.some(asset => asset.endsWith(".js")) || !assets.some(asset => asset.endsWith(".css"))) {
  throw new Error("Missing application bundles");
}
for (const asset of assets) await get(asset);
if (expected) {
  const version = await (await get("/version.json")).json();
  if (version.commit !== expected || version.branch !== "main") throw new Error("Unexpected deployed commit");
}
console.log(`Verified API, catalog, ${assets.length} bundles${expected ? ` and ${expected.slice(0, 7)}` : ""}`);
