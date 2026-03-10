import type { IconProps } from "../../lib/types.ts";

export const ChevronIcon = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
