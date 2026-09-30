import type { ReactNode } from 'react';

import { cx } from '../../lib/cx';

export type IconName =
  | 'info'
  | 'copy'
  | 'check'
  | 'chevronDown'
  | 'chevronRight'
  | 'sun'
  | 'moon'
  | 'monitor'
  | 'link'
  | 'download'
  | 'close'
  | 'sliders'
  | 'reset'
  | 'undo'
  | 'redo'
  | 'print'
  | 'bars'
  | 'pin'
  | 'cursor'
  | 'warning'
  | 'flask'
  | 'arrowUp'
  | 'arrowDown'
  | 'arrowRight';

/**
 * One icon grid (16px), one stroke weight, round joins. Hand-drawn here so the
 * set is consistent instead of a starter kit's leftovers.
 */
const GLYPHS: Record<IconName, ReactNode> = {
  info: (
    <>
      <circle cx="8" cy="8" r="6.25" />
      <path d="M8 7.4v4.1" />
      <path d="M8 5.05h.01" />
    </>
  ),
  copy: (
    <>
      <rect x="5.75" y="5.75" width="7.75" height="7.75" rx="1.6" />
      <path d="M10.4 5.75V3.9a1.15 1.15 0 0 0-1.15-1.15H3.9A1.15 1.15 0 0 0 2.75 3.9v5.35A1.15 1.15 0 0 0 3.9 10.4h1.85" />
    </>
  ),
  check: <path d="m3.6 8.6 3 3 5.8-6.9" />,
  chevronDown: <path d="m4.2 6.4 3.8 3.8 3.8-3.8" />,
  chevronRight: <path d="m6.4 4.2 3.8 3.8-3.8 3.8" />,
  sun: (
    <>
      <circle cx="8" cy="8" r="3.1" />
      <path d="M8 1.6v1.6M8 12.8v1.6M1.6 8h1.6M12.8 8h1.6M3.5 3.5l1.1 1.1M11.4 11.4l1.1 1.1M12.5 3.5l-1.1 1.1M4.6 11.4l-1.1 1.1" />
    </>
  ),
  moon: <path d="M13.2 9.6A5.6 5.6 0 0 1 6.4 2.8a5.6 5.6 0 1 0 6.8 6.8Z" />,
  monitor: (
    <>
      <rect x="2.1" y="3" width="11.8" height="8.2" rx="1.4" />
      <path d="M8 11.2v2.3M5.6 13.5h4.8" />
    </>
  ),
  link: (
    <>
      <path d="M6.9 9.1 9.1 6.9" />
      <path d="M7.4 4.4 8.5 3.3a2.5 2.5 0 0 1 3.6 3.6l-1.1 1.1" />
      <path d="M8.6 11.6 7.5 12.7a2.5 2.5 0 0 1-3.6-3.6l1.1-1.1" />
    </>
  ),
  download: (
    <>
      <path d="M8 2.6v7.2" />
      <path d="M5.2 7 8 9.8 10.8 7" />
      <path d="M3 13.2h10" />
    </>
  ),
  close: <path d="m4.4 4.4 7.2 7.2M11.6 4.4l-7.2 7.2" />,
  sliders: (
    <>
      <path d="M2.6 5.2h5.1M10.4 5.2h3M2.6 10.8h3M8.4 10.8h5" />
      <circle cx="9.1" cy="5.2" r="1.4" />
      <circle cx="7.1" cy="10.8" r="1.4" />
    </>
  ),
  reset: (
    <>
      <path d="M13 8a5 5 0 1 1-1.6-3.7" />
      <path d="M13.2 2.6v3.2H10" />
    </>
  ),
  undo: (
    <>
      <path d="M3 7.2h5.4a3.7 3.7 0 0 1 0 7.4H5.2" />
      <path d="M6.1 4.1 3 7.2l3.1 3.1" />
    </>
  ),
  redo: (
    <>
      <path d="M13 7.2H7.6a3.7 3.7 0 0 0 0 7.4h3.2" />
      <path d="M9.9 4.1 13 7.2l-3.1 3.1" />
    </>
  ),
  print: (
    <>
      <path d="M5.2 6V2.9h5.6V6" />
      <rect x="2.6" y="6" width="10.8" height="5" rx="1.3" />
      <path d="M5.2 9.4h5.6v3.7H5.2z" />
    </>
  ),
  bars: <path d="M2.6 13.2V9.1M6.1 13.2V4.6M9.6 13.2V7.2M13.1 13.2V2.8" />,
  pin: (
    <>
      <path d="M8 14.1s4.3-3.7 4.3-6.4a4.3 4.3 0 1 0-8.6 0C3.7 10.4 8 14.1 8 14.1Z" />
      <path d="M8 8.1h.01" />
    </>
  ),
  cursor: <path d="M4.2 3.4 12.6 7.3 8.9 8.8l-1.5 3.7-3.2-9.1Z" />,
  warning: (
    <>
      <path d="M8 2.9 14 13.1H2z" />
      <path d="M8 6.6v3.1" />
      <path d="M8 11.4h.01" />
    </>
  ),
  flask: (
    <>
      <path d="M6.4 2.6h3.2M6.9 2.6v3.2L3.4 11.6a1.3 1.3 0 0 0 1.1 2h7a1.3 1.3 0 0 0 1.1-2L9.1 5.8V2.6" />
      <path d="M4.9 9.6h6.2" />
    </>
  ),
  arrowUp: <path d="M8 4.2 12 10H4z" fill="currentColor" stroke="none" />,
  arrowDown: <path d="M8 11.8 4 6h8z" fill="currentColor" stroke="none" />,
  arrowRight: <path d="M2.8 8h9.4m0 0L9 4.8M12.2 8 9 11.2" />,
};

export interface IconProps {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function Icon({ name, size = 16, strokeWidth = 1.5, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cx('shrink-0', className)}
      aria-hidden="true"
      focusable="false"
    >
      {GLYPHS[name]}
    </svg>
  );
}
