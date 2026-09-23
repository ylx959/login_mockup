import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import { instantScreenVariants, screenVariants } from "@/lib/motion";

import styles from "@/styles/Screen.module.css";

/** 每個 page 的外框：負責換頁時的進出場動畫。 */
export function Screen({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={styles.screen}
      variants={reduced ? instantScreenVariants : screenVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}
