import type { IconProps } from "../../lib/types.ts";

export const InfoIcon = ({ className }: IconProps) => (
  <svg
    className={className} viewBox="0 0 14 14" fill="none"
  >
    <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.25" />
    <path d="M7 6.5v4M7 4.5v.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
  </svg>
);
