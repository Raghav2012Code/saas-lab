import type { ReactNode } from 'react';

import { Icon } from './Icon';
import { Tooltip } from './Tooltip';

interface InfoTipProps {
  /** what the tip explains, used for the accessible name */
  label: string;
  children: ReactNode;
}

export function InfoTip({ label, children }: InfoTipProps) {
  return (
    <Tooltip content={children} className="align-middle">
      <button
        type="button"
        aria-label={`Explain: ${label}`}
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-subtle opacity-80 transition-opacity hover:opacity-100 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Icon name="info" size={13} />
      </button>
    </Tooltip>
  );
}
