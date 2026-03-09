import type { IconProps } from "../../lib/types.ts";

export const CloseIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 16 16" fill="none" className={className}>
    <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
