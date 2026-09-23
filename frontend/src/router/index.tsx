import { AnimatePresence } from "motion/react";
import { Route, Routes, useLocation } from "react-router";

import type { AuthActions } from "@/features/auth/hooks";
import type { AuthState } from "@/features/auth/machine";
import { Login } from "@/pages/Login/Login";
import { Member } from "@/pages/Member/Member";

export type AppRouterProps = {
  titleId: string;
  state: AuthState;
  actions: AuthActions;
};

export function AppRouter({ titleId, state, actions }: AppRouterProps) {
  const location = useLocation();
  const page = { titleId, state, actions };

  const showLogin = state.phase !== "booting" && state.phase !== "welcome";
  const showMember = state.phase === "welcome";

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={showLogin ? <Login {...page} /> : null} />
        <Route path="/member" element={showMember ? <Member {...page} /> : null} />
        <Route path="*" element={null} />
      </Routes>
    </AnimatePresence>
  );
}
