import { AnimatePresence } from "motion/react";

import { GlassPanel } from "@/components/ui/GlassPanel";
import { Screen } from "@/components/layout/Screen";
import type { AuthState } from "@/features/auth/machine";
import type { AuthActions } from "@/features/auth/hooks";
import { AuthCard } from "@/components/common/AuthCard";
import { TouchPill } from "@/components/common/TouchPill";

export type LoginProps = {
  titleId: string;
  state: AuthState;
  actions: AuthActions;
};

export function Login({ titleId, state, actions }: LoginProps) {
  return (
    <Screen>
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
    </Screen>
  );
}
