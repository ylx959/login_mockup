import { describe, expect, it, vi } from "vitest";

import { requestJson, type FetchLike } from "@/services/http";

const respond = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("requestJson", () => {
  it("sends cookies and JSON headers", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(respond({ ok: true }));

    await requestJson("/api/thing", { method: "PUT", body: { a: 1 } }, { fetchImpl: fetchImpl as unknown as FetchLike });

    expect(fetchImpl).toHaveBeenCalledWith(
      "/api/thing",
      expect.objectContaining({
        method: "PUT",
        credentials: "same-origin",
        body: JSON.stringify({ a: 1 }),
      }),
    );
  });

  it("omits the body when there is nothing to send", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(respond({ ok: true }));

    await requestJson("/api/thing", {}, { fetchImpl: fetchImpl as unknown as FetchLike });

    expect(fetchImpl.mock.calls[0]?.[1]).not.toHaveProperty("body");
  });

  it("reports success with the parsed body", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(respond({ name: "Annie" }, 201));

    const result = await requestJson<{ name: string }>("/api/thing", {}, { fetchImpl: fetchImpl as unknown as FetchLike });

    expect(result).toEqual({ kind: "ok", status: 201, data: { name: "Annie" } });
  });

  it("keeps the status when the server rejects the request", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(respond({ error: "nope" }, 409));

    const result = await requestJson("/api/thing", {}, { fetchImpl: fetchImpl as unknown as FetchLike });

    expect(result).toEqual({ kind: "error", status: 409, data: { error: "nope" } });
  });

  it("survives a non-JSON error page without losing the status", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(new Response("<html>502</html>", { status: 502 }));

    const result = await requestJson("/api/thing", {}, { fetchImpl: fetchImpl as unknown as FetchLike });

    expect(result).toEqual({ kind: "error", status: 502, data: null });
  });

  it("reports an unreachable server instead of throwing", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(requestJson("/api/thing", {}, { fetchImpl: fetchImpl as unknown as FetchLike })).resolves.toEqual({ kind: "offline" });
  });
});
