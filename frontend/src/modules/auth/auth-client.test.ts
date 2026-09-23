import { describe, expect, it, vi } from "vitest";

import type { FetchLike } from "~/lib/http";

import { createAuthClient } from "./auth-client";

const MEMBER = { name: "Annie Lin", email: "annie@example.com" };
const respond = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const clientWith = (fetchImpl: ReturnType<typeof vi.fn>) =>
  createAuthClient({ fetchImpl: fetchImpl as unknown as FetchLike });

describe("auth client", () => {
  it("signs in with only email and password", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(respond({ ok: true, member: MEMBER }));

    const result = await clientWith(fetchImpl).signIn({
      email: "annie@example.com",
      password: "correct-horse",
    });

    expect(result).toEqual({ ok: true, member: MEMBER });
    expect(fetchImpl).toHaveBeenCalledWith(
      "/api/member/auth",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ email: "annie@example.com", password: "correct-horse" }),
      }),
    );
  });

  it("signs up with name, email and password", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(respond({ ok: true, member: MEMBER }, 201));

    await clientWith(fetchImpl).signUp({
      name: "Annie Lin",
      email: "annie@example.com",
      password: "correct-horse",
    });

    expect(fetchImpl).toHaveBeenCalledWith("/api/member", expect.objectContaining({ method: "POST" }));
  });

  it("maps invalid credentials", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(respond({ error: "invalid_credentials" }, 401));

    await expect(clientWith(fetchImpl).signIn({ email: "a@b.co", password: "nope" })).resolves.toEqual({
      ok: false,
      code: "invalid_credentials",
    });
  });

  it("maps a duplicate email", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(respond({ error: "email_taken" }, 409));

    await expect(
      clientWith(fetchImpl).signUp({ name: "A", email: "a@b.co", password: "12345678" }),
    ).resolves.toEqual({ ok: false, code: "email_taken" });
  });

  it("maps a validation rejection that carries no error field", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(respond({ detail: [{ msg: "too short" }] }, 422));

    await expect(
      clientWith(fetchImpl).signUp({ name: "A", email: "a@b.co", password: "short" }),
    ).resolves.toEqual({ ok: false, code: "invalid_input" });
  });

  it("maps an unreachable server", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(clientWith(fetchImpl).checkSession()).resolves.toEqual({
      ok: false,
      code: "network",
    });
  });

  it("treats a 2xx without a member as a broken contract", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(respond({ ok: true }));

    await expect(clientWith(fetchImpl).signIn({ email: "a@b.co", password: "x" })).resolves.toEqual({
      ok: false,
      code: "server",
    });
  });

  it("reads an anonymous session as a normal answer", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(respond({ ok: false, member: null }));

    await expect(clientWith(fetchImpl).checkSession()).resolves.toEqual({ ok: true, member: null });
  });

  it("reads an active session", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(respond({ ok: true, member: MEMBER }));

    await expect(clientWith(fetchImpl).checkSession()).resolves.toEqual({ ok: true, member: MEMBER });
  });

  it("signs out with DELETE", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(respond({ ok: true }));

    await expect(clientWith(fetchImpl).signOut()).resolves.toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledWith(
      "/api/member/auth",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("reports a failed sign out", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError("offline"));

    await expect(clientWith(fetchImpl).signOut()).resolves.toEqual({ ok: false });
  });

  it("never puts the password in the URL", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(respond({ ok: true, member: MEMBER }));

    await clientWith(fetchImpl).signIn({ email: "annie@example.com", password: "correct-horse" });

    expect(fetchImpl.mock.calls[0]?.[0]).toBe("/api/member/auth");
  });
});
