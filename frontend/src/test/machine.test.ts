import { describe, expect, it } from "vitest";

import { initialAuthState, isBusy, reduceAuth, type AuthState } from "@/features/auth/machine";

const MEMBER = { name: "Annie Lin", email: "annie@example.com" };
const form = (over: Partial<AuthState> = {}): AuthState => ({
  ...initialAuthState,
  phase: "form",
  ...over,
});
const welcome = (): AuthState => ({ ...initialAuthState, phase: "welcome", member: MEMBER });

describe("reduceAuth", () => {
  it("starts booting with nobody signed in", () => {
    expect(initialAuthState).toMatchObject({ phase: "booting", member: null, status: "idle" });
  });

  it("restores an active session straight to welcome", () => {
    const next = reduceAuth(initialAuthState, { type: "SESSION_RESOLVED", member: MEMBER });

    expect(next).toMatchObject({ phase: "welcome", member: MEMBER });
  });

  it("collapses to the pill when nobody is signed in", () => {
    const next = reduceAuth(initialAuthState, { type: "SESSION_RESOLVED", member: null });

    expect(next).toMatchObject({ phase: "collapsed", member: null });
  });

  it("opens the form from the collapsed pill", () => {
    const collapsed = reduceAuth(initialAuthState, { type: "SESSION_RESOLVED", member: null });

    expect(reduceAuth(collapsed, { type: "OPEN" })).toMatchObject({ phase: "form" });
  });

  it("ignores OPEN when the form is already showing", () => {
    const open = form();

    expect(reduceAuth(open, { type: "OPEN" })).toBe(open);
  });

  it("collapses the form back to the pill", () => {
    const next = reduceAuth(form({ error: "invalid_credentials" }), { type: "CLOSE" });

    expect(next).toMatchObject({ phase: "collapsed", error: null });
  });

  it("refuses to collapse mid-request", () => {
    const pending = form({ status: "submitting", pendingId: 1 });

    expect(reduceAuth(pending, { type: "CLOSE" })).toBe(pending);
  });

  it("switches mode and clears the previous error", () => {
    const next = reduceAuth(form({ error: "invalid_credentials" }), {
      type: "SET_MODE",
      mode: "signUp",
    });

    expect(next).toMatchObject({ mode: "signUp", error: null });
  });

  it("ignores a mode switch that changes nothing", () => {
    const state = form();

    expect(reduceAuth(state, { type: "SET_MODE", mode: "signIn" })).toBe(state);
  });

  it("refuses to switch mode mid-request", () => {
    const pending = form({ status: "submitting", pendingId: 1 });

    expect(reduceAuth(pending, { type: "SET_MODE", mode: "signUp" })).toBe(pending);
  });

  it("marks the form as submitting", () => {
    const next = reduceAuth(form(), { type: "SUBMIT_STARTED", requestId: 1 });

    expect(next).toMatchObject({ status: "submitting", pendingId: 1, error: null });
    expect(isBusy(next)).toBe(true);
  });

  it("refuses a second submit while one is in flight", () => {
    const pending = reduceAuth(form(), { type: "SUBMIT_STARTED", requestId: 1 });

    expect(reduceAuth(pending, { type: "SUBMIT_STARTED", requestId: 2 })).toBe(pending);
  });

  it("moves to welcome when the active request succeeds", () => {
    const pending = reduceAuth(form(), { type: "SUBMIT_STARTED", requestId: 1 });

    const next = reduceAuth(pending, { type: "SUBMIT_SUCCEEDED", requestId: 1, member: MEMBER });

    expect(next).toMatchObject({ phase: "welcome", member: MEMBER, status: "idle" });
  });

  it("ignores a stale success", () => {
    const pending = reduceAuth(form(), { type: "SUBMIT_STARTED", requestId: 8 });

    const stale = reduceAuth(pending, {
      type: "SUBMIT_SUCCEEDED",
      requestId: 7,
      member: { name: "Wrong", email: "wrong@example.com" },
    });

    expect(stale).toBe(pending);
  });

  it("ignores a stale failure", () => {
    const pending = reduceAuth(form(), { type: "SUBMIT_STARTED", requestId: 8 });

    expect(reduceAuth(pending, { type: "SUBMIT_FAILED", requestId: 7, code: "server" })).toBe(pending);
  });

  it("returns to the form with a recoverable error", () => {
    const pending = reduceAuth(form({ mode: "signUp" }), { type: "SUBMIT_STARTED", requestId: 2 });

    const next = reduceAuth(pending, { type: "SUBMIT_FAILED", requestId: 2, code: "email_taken" });

    expect(next).toMatchObject({
      phase: "form",
      mode: "signUp",
      status: "idle",
      error: "email_taken",
      pendingId: null,
    });
  });

  it("marks signing out as pending without leaving welcome", () => {
    const next = reduceAuth(welcome(), { type: "SIGN_OUT_STARTED", requestId: 4 });

    expect(next).toMatchObject({ phase: "welcome", status: "signingOut", pendingId: 4 });
  });

  it("returns to the collapsed pill after signing out", () => {
    const pending = reduceAuth(welcome(), { type: "SIGN_OUT_STARTED", requestId: 4 });

    const next = reduceAuth(pending, { type: "SIGN_OUT_SUCCEEDED", requestId: 4 });

    expect(next).toMatchObject({ phase: "collapsed", member: null, status: "idle" });
  });

  it("stays on welcome when signing out fails", () => {
    const pending = reduceAuth(welcome(), { type: "SIGN_OUT_STARTED", requestId: 4 });

    const next = reduceAuth(pending, { type: "SIGN_OUT_FAILED", requestId: 4, code: "network" });

    expect(next).toMatchObject({ phase: "welcome", member: MEMBER, status: "idle", error: "network" });
  });

  it("ignores events that do not belong to the current phase", () => {
    expect(reduceAuth(initialAuthState, { type: "SIGN_OUT_STARTED", requestId: 1 })).toBe(
      initialAuthState,
    );
    expect(reduceAuth(initialAuthState, { type: "SET_MODE", mode: "signUp" })).toBe(initialAuthState);
  });
});
