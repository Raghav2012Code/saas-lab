import { useMemo, useState } from 'react';

import { derive } from '../../engine/metrics';
import { simulate } from '../../engine/model';
import { PRESETS } from '../../engine/presets';
import { present } from '../../lib/levers';
import { useModel } from '../../state/store';
import { useToast } from '../../state/toast';
import { Button } from '../ui/Button';
import { Panel } from '../ui/Panel';

/** First-run strip: the three presets with live headline figures, previewable and adoptable. */
export function PresetStrip() {
  const { fmt, horizon, replaceModel } = useModel();
  const { notify } = useToast();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const figures = useMemo(() => {
    const end = horizon;
    return PRESETS.map((preset) => {
      const simulation = simulate(preset.model);
      const derived = derive(preset.model, simulation);
      const last = simulation.points[Math.min(end, simulation.points.length - 1)];
      return {
        id: preset.id,
        mrr: fmt.money(last?.mrr ?? 0),
        customers: fmt.number(last?.customers ?? 0),
        ltvCac: present(derived.unit.ltvToCac, (value) => fmt.multiplier(value)).display,
      };
    });
  }, [fmt, horizon]);

  const figureFor = (id: string) => figures.find((entry) => entry.id === id);

  return (
    <Panel
      title="Start from a preset"
      description="Three starting points with live figures from your projection length. Preview to inspect, adopt to make one yours — undoable."
    >
      <ul className="grid gap-4 md:grid-cols-3">
        {PRESETS.map((preset) => {
          const figure = figureFor(preset.id);
          const expanded = expandedId === preset.id;
          return (
            <li key={preset.id} className="flex min-w-0 flex-col gap-2 border-t border-line pt-3 first:border-t-0 first:pt-0 md:border-t-0 md:border-l md:pt-0 md:pl-4 md:first:border-l-0 md:first:pl-0">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-fg-strong">{preset.name}</p>
                <p className="mt-0.5 text-sm text-muted">{preset.blurb}</p>
              </div>
              {expanded && figure ? (
                <dl className="flex flex-col divide-y divide-line border-y border-line">
                  <div className="flex items-baseline justify-between gap-3 py-1.5">
                    <dt className="text-sm text-muted">MRR in month {horizon}</dt>
                    <dd className="num text-sm text-fg">{figure.mrr}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3 py-1.5">
                    <dt className="text-sm text-muted">Customers in month {horizon}</dt>
                    <dd className="num text-sm text-fg">{figure.customers}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3 py-1.5">
                    <dt className="text-sm text-muted">LTV : CAC</dt>
                    <dd className="num text-sm text-fg">{figure.ltvCac}</dd>
                  </div>
                </dl>
              ) : null}
              <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                <Button
                  size="sm"
                  aria-expanded={expanded}
                  onClick={() => setExpandedId(expanded ? null : preset.id)}
                >
                  {expanded ? 'Hide preview' : 'Preview'}
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    replaceModel(preset.model);
                    notify(`Now modelling the ${preset.name} preset`);
                  }}
                  title={`Replace your assumptions with the ${preset.name} preset`}
                >
                  Adopt
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
