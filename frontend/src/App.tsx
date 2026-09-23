import { useMemo } from "react";

import { AuthCard } from "~/components/AuthCard/AuthCard";
import { Backdrop } from "~/components/Backdrop/Backdrop";
import { WelcomeCard } from "~/components/WelcomeCard/WelcomeCard";
import { createAuthClient, type AuthClient } from "~/modules/auth/auth-client";
import { useAuth } from "~/modules/auth/use-auth";

import styles from "./App.module.css";

export type AppProps = {
  /** 測試可以換掉 adapter，正式執行時走預設的 HTTP client。 */
  client?: AuthClient;
};

export function App({ client }: AppProps = {}) {
  const resolved = useMemo(() => client ?? createAuthClient(), [client]);
  const { state, actions } = useAuth(resolved);

  return (
    <>
      <Backdrop />
      <main className={styles.stage}>
        {state.phase === "booting" ? null : state.phase === "welcome" ? (
          <WelcomeCard state={state} actions={actions} />
        ) : (
          <AuthCard state={state} actions={actions} />
        )}
      </main>
    </>
  );
}
