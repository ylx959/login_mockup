import type { ButtonHTMLAttributes, ReactNode } from "react";

import styles from "@/styles/PillButton.module.css";

export type PillVariant = "solid" | "ghost" | "quiet";

export type PillButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: PillVariant;
  compact?: boolean;
  children: ReactNode;
};

export function PillButton({
  variant = "solid",
  compact = false,
  className,
  type = "button",
  children,
  ...rest
}: PillButtonProps) {
  const classes = [styles.pill, styles[variant], compact ? styles.compact : "", className ?? ""]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  );
}
