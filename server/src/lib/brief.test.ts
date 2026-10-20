import { afterEach, describe, expect, it, vi } from "vitest";
import { briefResultSchema, extractBrief, parseBrief } from "./brief";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe("clinic brief", () => {
  it("reads UTF-8 text and rejects unknown formats", async () => {
    expect(await extractBrief(Buffer.from("Клиника: Тест"), "brief.txt")).toBe("Клиника: Тест");
    await expect(extractBrief(Buffer.from("test"), "brief.exe")).rejects.toThrow("unsupported_brief");
  });
  it("discards status, owner and other non-profile fields", () => {
    expect(briefResultSchema.parse({ fields: { nameRu: "Тест", status: "published", ownerId: "other", phone: " " } }).fields).toEqual({ nameRu: "Тест" });
  });
  it("uses Groq server credentials and validates its response", async () => {
    vi.stubEnv("GROQ_API_KEY", "test-key");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify({ fields: { nameRu: "Тест", published: "true" }, notes: [] }) } }] }) });
    vi.stubGlobal("fetch", fetchMock);
    expect((await parseBrief("Клиника Тест")).fields).toEqual({ nameRu: "Тест" });
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer test-key");
  });
  it("rejects malformed provider output", async () => {
    vi.stubEnv("GROQ_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ choices: [{ message: { content: "invalid" } }] }) }));
    await expect(parseBrief("Клиника Тест")).rejects.toThrow();
  });
});
