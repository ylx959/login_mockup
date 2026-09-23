export type Member = {
  name: string;
  email: string;
};

/** 後端可觀察到的錯誤模式，加上兩種只有前端知道的失敗。 */
export type AuthErrorCode =
  | "invalid_credentials"
  | "email_taken"
  | "invalid_input"
  | "network"
  | "server";

export type Credentials = {
  email: string;
  password: string;
};

export type Registration = Credentials & {
  name: string;
};

export type AuthOutcome =
  | { ok: true; member: Member }
  | { ok: false; code: AuthErrorCode };

/** 讀 session 時「沒有登入」是正常答案，不是錯誤。 */
export type SessionOutcome =
  | { ok: true; member: Member | null }
  | { ok: false; code: AuthErrorCode };
