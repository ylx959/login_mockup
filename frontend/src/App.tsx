import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useId, useLayoutEffect, useMemo } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router";

import { AuthCard } from "@/components/AuthCard/AuthCard";
import { Backdrop } from "@/components/Backdrop/Backdrop";
import { GlassPanel } from "@/components/GlassPanel/GlassPanel";
import { TouchPill } from "@/components/TouchPill/TouchPill";
import { WelcomeCard } from "@/components/WelcomeCard/WelcomeCard";
import { instantScreenVariants, screenVariants } from "@/lib/motion";
import { createAuthClient, type AuthClient } from "@/modules/auth/auth-client";
import { useAuth } from "@/modules/auth/use-auth";

import styles from "@/App.module.css";

export type AppProps = {
  /** 測試可以換掉 adapter，正式執行時走預設的 HTTP client。 */
  client?: AuthClient;
};

export function App({ client }: AppProps = {}) {
  const resolved = useMemo(() => client ?? createAuthClient(), [client]);
  const { state, actions } = useAuth(resolved);
  const titleId = useId();
  const reduced = useReducedMotion();
  const location = useLocation();
  const navigate = useNavigate();

  const activeScreenVariants = reduced ? instantScreenVariants : screenVariants;

  useLayoutEffect(() => {
    if (state.phase === "booting") return;

    const target = state.phase === "welcome" ? "/member" : "/";
    if (location.pathname !== target) navigate(target, { replace: true });
  }, [location.pathname, navigate, state.phase]);

  const authScreen =
    state.phase === "booting" || state.phase === "welcome" ? null : (
      <motion.div
        className={styles.screen}
        variants={activeScreenVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {/* 只有登入區的膠囊與卡片共用 layoutId。Member 是另一個 page。 */}
        <AnimatePresence initial={false}>
          {state.phase === "collapsed" ? (
            <TouchPill key="pill" onOpen={actions.open} />
          ) : (
            <GlassPanel key="panel" labelledBy={titleId} onDismiss={actions.close}>
              <AuthCard titleId={titleId} state={state} actions={actions} />
            </GlassPanel>
          )}
        </AnimatePresence>
      </motion.div>
    );

  const memberScreen =
    state.phase === "welcome" ? (
      <motion.div
        className={styles.screen}
        variants={activeScreenVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <WelcomeCard titleId={titleId} state={state} actions={actions} />
      </motion.div>
    ) : null;

  return (
    <>
      <Backdrop />
      <main className={styles.stage}>
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={authScreen} />
            <Route path="/member" element={memberScreen} />
            <Route path="*" element={null} />
          </Routes>
        </AnimatePresence>
      </main>
    </>
  );
}
