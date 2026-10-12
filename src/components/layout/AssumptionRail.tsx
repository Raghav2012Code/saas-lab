import type { ReactNode } from 'react';

import { FIELD_GROUPS } from '../../engine/constants';
import type { AcquisitionMode, CacMode } from '../../engine/types';
import { visibleFields } from '../../engine/validate';
import { useModel } from '../../state/store';
import { Abbr } from '../ui/Abbr';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { InfoTip } from '../ui/InfoTip';
import { NumberField } from '../ui/NumberField';
import { Segmented } from '../ui/Segmented';

const ACQUISITION_OPTIONS: { value: AcquisitionMode; label: string; title: string }[] = [
  { value: 'funnel', label: 'Funnel', title: 'Visitors × visitor→signup × signup→paid' },
  { value: 'direct', label: 'Flat', title: 'A flat number of new customers each month' },
  { value: 'growth', label: 'Target', title: 'Worked out backwards from a target MRR growth rate' },
];

const CAC_OPTIONS: { value: CacMode; label: string; title: string }[] = [
  { value: 'spend', label: 'Budget', title: 'CAC = monthly sales & marketing ÷ new customers' },
  { value: 'direct', label: 'Enter', title: 'Type in CAC directly' },
];

/**
 * The control surface. Every input lives here, grouped the way a founder thinks
 * about the business, and every change recalculates the whole model instantly.
 */
export function AssumptionRail({
  variant = 'rail',
  closeSlot,
}: {
  variant?: 'rail' | 'drawer';
  /** rendered in the header, so the drawer can offer a close control */
  closeSlot?: ReactNode;
}) {
  const { model, fmt, setField, update, reset, isDefault, warnings } = useModel();
  const fields = visibleFields(model);
  const idPrefix = variant === 'drawer' ? 'drawer-field' : 'rail-field';

  const groups = FIELD_GROUPS.map((group) => ({
    group,
    specs: fields.filter((spec) => spec.group === group),
  })).filter((entry) => entry.specs.length > 0);

  const warningFields = new Set(warnings.map((warning) => warning.field));

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <h2 className="label-xs">Your assumptions</h2>
          <p className="mt-0.5 text-xs text-muted">Every edit recalculates <Abbr term="MRR" full="Monthly recurring revenue" />, customers, cash and runway instantly.</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <InfoTip label="Assumptions">
            <span className="block font-medium text-fg-strong">Drag a label to scrub, or type a value</span>
            <span className="mt-1 block text-muted">
              Labels are drag handles: pull left or right to change a number. Arrow keys step a focused
              input, and Shift makes each step finer.
            </span>
          </InfoTip>
          {closeSlot}
        </div>
      </header>

      <div className="flex flex-col gap-4 border-b border-line px-4 py-3">
        <div className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1 text-xs font-medium text-muted">
            How new customers are calculated
            <InfoTip label="How new customers are calculated">
              All three settings use the same calculation, so churn, <Abbr term="LTV" full="Lifetime value" />,
              runway and the projections stay comparable whichever you pick.
            </InfoTip>
          </span>
          <Segmented
            fill
            label="How new customers are calculated"
            value={model.acquisitionMode}
            onChange={(value) => update({ acquisitionMode: value })}
            options={ACQUISITION_OPTIONS}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1 text-xs font-medium text-muted">
            How CAC is calculated
            <InfoTip label="How CAC is calculated">
              CAC means customer acquisition cost. With a budget, CAC is monthly sales &amp; marketing divided by last month’s new customers, then held
              fixed — spending follows new customers rather than staying flat.
            </InfoTip>
          </span>
          <Segmented
            fill
            label="How CAC is calculated"
            value={model.cacMode}
            onChange={(value) => update({ cacMode: value })}
            options={CAC_OPTIONS}
          />
        </div>
      </div>

      <div className="scroll-area flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 py-4">
        {groups.map((entry) => (
          <section key={entry.group} className="flex flex-col gap-3.5">
            <h3 className="label-xs flex items-center gap-2">
              {entry.group}
              <span className="h-px flex-1 bg-line" />
              {entry.specs.some((spec) => warningFields.has(spec.key)) ? (
                <span className="inline-flex items-center text-accent-fg" title="One of these assumptions looks unusual">
                  <Icon name="warning" size={12} />
                  <span className="sr-only">One of these assumptions looks unusual</span>
                </span>
              ) : null}
            </h3>
            {entry.specs.map((spec) => (
              <NumberField
                key={spec.key}
                spec={spec}
                value={model[spec.key]}
                fmt={fmt}
                onCommit={(value) => setField(spec.key, value)}
                idPrefix={idPrefix}
              />
            ))}
          </section>
        ))}
      </div>

      <footer className="flex items-center justify-between gap-2 border-t border-line px-4 py-2.5">
        <p className="text-xs text-muted">{isDefault ? 'Default assumptions' : 'Saved in this browser on this device'}</p>
        <Button size="sm" variant="quiet" onClick={reset} title="Reset every assumption to its default">
          Reset
        </Button>
      </footer>
    </div>
  );
}
