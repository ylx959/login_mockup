import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";

import { instant, shellSpring, SURFACE_LAYOUT_ID } from "~/lib/motion";

import styles from "./GlassPanel.module.css";

export type GlassPanelProps = {
  children: ReactNode;
  labelledBy?: string;
  /** 在外殼以外的地方按下時呼叫。 */
  onDismiss?(): void;
};

/**
 * 玻璃外殼。layout 讓它在內容高度改變時自己補間，
 * 這就是切換模式時「島」展開的來源 —— 不是我們自己算高度。
 *
 * 外殼本身只負責共享 layout 變形，不另外做位移、縮放或淡入；
 * 內容顯示效果由卡片內部處理，避免兩層動畫互相干擾。
 */
export function GlassPanel({
  children,
  labelledBy,
  onDismiss,
}: GlassPanelProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);

  // 用 pointerdown 而不是 click：在欄位裡按下、拖到外面才放開（例如選取文字）不該收合。
  useEffect(() => {
    if (!onDismiss) return;
    const handle = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onDismiss();
    };
    document.addEventListener("pointerdown", handle);
    return () => document.removeEventListener("pointerdown", handle);
  }, [onDismiss]);

  return (
    <motion.section
      ref={ref}
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
