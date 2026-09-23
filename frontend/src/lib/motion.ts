/**
 * 動態的設定集中在這裡，要調手感只改這一處。
 *
 * Dynamic Island 的關鍵是彈簧而不是線性緩動：卡片變高時要帶一點過衝，
 * 但不能晃，所以 damping 壓得比較高。
 */

import type { Transition, Variants } from "motion/react";

/** 膠囊與卡片共用這個 id，Motion 才會把一個變形成另一個。 */
export const SURFACE_LAYOUT_ID = "auth-surface";

/** 卡片外殼改變尺寸時用的，稍微慢一點才有份量。 */
export const shellSpring: Transition = {
  type: "spring",
  stiffness: 220,
  damping: 30,
  mass: 0.9,
};

/** 欄位進出與文字交換用的，比外殼快，感覺才俐落。 */
export const contentSpring: Transition = {
  type: "spring",
  stiffness: 320,
  damping: 32,
  mass: 0.7,
};

export const textVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

/** 同一張玻璃卡片裡的畫面依序交接，退場完成後下一個畫面才淡入。 */
export const screenVariants: Variants = {
  initial: {
    opacity: 0,
    transition: { duration: 0.24, ease: [0.16, 1, 0.3, 1] },
  },
  animate: {
    opacity: 1,
    transition: { duration: 0.24, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.16, ease: [0.42, 0, 1, 1] },
  },
};

/** reduced-motion 不等待任何內容交接動畫。 */
export const instantScreenVariants: Variants = {
  initial: { opacity: 1, transition: { duration: 0 } },
  animate: { opacity: 1, transition: { duration: 0 } },
  exit: { opacity: 0, transition: { duration: 0 } },
};

/** 關閉動態效果時，所有轉場都退化成「直接到位」。 */
export const instant: Transition = { duration: 0 };
