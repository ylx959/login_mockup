/**
 * 合法的狀態轉移都在這裡，回傳新狀態，不碰 DOM、不發請求。
 *
 *   booting → collapsed ⇄ form(signIn ↔ signUp) → submitting → welcome
 *                 ↑      (點外面收回)  ↖ error ↗                     │
 *                 └──────────────── signOut ────────────────────-┘
 *
 * pendingId 用來擋遲到的回應：使用者送出後又改按別的，
 * 先前那個請求回來時不該把畫面拉回去。
 */

import type { AuthErrorCode, Member } from "./types";

export type AuthMode = "signIn" | "signUp";
export type AuthPhase = "booting" | "collapsed" | "form" | "welcome";
export type AuthStatus = "idle" | "submitting" | "signingOut";

export type AuthState = {
  phase: AuthPhase;
  mode: AuthMode;
  status: AuthStatus;
  member: Member | null;
  error: AuthErrorCode | null;
  pendingId: number | null;
};

export type AuthEvent =
  | { type: "SESSION_RESOLVED"; member: Member | null }
  | { type: "OPEN" }
  | { type: "CLOSE" }
  | { type: "SET_MODE"; mode: AuthMode }
  | { type: "SUBMIT_STARTED"; requestId: number }
  | { type: "SUBMIT_SUCCEEDED"; requestId: number; member: Member }
  | { type: "SUBMIT_FAILED"; requestId: number; code: AuthErrorCode }
  | { type: "SIGN_OUT_STARTED"; requestId: number }
  | { type: "SIGN_OUT_SUCCEEDED"; requestId: number }
  | { type: "SIGN_OUT_FAILED"; requestId: number; code: AuthErrorCode };

export const initialAuthState: AuthState = Object.freeze({
  phase: "booting",
  mode: "signIn",
  status: "idle",
  member: null,
  error: null,
  pendingId: null,
});

/** 未登入時的起點：收合成一顆膠囊，點了才展開表單。 */
const anonymous: AuthState = { ...initialAuthState, phase: "collapsed" };

export function reduceAuth(state: AuthState, event: AuthEvent): AuthState {
  switch (event.type) {
    case "SESSION_RESOLVED":
      return event.member
        ? { ...initialAuthState, phase: "welcome", member: event.member }
        : anonymous;

    case "OPEN":
      return state.phase === "collapsed" ? { ...state, phase: "form", error: null } : state;

    case "CLOSE":
      // 請求進行中不收合，否則回應回來時畫面已經不在表單上
      return state.phase === "form" && state.status === "idle"
        ? { ...state, phase: "collapsed", error: null }
        : state;

    case "SET_MODE":
      return state.phase === "form" && state.status === "idle" && state.mode !== event.mode
        ? { ...state, mode: event.mode, error: null }
        : state;

    case "SUBMIT_STARTED":
      return state.phase === "form" && state.status === "idle"
        ? { ...state, status: "submitting", error: null, pendingId: event.requestId }
        : state;

    case "SUBMIT_SUCCEEDED":
      return state.pendingId === event.requestId
        ? { ...initialAuthState, phase: "welcome", member: event.member }
        : state;

    case "SUBMIT_FAILED":
      return state.pendingId === event.requestId
        ? { ...state, status: "idle", error: event.code, pendingId: null }
        : state;

    case "SIGN_OUT_STARTED":
      return state.phase === "welcome" && state.status === "idle"
        ? { ...state, status: "signingOut", error: null, pendingId: event.requestId }
        : state;

    case "SIGN_OUT_SUCCEEDED":
      return state.pendingId === event.requestId ? anonymous : state;

    case "SIGN_OUT_FAILED":
      // 登出失敗要留在 welcome，使用者其實還是登入狀態
      return state.pendingId === event.requestId
        ? { ...state, status: "idle", error: event.code, pendingId: null }
        : state;

    default:
      return state;
  }
}

export const isBusy = (state: AuthState): boolean => state.status !== "idle";
