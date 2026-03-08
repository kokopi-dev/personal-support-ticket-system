import type { IconProps } from "../../lib/types.ts";

export const PlusIcon = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 14 14" fill="none">
    <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
