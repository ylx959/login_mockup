import { motion, useReducedMotion } from "motion/react";

import { touchLabel } from "~/data/copy";
import { instant, shellSpring, SURFACE_LAYOUT_ID } from "~/lib/motion";

import styles from "./TouchPill.module.css";

export type TouchPillProps = {
  onOpen(): void;
};

/**
 * 跟卡片共用同一個 layoutId，所以 Motion 會把膠囊「長成」卡片，
 * 而不是一個淡出、另一個淡入。
 */
export function TouchPill({ onOpen }: TouchPillProps) {
  const reduced = useReducedMotion();

  return (
    <motion.button
      layoutId={SURFACE_LAYOUT_ID}
      layout
      transition={reduced ? instant : shellSpring}
      type="button"
      className={styles.pill}
      onClick={onOpen}
      aria-expanded={false}
      {...(reduced ? {} : { whileTap: { scale: 0.97 } })}
    >
      <motion.span layout="position">{touchLabel}</motion.span>
    </motion.button>
  );
}
