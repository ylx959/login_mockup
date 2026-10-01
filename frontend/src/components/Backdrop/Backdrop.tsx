import styles from "./Backdrop.module.css";

export function Backdrop() {
  return (
    <div className={styles.backdrop} aria-hidden="true">
      <div className={styles.photo} />
      <div className={styles.grain} />
    </div>
  );
}
