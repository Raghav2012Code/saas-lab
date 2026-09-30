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
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-subtle opacity-70 transition-opacity hover:opacity-100 hover:text-fg"
      >
        <Icon name="info" size={13} />
      </button>
    </Tooltip>
  );
}

/** A definition row used inside tips and the methodology table. */
export function TipRow({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="flex gap-1.5">
      <span className="text-subtle">{term}</span>
      <span className="text-fg">{children}</span>
    </div>
  );
}
