import type { IconName } from "@/data/fields";

/** 細線白色圖示，手寫 SVG，不引入 icon 套件。 */
export type IconGlyph = IconName | "chevronRight" | "close";

const paths: Record<IconGlyph, React.ReactNode> = {
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 19.5c1.6-3.2 4.1-4.8 7-4.8s5.4 1.6 7 4.8" />
    </>
  ),
  at: (
    <>
      <circle cx="12" cy="12" r="3.6" />
      <path d="M15.6 12v1.6a2.6 2.6 0 0 0 5.2 0V12a8.8 8.8 0 1 0-3.4 6.9" />
    </>
  ),
  key: (
    <>
      <circle cx="8.4" cy="8.4" r="3.9" />
      <path d="M11.2 11.2 20 20M17 17l-2 2M20 14l-2 2" />
    </>
  ),
  chevronRight: <path d="M10 7l5 5-5 5" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
};

export type IconProps = {
  name: IconGlyph;
  size?: number;
  strokeWidth?: number;
};

export function Icon({ name, size = 20, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}
