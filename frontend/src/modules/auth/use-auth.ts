/**
 * 元件唯一需要認識的認證介面。
 *
 * 它把狀態機、HTTP adapter、請求排序與遲到回應的防護全部收在後面，
 * 對外只露出 state 加三個動作。client 從外面注入，所以測試不需要網路。
 */

import { useCallback, useEffect, useReducer, useRef } from "react";

import type { AuthClient } from "./auth-client";
import {
  initialAuthState,
  reduceAuth,
  type AuthMode,
  type AuthState,
} from "./auth-machine";
import type { Registration } from "./types";

export type AuthActions = {
  /** 把收合的膠囊展開成表單。 */
  open(): void;
  /** 把表單收回成膠囊。 */
  close(): void;
  setMode(mode: AuthMode): void;
  /** 三個欄位都收下；登入模式會自己忽略 name。 */
  submit(values: Registration): Promise<void>;
  signOut(): Promise<void>;
};

export function useAuth(client: AuthClient): { state: AuthState; actions: AuthActions } {
  const [state, dispatch] = useReducer(reduceAuth, initialAuthState);

  // 動作是非同步的，讀 state 要走 ref 才不會抓到舊的閉包
  const latest = useRef(state);
  latest.current = state;

  const nextRequestId = useRef(0);

  useEffect(() => {
    let alive = true;
    void client.checkSession().then((outcome) => {
      if (!alive) return;
      // 開場連不上就當作未登入，使用者仍然可以嘗試登入
      dispatch({ type: "SESSION_RESOLVED", member: outcome.ok ? outcome.member : null });
    });
    return () => {
      alive = false;
    };
  }, [client]);

  const open = useCallback(() => dispatch({ type: "OPEN" }), []);

  const close = useCallback(() => dispatch({ type: "CLOSE" }), []);

  const setMode = useCallback((mode: AuthMode) => dispatch({ type: "SET_MODE", mode }), []);

  const submit = useCallback(
    async (values: Registration) => {
      const { phase, status, mode } = latest.current;
      if (phase !== "form" || status !== "idle") return;

      const requestId = ++nextRequestId.current;
      dispatch({ type: "SUBMIT_STARTED", requestId });

      const outcome =
        mode === "signUp"
          ? await client.signUp(values)
          : await client.signIn({ email: values.email, password: values.password });

      dispatch(
        outcome.ok
          ? { type: "SUBMIT_SUCCEEDED", requestId, member: outcome.member }
          : { type: "SUBMIT_FAILED", requestId, code: outcome.code },
      );
    },
    [client],
  );

  const signOut = useCallback(async () => {
    const { phase, status } = latest.current;
    if (phase !== "welcome" || status !== "idle") return;

    const requestId = ++nextRequestId.current;
    dispatch({ type: "SIGN_OUT_STARTED", requestId });

    const outcome = await client.signOut();

    dispatch(
      outcome.ok
        ? { type: "SIGN_OUT_SUCCEEDED", requestId }
        : { type: "SIGN_OUT_FAILED", requestId, code: "network" },
    );
  }, [client]);

  const actions = useRef<AuthActions>({ open, close, setMode, submit, signOut });
  actions.current = { open, close, setMode, submit, signOut };

  return { state, actions: actions.current };
}
