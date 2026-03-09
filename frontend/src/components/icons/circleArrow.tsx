import type { IconProps } from "../../lib/types.ts";

export const CircleArrowIcon = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M1.5 6a4.5 4.5 0 1 0 .9-2.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M1.5 2v2.5H4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
