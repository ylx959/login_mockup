import { useId, useLayoutEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router";

import { Backdrop } from "@/components/layout/Backdrop";
import { createAuthClient, type AuthClient } from "@/features/auth/api";
import { useAuth } from "@/features/auth/hooks";
import { AppRouter } from "@/router";

import styles from "@/styles/App.module.css";

export type AppProps = {
  /** 測試可以換掉 adapter，正式執行時走預設的 HTTP client。 */
  client?: AuthClient;
};

export function App({ client }: AppProps = {}) {
  const resolved = useMemo(() => client ?? createAuthClient(), [client]);
  const { state, actions } = useAuth(resolved);
  const titleId = useId();
  const location = useLocation();
  const navigate = useNavigate();

  useLayoutEffect(() => {
    if (state.phase === "booting") return;

    const target = state.phase === "welcome" ? "/member" : "/";
    if (location.pathname !== target) navigate(target, { replace: true });
  }, [location.pathname, navigate, state.phase]);

  return (
    <>
      <Backdrop />
      <main className={styles.stage}>
        <AppRouter titleId={titleId} state={state} actions={actions} />
      </main>
    </>
  );
}
