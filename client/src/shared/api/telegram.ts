import { api } from "./client";
export type StaffPrincipal = { id: string; name: string; role: "administrator" | "moderator" };
export type Invite = { url: string; expiresAt: string };
export type ConnectionStatus = {
  configured: boolean; botUsername: string | null;
  connection: { id: string; active: boolean; displayName: string; username: string | null } | null;
};
export type Staff = {
  id: string; email: string; name: string; role: string; active: boolean;
  connections: { active: boolean; displayName: string; username: string | null }[];
};
export async function adminProfile() {
  return (await api.get<{ principal: StaffPrincipal }>("/api/admin/me")).data.principal;
}
export async function telegramStatus(base: string) { return (await api.get<ConnectionStatus>(base)).data; }
export async function telegramInvite(base: string) { return (await api.post<Invite>(base + "/invite")).data; }
export async function telegramDisconnect(base: string) { await api.delete(base); }
export async function listStaff() { return (await api.get<{ items: Staff[] }>("/api/admin/staff")).data.items; }
export async function createStaff(name: string, email: string) {
  return (await api.post<{ email: string; password: string; invite: Invite | null }>("/api/admin/staff", { name, email })).data;
}
export async function toggleStaff(id: string, active: boolean) { await api.patch(`/api/admin/staff/${id}`, { active }); }
export async function resetStaffPassword(id: string) { return (await api.post<{ password: string }>(`/api/admin/staff/${id}/reset-password`)).data.password; }
export async function inviteStaff(id: string) { return (await api.post<Invite>(`/api/admin/staff/${id}/telegram/invite`)).data; }
export type Delivery = { id: string; status: string; attempts: number; lastError: string | null; createdAt: string };
export async function deliveryStatus() { return (await api.get<{ counts: Record<string, number>; items: Delivery[] }>("/api/admin/telegram/deliveries")).data; }
export async function retryDelivery(id: string) { await api.post(`/api/admin/telegram/deliveries/${id}/retry`); }
export async function ownerTelegramStatus() {
  return (await api.get<{ items: { clinicId: string; name: string; connection: { displayName: string; username: string | null } | null }[] }>("/api/cabinet/telegram")).data.items;
}
