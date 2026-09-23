import { Icon } from "~/components/Icon/Icon";

import styles from "./SubmitButton.module.css";

export type SubmitButtonProps = {
  label: string;
  busy: boolean;
};

export function SubmitButton({ label, busy }: SubmitButtonProps) {
  return (
    <button type="submit" className={styles.submit} disabled={busy} aria-busy={busy}>
      <span className="srOnly">{label}</span>
      {busy ? <span className={styles.spinner} aria-hidden="true" /> : <Icon name="chevronRight" size={24} />}
    </button>
  );
}
