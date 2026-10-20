import { createHash, randomBytes } from "node:crypto";
import type { Prisma, TelegramConnection } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { prisma } from "./db";

export type TelegramTarget = {
  subject: string; kind: "administrator" | "staff" | "clinic";
  staffId?: string; ownerId?: string; clinicId?: string;
};
export function telegramConfigured() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_USERNAME);
}
export function hashInvite(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
export async function createTelegramInvite(tx: Prisma.TransactionClient, target: TelegramTarget, issuedBy: string) {
  if (!telegramConfigured()) throw new Error("telegram_not_configured");
  const code = randomBytes(32).toString("base64url");
  const now = new Date();
  await tx.telegramInvite.updateMany({
    where: { subject: target.subject, usedAt: null, revokedAt: null }, data: { revokedAt: now },
  });
  const invite = await tx.telegramInvite.create({ data: {
    ...target, tokenHash: hashInvite(code), issuedBy, expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
  } });
  return { id: invite.id, url: `https://t.me/${process.env.TELEGRAM_BOT_USERNAME}?start=${code}`, expiresAt: invite.expiresAt };
}

export async function revokeTelegramTarget(tx: Prisma.TransactionClient, subject: string) {
  await tx.telegramInvite.updateMany({ where: { subject, revokedAt: null, usedAt: null }, data: { revokedAt: new Date() } });
  const connections = await tx.telegramConnection.findMany({ where: { subject }, select: { id: true } });
  await tx.telegramConnection.updateMany({ where: { subject }, data: { active: false } });
  await tx.telegramDelivery.updateMany({
    where: { connectionId: { in: connections.map(c => c.id) }, status: "pending" },
    data: { status: "cancelled", leaseUntil: null },
  });
}

export async function connectionAllowed(connection: TelegramConnection, db: Prisma.TransactionClient = prisma) {
  if (!connection.active) return false;
  if (connection.kind === "administrator") return connection.subject === "administrator";
  if (connection.kind === "staff" && connection.staffId) {
    return Boolean((await db.staffAccount.findUnique({ where: { id: connection.staffId } }))?.active);
  }
  if (connection.kind === "clinic" && connection.clinicId && connection.ownerId) {
    const clinic = await db.clinic.findUnique({ where: { id: connection.clinicId } });
    return Boolean(clinic && clinic.ownerId === connection.ownerId);
  }
  return false;
}

export async function queueClinicNotification(tx: Prisma.TransactionClient, options: {
  clinic: { id: string; ownerId: string | null; nameRu: string; nameEn: string };
  eventKey: string; title: string; audience: "staff" | "owner" | "both"; leadId?: string;
}) {
  const connections = await tx.telegramConnection.findMany({ where: { active: true, OR: [
    ...(options.audience !== "owner" ? [{ kind: { in: ["administrator", "staff"] } }] : []),
    ...(options.audience !== "staff" && options.clinic.ownerId
      ? [{ kind: "clinic", clinicId: options.clinic.id, ownerId: options.clinic.ownerId }] : []),
  ] } });
  const site = (process.env.SITE_URL || "http://localhost:5173").replace(/\/$/, "");
  const recipients = new Set<string>();
  connections.sort((a, b) => Number(a.kind === "clinic") - Number(b.kind === "clinic"));
  for (const connection of connections) {
    if (!(await connectionAllowed(connection, tx))) continue;
    if (recipients.has(connection.chatId)) continue;
    recipients.add(connection.chatId);
    const staff = connection.kind !== "clinic";
    const route = staff
      ? options.leadId ? `/moderation/leads/${options.leadId}` : `/moderation/${options.clinic.id}`
      : options.leadId ? `/cabinet/clinics/${options.clinic.id}/leads` : `/cabinet/clinics/${options.clinic.id}`;
    const dedupeKey = `event:${options.eventKey}:${connection.chatId}`;
    await tx.telegramDelivery.upsert({ where: { dedupeKey }, update: {}, create: {
      dedupeKey, connectionId: connection.id, chatId: connection.chatId,
      text: `${options.title}\nКлиника: ${(options.clinic.nameRu || options.clinic.nameEn).slice(0, 200)}\nПодробности доступны в кабинете.`,
      url: site + route,
    } });
  }
}

export class TelegramApiError extends Error {
  constructor(public code: number, public retryAfter?: number) { super(`telegram_${code}`); }
}
export async function callTelegram<T = unknown>(method: string, payload: Record<string, unknown>): Promise<T> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new TelegramApiError(503);
  // Do not log the request URL: it contains the bot token.
  let response: Response;
  try {
    response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });
  } catch { throw new TelegramApiError(503); }
  let body: { ok: boolean; result?: T; error_code?: number; parameters?: { retry_after?: number } };
  try { body = await response.json() as typeof body; } catch { throw new TelegramApiError(502); }
  if (!response.ok || !body.ok) throw new TelegramApiError(body.error_code || response.status, body.parameters?.retry_after);
  return body.result as T;
}

let draining = false;
export async function drainTelegramQueue(shouldStop: () => boolean = () => false) {
  if (draining || !telegramConfigured()) return;
  draining = true;
  try {
    const now = new Date();
    const rows = await prisma.telegramDelivery.findMany({ where: {
      status: "pending", nextAttemptAt: { lte: now }, OR: [{ leaseUntil: null }, { leaseUntil: { lt: now } }],
    }, orderBy: { createdAt: "asc" }, take: 10 });
    for (const row of rows) {
      if (shouldStop()) break;
      const claimed = await prisma.telegramDelivery.updateMany({ where: {
        id: row.id, status: "pending", OR: [{ leaseUntil: null }, { leaseUntil: { lt: new Date() } }],
      }, data: { leaseUntil: new Date(Date.now() + 120000), attempts: { increment: 1 } } });
      if (!claimed.count) continue;
      if (row.connectionId) {
        const connection = await prisma.telegramConnection.findUnique({ where: { id: row.connectionId } });
        if (!connection || connection.chatId !== row.chatId || !(await connectionAllowed(connection))) {
          await prisma.telegramDelivery.update({ where: { id: row.id }, data: { status: "cancelled", leaseUntil: null } });
          continue;
        }
      } else if (row.dedupeKey.startsWith("event:")) {
        await prisma.telegramDelivery.update({ where: { id: row.id }, data: { status: "cancelled", leaseUntil: null } });
        continue;
      }
      try {
        const result = await callTelegram<{ message_id: number }>("sendMessage", {
          chat_id: row.chatId, text: row.text, link_preview_options: { is_disabled: true },
          ...(row.url ? { reply_markup: { inline_keyboard: [[{ text: "Открыть в кабинете", url: row.url }]] } } : {}),
        });
        await prisma.telegramDelivery.update({ where: { id: row.id }, data: {
          status: "sent", sentAt: new Date(), leaseUntil: null, lastError: null, telegramMessageId: String(result.message_id),
        } });
      } catch (error) {
        const apiError = error instanceof TelegramApiError ? error : new TelegramApiError(503);
        const permanent = [400, 401, 403, 404].includes(apiError.code) || row.attempts + 1 >= 8;
        const delay = Math.max(apiError.retryAfter || 0, Math.min(3600, 5 * 2 ** Math.min(row.attempts, 9)));
        await prisma.telegramDelivery.update({ where: { id: row.id }, data: {
          status: permanent ? "failed" : "pending", lastError: apiError.message,
          leaseUntil: null, nextAttemptAt: new Date(Date.now() + delay * 1000),
        } });
        if (apiError.code === 403 && row.connectionId) {
          await prisma.telegramConnection.updateMany({ where: { id: row.connectionId, chatId: row.chatId }, data: { active: false } });
        }
      }
      await new Promise(resolve => setTimeout(resolve, 1100));
    }
  } finally { draining = false; }
}

export function startTelegramWorker(app: FastifyInstance) {
  if (!telegramConfigured()) return;
  let stopping = false;
  let interval: ReturnType<typeof setInterval> | undefined;
  let running: Promise<void> | null = null;
  const tick = () => {
    if (stopping || running) return;
    running = drainTelegramQueue(() => stopping)
      .catch(() => { app.log.error("Telegram queue processing failed"); })
      .finally(() => { running = null; });
  };
  app.addHook("onReady", async () => {
    interval = setInterval(tick, 3000);
    interval.unref();
    tick();
  });
  app.addHook("onClose", async () => {
    stopping = true;
    if (interval) clearInterval(interval);
    await running;
  });
}
