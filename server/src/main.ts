import { buildApp } from "./app";
import { startTelegramWorker } from "./lib/telegram";

async function main() {
  const app = await buildApp();
  startTelegramWorker(app);
  await app.listen({ port: Number(process.env.PORT || 4000), host: process.env.HOST || "0.0.0.0" });
}
main().catch(error => { console.error(error); process.exit(1); });
