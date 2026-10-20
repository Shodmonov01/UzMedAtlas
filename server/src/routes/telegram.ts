import type { FastifyInstance, FastifyRequest } from "fastify";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/db";
import { getAdminPrincipal, getClinicOwnerId, hashPassword } from "../lib/auth";
import { checkRateLimit } from "../lib/rate-limit";
import {
  connectionAllowed, createTelegramInvite, hashInvite, revokeTelegramTarget, telegramConfigured,
  type TelegramTarget,
} from "../lib/telegram";

const updateSchema = z.object({
  update_id: z.number().int().nonnegative().safe(),
  message: z.object({
    text: z.string().max(4096).optional(),
    chat: z.object({ id: z.number().int().safe(), type: z.string() }),
    from: z.object({
      id: z.number().int().safe(), is_bot: z.boolean().optional(), first_name: z.string().max(256),
      last_name: z.string().max(256).optional(), username: z.string().max(64).optional(),
    }).optional(),
  }).optional(),
});

export async function processTelegramUpdate(raw: unknown) {
  const update = updateSchema.parse(raw);
  if (await prisma.telegramUpdate.findUnique({ where: { id: String(update.update_id) } })) return;
  try {
    await prisma.$transaction(async tx => {
      await tx.telegramUpdate.create({ data: { id: String(update.update_id) } });
      const message = update.message;
      if (!message?.text || !message.from || message.from.is_bot || message.chat.type !== "private" || message.chat.id !== message.from.id) return;
      const chatId = String(message.chat.id);
      const userId = String(message.from.id);
      const command = /^\/(start|help|status|stop)(?:@[A-Za-z0-9_]+)?(?:\s+(\S+))?\s*$/.exec(message.text);
      if (!command) return;
      if (!checkRateLimit(`telegram:${userId}`, 20, 60000).ok) return;
      let text = "AMO — уведомления UzMedAtlas. Для подключения откройте персональное приглашение от администратора или модератора.\n/status — мои подключения\n/stop — отключить все уведомления";
      if (command[1] === "stop") {
        const connections = await tx.telegramConnection.findMany({ where: { userId, active: true } });
        for (const connection of connections) await revokeTelegramTarget(tx, connection.subject);
        text = "Уведомления отключены. Для повторного подключения получите новое приглашение.";
      } else if (command[1] === "status") {
        const connections = await tx.telegramConnection.findMany({ where: { userId, active: true }, include: { clinic: true, staff: true } });
        const labels: string[] = [];
        for (const connection of connections) {
          if (await connectionAllowed(connection, tx)) labels.push(connection.kind === "clinic"
            ? `Клиника: ${connection.clinic?.nameRu || connection.clinic?.nameEn}`
            : connection.kind === "administrator" || connection.staff?.role === "administrator" ? "Администратор" : "Модератор");
        }
        text = labels.length ? `Ваши подключения:\n${labels.join("\n")}\n/stop — отключить уведомления` : "Активных подключений нет. Получите персональное приглашение.";
      } else if (command[1] === "start" && command[2]) {
        const code = command[2];
        const invite = /^[A-Za-z0-9_-]{43}$/.test(code)
          ? await tx.telegramInvite.findUnique({ where: { tokenHash: hashInvite(code) }, include: { staff: true, clinic: true } }) : null;
        const valid = invite && !invite.usedAt && !invite.revokedAt && invite.expiresAt > new Date()
          && (invite.kind === "administrator" && invite.subject === "administrator"
            || invite.kind === "staff" && invite.staff?.active
            || invite.kind === "clinic" && invite.ownerId && invite.clinic?.ownerId === invite.ownerId);
        if (!valid || !invite) {
          text = "Приглашение недействительно, уже использовано или истекло. Получите новую ссылку у администратора или модератора.";
        } else {
          const claimed = await tx.telegramInvite.updateMany({
            where: { id: invite.id, usedAt: null, revokedAt: null, expiresAt: { gt: new Date() } }, data: { usedAt: new Date() },
          });
          if (!claimed.count) throw new Error("invite_claim_conflict");
          const old = await tx.telegramConnection.findUnique({ where: { subject: invite.subject } });
          if (old) await tx.telegramDelivery.updateMany({ where: { connectionId: old.id, status: "pending" }, data: { status: "cancelled", leaseUntil: null } });
          const data = {
            kind: invite.kind, staffId: invite.staffId, ownerId: invite.ownerId, clinicId: invite.clinicId,
            userId, chatId, displayName: [message.from.first_name, message.from.last_name].filter(Boolean).join(" ").slice(0, 256),
            username: message.from.username || null, active: true, connectedAt: new Date(),
          };
          await tx.telegramConnection.upsert({ where: { subject: invite.subject }, update: data, create: { subject: invite.subject, ...data } });
          text = invite.kind === "clinic"
            ? `Подключена клиника «${invite.clinic?.nameRu || invite.clinic?.nameEn}». Вы будете получать уведомления о её заявках и модерации.`
            : "Подключены уведомления для команды UzMedAtlas: новые заявки и клиники на модерации.";
          text += "\n/status — мои подключения\n/stop — отключить уведомления";
        }
      }
      await tx.telegramDelivery.create({ data: { dedupeKey: `reply:${update.update_id}`, chatId, text } });
    }, { maxWait: 10000, timeout: 10000 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return;
    throw error;
  }
}

function validWebhookSecret(request: FastifyRequest) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  const supplied = request.headers["x-telegram-bot-api-secret-token"];
  if (!expected || typeof supplied !== "string") return false;
  const a = Buffer.from(expected), b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function telegramRoutes(app: FastifyInstance) {
  app.post("/api/telegram/webhook", { bodyLimit: 65536 }, async (request, reply) => {
    if (!validWebhookSecret(request)) return reply.code(401).send({ error: "unauthorized" });
    const parsed = updateSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_update" });
    await processTelegramUpdate(parsed.data);
    return { ok: true };
  });

  async function staffTarget(request: FastifyRequest): Promise<{ target: TelegramTarget; issuer: string } | null> {
    const staff = await getAdminPrincipal(request);
    if (!staff) return null;
    return { target: staff.id === "administrator"
      ? { subject: "administrator", kind: "administrator" }
      : { subject: `staff:${staff.id}`, kind: "staff", staffId: staff.id }, issuer: staff.id };
  }
  async function targetStatus(subject: string) {
    const connection = await prisma.telegramConnection.findUnique({ where: { subject } });
    const active = connection ? await connectionAllowed(connection) : false;
    return { configured: telegramConfigured(), botUsername: process.env.TELEGRAM_BOT_USERNAME || null,
      connection: connection ? { id: connection.id, active, displayName: connection.displayName, username: connection.username, connectedAt: connection.connectedAt } : null };
  }
  app.get("/api/admin/telegram", async (request, reply) => {
    const scope = await staffTarget(request);
    if (!scope) return reply.code(401).send({ error: "unauthorized" });
    return targetStatus(scope.target.subject);
  });
  app.post("/api/admin/telegram/invite", async (request, reply) => {
    const scope = await staffTarget(request);
    if (!scope) return reply.code(401).send({ error: "unauthorized" });
    if (!telegramConfigured()) return reply.code(503).send({ error: "telegram_not_configured" });
    return prisma.$transaction(tx => createTelegramInvite(tx, scope.target, scope.issuer));
  });
  app.delete("/api/admin/telegram", async (request, reply) => {
    const scope = await staffTarget(request);
    if (!scope) return reply.code(401).send({ error: "unauthorized" });
    await prisma.$transaction(tx => revokeTelegramTarget(tx, scope.target.subject));
    return { ok: true };
  });

  async function clinicTarget(request: FastifyRequest) {
    const staff = await getAdminPrincipal(request);
    if (!staff) return { error: "unauthorized", code: 401 } as const;
    const { id } = request.params as { id: string };
    const clinic = await prisma.clinic.findUnique({ where: { id }, select: { id: true, ownerId: true } });
    if (!clinic) return { error: "not_found", code: 404 } as const;
    if (!clinic.ownerId) return { error: "clinic_has_no_owner", code: 409 } as const;
    return { issuer: staff.id, target: { subject: `clinic:${clinic.id}:${clinic.ownerId}`, kind: "clinic" as const, clinicId: clinic.id, ownerId: clinic.ownerId } };
  }
  app.get("/api/admin/clinics/:id/telegram", async (request, reply) => {
    const scope = await clinicTarget(request);
    if ("error" in scope) return reply.code(scope.code || 400).send({ error: scope.error });
    return targetStatus(scope.target.subject);
  });
  app.post("/api/admin/clinics/:id/telegram/invite", async (request, reply) => {
    const scope = await clinicTarget(request);
    if ("error" in scope) return reply.code(scope.code || 400).send({ error: scope.error });
    if (!telegramConfigured()) return reply.code(503).send({ error: "telegram_not_configured" });
    return prisma.$transaction(tx => createTelegramInvite(tx, scope.target, scope.issuer));
  });
  app.delete("/api/admin/clinics/:id/telegram", async (request, reply) => {
    const scope = await clinicTarget(request);
    if ("error" in scope) return reply.code(scope.code || 400).send({ error: scope.error });
    await prisma.$transaction(tx => revokeTelegramTarget(tx, scope.target.subject));
    return { ok: true };
  });

  app.get("/api/cabinet/telegram", async (request, reply) => {
    const ownerId = getClinicOwnerId(request);
    if (!ownerId) return reply.code(401).send({ error: "unauthorized" });
    const clinics = await prisma.clinic.findMany({ where: { ownerId }, include: { telegramConnections: { where: { ownerId } } } });
    return { items: clinics.map(clinic => ({ clinicId: clinic.id, name: clinic.nameRu || clinic.nameEn,
      connection: clinic.telegramConnections.find(c => c.active) ? {
        id: clinic.telegramConnections.find(c => c.active)!.id, displayName: clinic.telegramConnections.find(c => c.active)!.displayName,
        username: clinic.telegramConnections.find(c => c.active)!.username,
      } : null,
    })) };
  });
  app.delete("/api/cabinet/telegram/:id", async (request, reply) => {
    const ownerId = getClinicOwnerId(request);
    if (!ownerId) return reply.code(401).send({ error: "unauthorized" });
    const { id } = request.params as { id: string };
    const clinic = await prisma.clinic.findFirst({ where: { id, ownerId } });
    if (!clinic) return reply.code(404).send({ error: "not_found" });
    await prisma.$transaction(tx => revokeTelegramTarget(tx, `clinic:${id}:${ownerId}`));
    return { ok: true };
  });

  app.get("/api/admin/staff", async (request, reply) => {
    if ((await getAdminPrincipal(request))?.role !== "administrator") return reply.code(403).send({ error: "forbidden" });
    const items = await prisma.staffAccount.findMany({ orderBy: { createdAt: "desc" }, select: {
      id: true, name: true, email: true, role: true, active: true, createdAt: true,
      connections: { select: { active: true, displayName: true, username: true } },
    } });
    return { items };
  });
  app.post("/api/admin/staff", async (request, reply) => {
    const principal = await getAdminPrincipal(request);
    if (principal?.role !== "administrator") return reply.code(403).send({ error: "forbidden" });
    const body = z.object({ name: z.string().trim().min(2).max(100), email: z.string().trim().email().max(120).transform(v => v.toLowerCase()) }).safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: "invalid_payload" });
    const password = randomBytes(18).toString("base64url");
    try {
      const result = await prisma.$transaction(async tx => {
        const staff = await tx.staffAccount.create({ data: { ...body.data, passwordHash: hashPassword(password) } });
        const invite = telegramConfigured() ? await createTelegramInvite(tx, { subject: `staff:${staff.id}`, kind: "staff", staffId: staff.id }, principal.id) : null;
        return { id: staff.id, email: staff.email, name: staff.name, role: staff.role, password, invite };
      });
      return reply.code(201).send(result);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return reply.code(409).send({ error: "email_exists" });
      throw error;
    }
  });
  app.patch("/api/admin/staff/:id", async (request, reply) => {
    const principal = await getAdminPrincipal(request);
    if (principal?.role !== "administrator") return reply.code(403).send({ error: "forbidden" });
    const { id } = request.params as { id: string };
    const body = z.object({ active: z.boolean() }).safeParse(request.body);
    if (!body.success || id === principal.id) return reply.code(400).send({ error: "invalid_payload" });
    if (!(await prisma.staffAccount.findUnique({ where: { id } }))) return reply.code(404).send({ error: "not_found" });
    await prisma.$transaction(async tx => {
      await tx.staffAccount.update({ where: { id }, data: { active: body.data.active, sessionVersion: { increment: 1 } } });
      await revokeTelegramTarget(tx, `staff:${id}`);
    });
    return { ok: true };
  });
  app.post("/api/admin/staff/:id/reset-password", async (request, reply) => {
    if ((await getAdminPrincipal(request))?.role !== "administrator") return reply.code(403).send({ error: "forbidden" });
    const { id } = request.params as { id: string };
    const password = randomBytes(18).toString("base64url");
    const updated = await prisma.staffAccount.updateMany({ where: { id }, data: { passwordHash: hashPassword(password), sessionVersion: { increment: 1 } } });
    if (!updated.count) return reply.code(404).send({ error: "not_found" });
    return { password };
  });
  app.post("/api/admin/staff/:id/telegram/invite", async (request, reply) => {
    const principal = await getAdminPrincipal(request);
    if (principal?.role !== "administrator") return reply.code(403).send({ error: "forbidden" });
    const { id } = request.params as { id: string };
    if (!(await prisma.staffAccount.findUnique({ where: { id } }))?.active) return reply.code(404).send({ error: "not_found" });
    if (!telegramConfigured()) return reply.code(503).send({ error: "telegram_not_configured" });
    return prisma.$transaction(tx => createTelegramInvite(tx, { subject: `staff:${id}`, kind: "staff", staffId: id }, principal.id));
  });
  app.get("/api/admin/telegram/deliveries", async (request, reply) => {
    if ((await getAdminPrincipal(request))?.role !== "administrator") return reply.code(403).send({ error: "forbidden" });
    const counts = await prisma.telegramDelivery.groupBy({ by: ["status"], _count: { _all: true } });
    const items = await prisma.telegramDelivery.findMany({ where: { dedupeKey: { startsWith: "event:" } },
      orderBy: { createdAt: "desc" }, take: 30, select: { id: true, status: true, attempts: true, lastError: true, createdAt: true, sentAt: true } });
    return { counts: Object.fromEntries(counts.map(c => [c.status, c._count._all])), items };
  });
  app.post("/api/admin/telegram/deliveries/:id/retry", async (request, reply) => {
    if ((await getAdminPrincipal(request))?.role !== "administrator") return reply.code(403).send({ error: "forbidden" });
    const { id } = request.params as { id: string };
    const delivery = await prisma.telegramDelivery.findUnique({ where: { id } });
    if (!delivery || delivery.status !== "failed" || !delivery.connectionId) return reply.code(409).send({ error: "not_retryable" });
    const connection = await prisma.telegramConnection.findUnique({ where: { id: delivery.connectionId } });
    if (!connection || connection.chatId !== delivery.chatId || !(await connectionAllowed(connection))) return reply.code(409).send({ error: "connection_inactive" });
    await prisma.telegramDelivery.updateMany({ where: { id, status: "failed" }, data: { status: "pending", attempts: 0, lastError: null, nextAttemptAt: new Date(), leaseUntil: null } });
    return { ok: true };
  });
}
