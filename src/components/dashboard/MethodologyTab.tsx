import { BENCH_BANDS } from '../../engine/constants';
import { METRIC_DOCS, MODEL_NOTES } from '../../engine/methodology';
import { assumptionRows } from '../../lib/export-model';
import { useModel } from '../../state/store';
import { Panel, SectionHeading } from '../ui/Panel';
import { Pill } from '../ui/Pill';

/** Every formula, assumption and benchmark the app uses, in one place. */
export function MethodologyTab() {
  const { model, fmt, warnings } = useModel();
  const rows = assumptionRows(model, fmt);

  return (
    <div className="flex flex-col gap-8 lg:gap-10">
      <SectionHeading

        title="Exactly how every number is calculated"
        description="SaaS metrics have more than one accepted definition. These are the ones this model uses, stated plainly so you can judge them."
      />

      <Panel
        title="How the model works"
        description="The rules that apply everywhere, not just to one metric."
      >
        <div className="grid gap-x-8 gap-y-5 lg:grid-cols-2">
          {MODEL_NOTES.map((note) => (
            <div key={note.id}>
              <h3 className="text-sm font-semibold text-fg-strong">{note.title}</h3>
              <p className="mt-1 text-sm text-muted">{note.body}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel
        title="Metric definitions"
        description="The formula behind each figure, and any caveat that comes with it."
        flush
      >
        <div className="overflow-x-auto">
          <table className="data-table data-table-text min-w-[40rem]">
            <caption className="sr-only">Definitions and formulas for every metric</caption>
            <thead>
              <tr>
                <th scope="col">Metric</th>
                <th scope="col">Definition</th>
              </tr>
            </thead>
            <tbody>
              {METRIC_DOCS.map((doc) => (
                <tr key={doc.id}>
                  <th scope="row">{doc.name}</th>
                  <td className="!whitespace-normal">
                    <span className="num block text-sm text-fg">{doc.formula}</span>
                    {doc.note ? <span className="mt-1 block text-xs text-muted">{doc.note}</span> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Assumptions in force"
          description="What is currently feeding the model."
          flush
        >
          <div className="scroll-area max-h-[30rem] overflow-auto">
            <table className="data-table">
              <caption className="sr-only">The current value of every assumption</caption>
              <thead>
                <tr>
                  <th scope="col">Assumption</th>
                  <th scope="col">Value</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const warning = warnings.find((issue) => issue.field === row.label);
                  return (
                    <tr key={row.label}>
                      <th scope="row" className="!whitespace-normal">
                        {row.label}
                        {warning ? (
                          <span className="block text-xs font-normal text-accent-fg">{warning.message}</span>
                        ) : null}
                      </th>
                      <td className="num">{row.value}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel
          title="Benchmarks used"
          description="Ranges behind the “Strong / Typical / Below range” labels. They are rules of thumb, not laws."
        >
          <ul className="flex flex-col divide-y divide-line">
            {Object.entries(BENCH_BANDS).map(([id, band]) => (
              <li key={id} className="flex flex-col gap-1 py-2.5">
                <span className="flex items-center gap-2">
                  <span className="text-sm font-medium text-fg">{BENCH_LABELS[id] ?? id}</span>
                  <Pill tone="neutral">
                    {band.lowerIsBetter ? `better under ${band.good}` : `better over ${band.good}`}
                  </Pill>
                </span>
                <span className="text-xs text-muted">{band.guidance}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

const BENCH_LABELS: Record<string, string> = {
  churn: 'Monthly churn',
  grossMargin: 'Gross margin',
  ltvToCac: 'LTV : CAC',
  payback: 'CAC payback',
  netRetention: 'Net revenue retention',
  mrrGrowth: 'MRR growth',
  runway: 'Runway',
};
