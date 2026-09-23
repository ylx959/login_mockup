import { Icon } from "~/components/Icon/Icon";

import styles from "./SubmitButton.module.css";

export type SubmitButtonProps = {
  label: string;
  busy: boolean;
};

export function SubmitButton({ label, busy }: SubmitButtonProps) {
  return (
    <button type="submit" className={styles.submit} disabled={busy} aria-busy={busy}>
      <span className={styles.fillClip} aria-hidden="true">
        <span className={styles.fill} />
      </span>
      <span className={styles.label}>{label}</span>
      <span className={styles.arrow}>
        {busy ? <span className={styles.spinner} /> : <Icon name="chevronRight" size={18} />}
      </span>
    </button>
  );
}
