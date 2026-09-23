import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import { instant, shellSpring, SURFACE_LAYOUT_ID } from "~/lib/motion";

import styles from "./GlassPanel.module.css";

export type GlassPanelProps = {
  children: ReactNode;
  labelledBy?: string;
};

/**
 * 玻璃外殼。layout 讓它在內容高度改變時自己補間，
 * 這就是切換模式時「島」展開的來源 —— 不是我們自己算高度。
 *
 * 外殼本身只負責共享 layout 變形，不另外做位移、縮放或淡入；
 * 內容顯示效果由卡片內部處理，避免兩層動畫互相干擾。
 */
export function GlassPanel({ children, labelledBy }: GlassPanelProps) {
  const reduced = useReducedMotion();

  return (
    <motion.section
      layoutId={SURFACE_LAYOUT_ID}
      layout
      transition={reduced ? instant : shellSpring}
      className={styles.panel}
      {...(labelledBy ? { "aria-labelledby": labelledBy } : {})}
    >
      {children}
    </motion.section>
  );
}
