import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import type { FastifyInstance } from "fastify";
import type { PrismaClient } from "@prisma/client";

const directory = mkdtempSync(path.join(tmpdir(), "uzmedatlas-telegram-tests-"));
const database = path.join(directory, "test.db").replace(/\\/g, "/");
// Prisma's SQLite engine on Windows expects the target file to exist.
writeFileSync(database, "");
process.env.DATABASE_URL = `file:${database}`;
process.env.NODE_ENV = "test";
process.env.SITE_URL = "https://uzmedguide.uz";
process.env.ADMIN_PASSWORD = "test-admin-password-only";
process.env.ADMIN_SESSION_SECRET = "test-session-secret-not-used-in-production";
process.env.TELEGRAM_BOT_TOKEN = "test-token-only";
process.env.TELEGRAM_BOT_USERNAME = "test_uzmed_bot";
process.env.TELEGRAM_WEBHOOK_SECRET = "test-webhook-secret-only";
let app: FastifyInstance;
let db: PrismaClient;
let telegram: typeof import("./lib/telegram");
let auth: typeof import("./lib/auth");
let ownerId: string, otherOwnerId: string, clinicId: string, otherClinicId: string;
const rootCookie = () => login(undefined, process.env.ADMIN_PASSWORD!);
async function login(email: string | undefined, password: string) {
  const response = await app.inject({ method: "POST", url: "/api/admin/login", payload: { email, password } });
  expect(response.statusCode).toBe(200);
  const cookies = response.headers["set-cookie"];
  const cookie = (Array.isArray(cookies) ? cookies : [cookies]).find(c => c?.startsWith("uma_admin="))!;
  expect(cookie).toContain("HttpOnly"); expect(cookie).toContain("Secure");
  return cookie.split(";")[0];
}
async function cabinetCookie() {
  const response = await app.inject({ method: "POST", url: "/api/cabinet/login", payload: { email: "owner@example.test", password: "owner-test-password" } });
  expect(response.statusCode).toBe(200);
  const cookies = response.headers["set-cookie"];
  return (Array.isArray(cookies) ? cookies : [cookies]).find(c => c?.startsWith("uma_clinic="))!.split(";")[0];
}
async function invite(base: string, cookie: string) {
  const response = await app.inject({ method: "POST", url: base + "/invite", headers: { cookie } });
  expect(response.statusCode).toBe(200);
  return response.json() as { url: string; expiresAt: string; id: string };
}
async function start(url: string, id: number, user = 10001, type = "private") {
  const code = new URL(url).searchParams.get("start");
  return app.inject({ method: "POST", url: "/api/telegram/webhook", headers: { "x-telegram-bot-api-secret-token": process.env.TELEGRAM_WEBHOOK_SECRET! },
    payload: { update_id: id, message: { chat: { id: user, type }, from: { id: user, first_name: "Test User" }, text: "/start " + code } } });
}
async function connection(subject: string, kind: string, user: number, extra: Record<string,string> = {}) {
  return db.telegramConnection.create({ data: { subject, kind, userId: String(user), chatId: String(user), displayName: "Test User", ...extra } });
}
async function moderator() {
  const response = await app.inject({ method: "POST", url: "/api/admin/staff", headers: { cookie: await rootCookie() }, payload: { name: "Test Moderator", email: "moderator@example.test" } });
  expect(response.statusCode).toBe(201);
  const staff = response.json();
  return { ...staff, cookie: await login(staff.email, staff.password) };
}

beforeAll(async () => {
  execFileSync(process.execPath, [path.resolve("node_modules/prisma/build/index.js"), "db", "push", "--schema", "prisma/schema.prisma", "--skip-generate"], { env: process.env, stdio: "pipe" });
  ({ prisma: db } = await import("./lib/db"));
  auth = await import("./lib/auth"); telegram = await import("./lib/telegram");
  const { buildApp } = await import("./app");
  app = await buildApp({ logger: false });
}, 60000);
beforeEach(async () => {
  expect(process.env.DATABASE_URL).toBe(`file:${database}`);
  await db.telegramDelivery.deleteMany(); await db.telegramInvite.deleteMany(); await db.telegramConnection.deleteMany(); await db.telegramUpdate.deleteMany();
  await db.emailLog.deleteMany(); await db.lead.deleteMany(); await db.analyticsEvent.deleteMany();
  await db.clinic.deleteMany(); await db.clinicOwner.deleteMany(); await db.staffAccount.deleteMany(); await db.specialty.deleteMany();
  const owner = await db.clinicOwner.create({ data: { email: "owner@example.test", name: "Test Owner", passwordHash: auth.hashPassword("owner-test-password") } });
  const otherOwner = await db.clinicOwner.create({ data: { email: "other@example.test", name: "Other Owner", passwordHash: auth.hashPassword("other-owner-password") } });
  ownerId = owner.id; otherOwnerId = otherOwner.id;
  const fields = { nameRu: "Тестовая клиника", nameEn: "Test clinic", city: "tashkent", addressRu: "Тестовый адрес", addressEn: "Test address", descriptionRu: "Тестовое описание", descriptionEn: "Test description", phone: "+998901234567", email: "clinic@example.test", languages: "[\"ru\"]", status: "published", published: true };
  clinicId = (await db.clinic.create({ data: { ...fields, slug: "test-clinic", ownerId } })).id;
  otherClinicId = (await db.clinic.create({ data: { ...fields, slug: "other-clinic", ownerId: otherOwnerId } })).id;
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
afterAll(async () => {
  if (app) await app.close(); if (db) await db.$disconnect();
  if (path.dirname(directory) !== path.resolve(tmpdir()) || !path.basename(directory).startsWith("uzmedatlas-telegram-tests-")) throw new Error("Unexpected test directory");
  rmSync(directory, { recursive: true, force: true });
});

describe("Telegram roles, invitations and delivery", () => {
  it("allows only administrators to manage staff; disabled accounts lose existing sessions", async () => {
    const staff = await moderator();
    const forbidden = await app.inject({ method: "POST", url: "/api/admin/staff", headers: { cookie: staff.cookie }, payload: { name: "Illegal", email: "illegal@example.test" } });
    expect(forbidden.statusCode).toBe(403);
    const list = await app.inject({ url: "/api/admin/staff", headers: { cookie: await rootCookie() } });
    expect(list.body).not.toContain(staff.password); expect(list.body).not.toContain("passwordHash");
    const disabled = await app.inject({ method: "PATCH", url: `/api/admin/staff/${staff.id}`, headers: { cookie: await rootCookie() }, payload: { active: false } });
    expect(disabled.statusCode).toBe(200);
    expect((await app.inject({ url: "/api/admin/me", headers: { cookie: staff.cookie } })).statusCode).toBe(401);
  });
  it("hashes invitations, accepts them once and deduplicates webhook retries", async () => {
    const issued = await invite("/api/admin/telegram", await rootCookie());
    const code = new URL(issued.url).searchParams.get("start")!;
    expect((await db.telegramInvite.findUniqueOrThrow({ where: { id: issued.id } })).tokenHash).not.toBe(code);
    expect((await start(issued.url, 100)).statusCode).toBe(200);
    expect((await start(issued.url, 100)).statusCode).toBe(200);
    expect(await db.telegramConnection.count()).toBe(1);
    expect(await db.telegramDelivery.count()).toBe(1);
    await start(issued.url, 101, 10002);
    expect((await db.telegramConnection.findUniqueOrThrow({ where: { subject: "administrator" } })).userId).toBe("10001");
  });
  it("rejects expired, replaced and revoked invitations", async () => {
    const cookie = await rootCookie();
    const old = await invite("/api/admin/telegram",cookie);
    const current = await invite("/api/admin/telegram",cookie);
    await start(old.url,201); expect(await db.telegramConnection.count()).toBe(0);
    await db.telegramInvite.update({ where: { id: current.id }, data: { expiresAt: new Date(0) } });
    await start(current.url,202); expect(await db.telegramConnection.count()).toBe(0);
    const revoked = await invite("/api/admin/telegram",cookie);
    await app.inject({ method: "DELETE", url: "/api/admin/telegram", headers: { cookie } });
    await start(revoked.url,203); expect(await db.telegramConnection.count()).toBe(0);
  });
  it("rejects forged webhooks and does not grant access to group chats or ordinary /start", async () => {
    const issued = await invite("/api/admin/telegram",await rootCookie());
    const forged = await app.inject({ method: "POST", url: "/api/telegram/webhook", payload: { update_id: 300 } });
    expect(forged.statusCode).toBe(401);
    await start(issued.url,301,10001,"group");
    expect((await db.telegramInvite.findUniqueOrThrow({ where: { id: issued.id } })).usedAt).toBeNull();
    const noCode = await app.inject({ method: "POST", url: "/api/telegram/webhook", headers: { "x-telegram-bot-api-secret-token": process.env.TELEGRAM_WEBHOOK_SECRET! }, payload: { update_id: 302, message: { text: "/start", chat: { id: 10001, type: "private" }, from: { id: 10001, first_name: "Test" } } } });
    expect(noCode.statusCode).toBe(200); expect(await db.telegramConnection.count()).toBe(0);
  });
  it("lets moderators invite owners, scopes owners to their clinic and denies self-issuance", async () => {
    const staff = await moderator();
    const issued = await invite(`/api/admin/clinics/${clinicId}/telegram`,staff.cookie);
    await start(issued.url,401);
    const linked = await db.telegramConnection.findFirstOrThrow();
    expect(linked.kind).toBe("clinic"); expect(linked.clinicId).toBe(clinicId); expect(linked.ownerId).toBe(ownerId);
    const ownerCookie = await cabinetCookie();
    expect((await app.inject({ method: "POST", url: `/api/admin/clinics/${otherClinicId}/telegram/invite`, headers: { cookie: ownerCookie } })).statusCode).toBe(401);
    expect((await app.inject({ method: "DELETE", url: `/api/cabinet/telegram/${otherClinicId}`, headers: { cookie: ownerCookie } })).statusCode).toBe(404);
    expect((await app.inject({ method: "POST", url: `/api/cabinet/clinics/${otherClinicId}/submit`, headers: { cookie: ownerCookie } })).statusCode).toBe(404);
  });
  it("does not accept owner invitations after ownership changes", async () => {
    const issued = await invite(`/api/admin/clinics/${clinicId}/telegram`,await rootCookie());
    await db.clinic.update({ where: { id: clinicId }, data: { ownerId: otherOwnerId } });
    await start(issued.url,500);
    expect(await db.telegramConnection.count()).toBe(0);
  });
  it("atomically stores a lead and notifications; duplicates neither leads nor messages", async () => {
    await connection("administrator","administrator",10001);
    await connection(`clinic:${clinicId}:${ownerId}`,"clinic",10002,{ clinicId, ownerId });
    await connection(`clinic:${otherClinicId}:${otherOwnerId}`,"clinic",10003,{ clinicId: otherClinicId, ownerId: otherOwnerId });
    const payload = { fullName: "Test patient private", country: "Uzbekistan", phone: "+998901234567", contactMethod: "telegram", consent: true, idempotencyKey: "test-idempotency-unique", medicalNeed: "private medical details" };
    const first = await app.inject({ method: "POST", url: "/api/clinics/test-clinic/leads", payload });
    expect(first.statusCode, first.body).toBe(201);
    const second = await app.inject({ method: "POST", url: "/api/clinics/test-clinic/leads", payload });
    expect(second.json().duplicate).toBe(true); expect(second.json().id).toBe(first.json().id);
    expect(await db.lead.count()).toBe(1);
    const messages = await db.telegramDelivery.findMany();
    expect(messages).toHaveLength(2); expect(messages.map(m => m.chatId).sort()).toEqual(["10001","10002"]);
    for (const message of messages) { expect(message.text).not.toContain(payload.fullName); expect(message.text).not.toContain(payload.medicalNeed); }
    expect(await db.emailLog.count()).toBe(0);
  });
  it("rechecks recipient permissions at delivery and cancels stale ownership", async () => {
    const link = await connection(`clinic:${clinicId}:${ownerId}`,"clinic",10001,{ clinicId, ownerId });
    const clinic = await db.clinic.findUniqueOrThrow({ where: { id: clinicId } });
    await db.$transaction(tx => telegram.queueClinicNotification(tx,{ clinic,eventKey: "stale",title: "Test",audience: "owner" }));
    await db.clinic.update({ where: { id: clinicId }, data: { ownerId: otherOwnerId } });
    const fetchMock = vi.fn(); vi.stubGlobal("fetch",fetchMock);
    await telegram.drainTelegramQueue(); expect(fetchMock).not.toHaveBeenCalled();
    expect((await db.telegramDelivery.findFirstOrThrow({ where: { connectionId: link.id } })).status).toBe("cancelled");
  });
  it("rolls back a new lead if storing its notification fails", async () => {
    vi.spyOn(telegram,"queueClinicNotification").mockRejectedValueOnce(new Error("queue database failure"));
    const response = await app.inject({ method: "POST", url: "/api/clinics/test-clinic/leads", payload: {
      fullName: "Rollback test", country: "Uzbekistan", phone: "+998901234569", contactMethod: "telegram", consent: true, idempotencyKey: "rollback-test-key", medicalNeed: "Test medical request",
    } });
    expect(response.statusCode).toBe(500); expect(await db.lead.count()).toBe(0);
  });
  it("deduplicates simultaneous submissions and messages to one chat with two roles", async () => {
    await connection("administrator","administrator",10001);
    await connection(`clinic:${clinicId}:${ownerId}`,"clinic",10001,{ clinicId,ownerId });
    const payload = { fullName: "Concurrent test", country: "Uzbekistan", phone: "+998901234568", contactMethod: "telegram", consent: true, idempotencyKey: "concurrent-test-key", medicalNeed: "Test medical request" };
    const responses = await Promise.all([app.inject({ method: "POST", url: "/api/clinics/test-clinic/leads", payload }),app.inject({ method: "POST", url: "/api/clinics/test-clinic/leads", payload })]);
    expect(responses.map(r => r.statusCode).sort()).toEqual([200,201]);
    expect(responses[0].json().id).toBe(responses[1].json().id);
    expect(await db.lead.count()).toBe(1); expect(await db.telegramDelivery.count()).toBe(1);
  });
  it("notifies only the relevant owner about moderation decisions", async () => {
    await connection("administrator","administrator",10001);
    await connection(`clinic:${clinicId}:${ownerId}`,"clinic",10002,{ clinicId,ownerId });
    await connection(`clinic:${otherClinicId}:${otherOwnerId}`,"clinic",10003,{ clinicId: otherClinicId,ownerId: otherOwnerId });
    await db.clinic.update({ where: { id: clinicId },data: { status: "moderation" } });
    const rejected = await app.inject({ method: "POST",url: `/api/admin/moderation/${clinicId}/reject`,headers: { cookie: await rootCookie() },payload: { note: "Please complete the clinic profile" } });
    expect(rejected.statusCode,rejected.body).toBe(200);
    expect(rejected.json().status).toBe("needs_changes");
    const rows = await db.telegramDelivery.findMany(); expect(rows).toHaveLength(1); expect(rows[0].chatId).toBe("10002");
  });
  it("retries Telegram rate limits and sends successfully only once", async () => {
    const link = await connection("administrator","administrator",10001);
    const row = await db.telegramDelivery.create({ data: { dedupeKey: "event:retry", connectionId: link.id, chatId: link.chatId, text: "Test notification" } });
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ ok: false, error_code: 429, parameters: { retry_after: 20 } }),{ status: 429 }))
      .mockResolvedValue(new Response(JSON.stringify({ ok: true, result: { message_id: 123 } }),{ status: 200 }));
    vi.stubGlobal("fetch",fetchMock);
    await telegram.drainTelegramQueue();
    const retry = await db.telegramDelivery.findUniqueOrThrow({ where: { id: row.id } });
    expect(retry.status).toBe("pending"); expect(retry.attempts).toBe(1); expect(retry.nextAttemptAt.getTime()).toBeGreaterThan(Date.now()+15000);
    await db.telegramDelivery.update({ where: { id: row.id }, data: { nextAttemptAt: new Date(0) } });
    await telegram.drainTelegramQueue(); await telegram.drainTelegramQueue();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect((await db.telegramDelivery.findUniqueOrThrow({ where: { id: row.id } })).status).toBe("sent");
  });
  it("disables blocked recipients and supports /stop across both roles", async () => {
    const link = await connection("administrator","administrator",10001);
    await db.telegramDelivery.create({ data: { dedupeKey: "event:blocked", connectionId: link.id, chatId: link.chatId, text: "Test" } });
    vi.stubGlobal("fetch",vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: false,error_code: 403 }),{ status: 403 })));
    await telegram.drainTelegramQueue();
    expect((await db.telegramConnection.findUniqueOrThrow({ where: { id: link.id } })).active).toBe(false);
    await db.telegramConnection.update({ where: { id: link.id }, data: { active: true } });
    await connection(`clinic:${clinicId}:${ownerId}`,"clinic",10001,{ clinicId,ownerId });
    const stopped = await app.inject({ method: "POST", url: "/api/telegram/webhook", headers: { "x-telegram-bot-api-secret-token": process.env.TELEGRAM_WEBHOOK_SECRET! }, payload: { update_id: 900, message: { text: "/stop", chat: { id: 10001,type: "private" }, from: { id: 10001,first_name: "Test" } } } });
    expect(stopped.statusCode).toBe(200); expect(await db.telegramConnection.count({ where: { active: true } })).toBe(0);
  });
  it("starts and stops the actual HTTP listener with the Telegram worker enabled", async () => {
    const { buildApp } = await import("./app");
    const listening = await buildApp({ logger: false });
    telegram.startTelegramWorker(listening);
    await listening.listen({ host: "127.0.0.1", port: 0 });
    const address = listening.server.address();
    expect(address && typeof address !== "string").toBe(true);
    const response = await fetch(`http://127.0.0.1:${(address as { port: number }).port}/api/health`);
    expect(response.status).toBe(200);
    expect((await response.json()).ok).toBe(true);
    await listening.close();
  });
});
