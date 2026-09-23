import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useId, useMemo } from "react";

import { AuthCard } from "~/components/AuthCard/AuthCard";
import { Backdrop } from "~/components/Backdrop/Backdrop";
import { GlassPanel } from "~/components/GlassPanel/GlassPanel";
import { TouchPill } from "~/components/TouchPill/TouchPill";
import { WelcomeCard } from "~/components/WelcomeCard/WelcomeCard";
import { instantScreenVariants, screenVariants } from "~/lib/motion";
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
  const titleId = useId();
  const reduced = useReducedMotion();

  const activeScreenVariants = reduced ? instantScreenVariants : screenVariants;

  return (
    <>
      <Backdrop />
      <main className={styles.stage}>
        {/* 膠囊與卡片共用一個 layoutId，所以是同一塊材質原地長大。
            這裡不能用 popLayout：它會把離場的膠囊抽成絕對定位，
            跟 layoutId 的共享變形打架，看起來就會先跳位再展開。 */}
        <AnimatePresence initial={false}>
          {state.phase === "booting" ? null : state.phase === "collapsed" ? (
            <TouchPill key="pill" onOpen={actions.open} />
          ) : (
            <GlassPanel key="panel" labelledBy={titleId}>
              <AnimatePresence mode="wait" initial={false}>
                {state.phase === "welcome" ? (
                  <motion.div
                    key="welcome"
                    variants={activeScreenVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    <WelcomeCard titleId={titleId} state={state} actions={actions} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    variants={activeScreenVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    <AuthCard titleId={titleId} state={state} actions={actions} />
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassPanel>
          )}
        </AnimatePresence>
      </main>
    </>
  );
}
