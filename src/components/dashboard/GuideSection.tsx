import { METRIC_DOCS } from '../../engine/methodology';
import { Panel } from '../ui/Panel';

/** A–Z plain-language index of every metric: term, meaning, formula. */
export function GuideSection() {
  const docs = [...METRIC_DOCS].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <Panel
      title="A–Z guide"
      description="Every metric in one place: what it means in plain language, then the exact formula."
    >
      <dl className="flex flex-col divide-y divide-line">
        {docs.map((doc) => (
          <div key={doc.id} className="py-2.5">
            <dt className="text-sm font-medium text-fg">{doc.name}</dt>
            <dd className="mt-0.5 text-sm text-muted">{doc.note ?? doc.formula}</dd>
            {doc.note ? (
              <dd className="num mt-1 block text-sm text-fg">{doc.formula}</dd>
            ) : null}
          </div>
        ))}
      </dl>
    </Panel>
  );
}
