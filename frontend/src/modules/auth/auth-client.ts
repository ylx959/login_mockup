/**
 * 唯一知道 /api/member 這組端點的模組：網址、HTTP 方法、回應形狀、
 * 以及狀態碼要對應到哪個錯誤碼，全部收在這裡。
 *
 * 介面只有四個動作，而且吃一個 fetch 當依賴，所以測試不需要網路。
 */

import { requestJson, type FetchLike } from "@/lib/http";

import type {
  AuthOutcome,
  Credentials,
  Member,
  Registration,
  SessionOutcome,
  AuthErrorCode,
} from "@/modules/auth/types";

const ENDPOINT = {
  member: "/api/member",
  session: "/api/member/auth",
} as const;

/** 後端統一的回應形狀：{ ok, member, error }。 */
type MemberPayload = {
  ok?: boolean;
  member?: Member | null;
  error?: string | null;
};

export type AuthClient = {
  checkSession(): Promise<SessionOutcome>;
  signIn(credentials: Credentials): Promise<AuthOutcome>;
  signUp(registration: Registration): Promise<AuthOutcome>;
  signOut(): Promise<{ ok: boolean }>;
};

const KNOWN_CODES = new Set<string>(["invalid_credentials", "email_taken", "invalid_input"]);

/** FastAPI 的驗證錯誤是 {detail:[…]}，沒有 error 欄位，只能靠狀態碼補。 */
function toErrorCode(status: number, data: unknown): AuthErrorCode {
  const reported = (data as MemberPayload | null)?.error;
  if (typeof reported === "string" && KNOWN_CODES.has(reported)) {
    return reported as AuthErrorCode;
  }
  if (status === 422) return "invalid_input";
  if (status === 401) return "invalid_credentials";
  if (status === 409) return "email_taken";
  return "server";
}

export function createAuthClient({ fetchImpl }: { fetchImpl?: FetchLike } = {}): AuthClient {
  const options = fetchImpl ? { fetchImpl } : {};

  async function authenticate(
    url: string,
    method: "POST" | "PUT",
    body: Credentials | Registration,
  ): Promise<AuthOutcome> {
    const result = await requestJson<MemberPayload>(url, { method, body }, options);

    if (result.kind === "offline") return { ok: false, code: "network" };
    if (result.kind === "error") return { ok: false, code: toErrorCode(result.status, result.data) };

    const member = result.data?.member;
    // 2xx 但沒帶 member 表示後端契約壞了，當成伺服器錯誤而不是成功
    return member ? { ok: true, member } : { ok: false, code: "server" };
  }

  return {
    async checkSession() {
      const result = await requestJson<MemberPayload>(ENDPOINT.session, {}, options);

      if (result.kind === "offline") return { ok: false, code: "network" };
      if (result.kind === "error") return { ok: false, code: toErrorCode(result.status, result.data) };

      // ok:false 代表未登入，是正常答案
      return { ok: true, member: result.data?.member ?? null };
    },

    signIn: (credentials) => authenticate(ENDPOINT.session, "PUT", credentials),

    signUp: (registration) => authenticate(ENDPOINT.member, "POST", registration),

    async signOut() {
      const result = await requestJson(ENDPOINT.session, { method: "DELETE" }, options);
      return { ok: result.kind === "ok" };
    },
  };
}
