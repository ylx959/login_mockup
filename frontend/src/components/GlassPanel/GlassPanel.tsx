import type { ReactNode } from "react";

import styles from "./GlassPanel.module.css";

export type GlassPanelProps = {
  children: ReactNode;
  labelledBy?: string;
};

export function GlassPanel({ children, labelledBy }: GlassPanelProps) {
  return (
    <section className={styles.panel} {...(labelledBy ? { "aria-labelledby": labelledBy } : {})}>
      {children}
    </section>
  );
}
