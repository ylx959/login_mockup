import { PillButton } from "@/components/PillButton/PillButton";
import { errorCopy, signingOutLabel, signOutLabel, welcomeGreeting } from "@/data/copy";
import type { AuthState } from "@/modules/auth/auth-machine";
import type { AuthActions } from "@/modules/auth/use-auth";

import styles from "@/styles/WelcomeCard.module.css";

export type WelcomeCardProps = {
  titleId: string;
  state: AuthState;
  actions: AuthActions;
};

export function WelcomeCard({ titleId, state, actions }: WelcomeCardProps) {
  const busy = state.status === "signingOut";
  const error = state.error ? errorCopy[state.error] : null;

  return (
    <section className={styles.page} aria-labelledby={titleId}>
      <p className={styles.greeting}>{welcomeGreeting}</p>
      {/* 名字一律用文字節點寫入，不會被當成標記 */}
      <h1 className={styles.name} id={titleId}>
        {state.member?.name ?? "Member"}
      </h1>
      <p className={styles.email}>{state.member?.email}</p>

      <p className={styles.status} role="status" aria-live="polite">
        {error}
      </p>

      <div className={styles.actions}>
        <PillButton variant="solid" disabled={busy} aria-busy={busy} onClick={() => void actions.signOut()}>
          {busy ? signingOutLabel : signOutLabel}
        </PillButton>
      </div>
    </section>
  );
}
