import { Screen } from "@/components/layout/Screen";
import type { AuthState } from "@/features/auth/machine";
import type { AuthActions } from "@/features/auth/hooks";
import { WelcomeCard } from "@/components/common/WelcomeCard";

export type MemberProps = {
  titleId: string;
  state: AuthState;
  actions: AuthActions;
};

export function Member({ titleId, state, actions }: MemberProps) {
  return (
    <Screen>
      <WelcomeCard titleId={titleId} state={state} actions={actions} />
    </Screen>
  );
}
