import type { ReactNode } from 'react';

import { Tooltip } from './Tooltip';

interface AbbrProps {
  /** short form, e.g. "MRR" */
  term: string;
  /** what it stands for, e.g. "Monthly recurring revenue" */
  full: string;
  /** optional plain-language follow-up shown under the full form */
  hint?: ReactNode;
}

/**
 * First-mention expansion for an acronym. Dotted underline (the same
 * affordance as NumberField's scrub label) plus the repo Tooltip; the native
 * title stays as the no-JS and touch fallback.
 */
export function Abbr({ term, full, hint }: AbbrProps) {
  return (
    <Tooltip
      content={
        <>
          <span className="block font-medium text-fg-strong">{full}</span>
          {hint ? <span className="mt-1 block text-muted">{hint}</span> : null}
        </>
      }
    >
      <abbr className="cursor-help underline decoration-dotted underline-offset-4" title={full} tabIndex={0}>
        {term}
      </abbr>
    </Tooltip>
  );
}
