import { Icon } from '../ui/Icon';
import { useModel } from '../../state/store';

const TONE: Record<string, string> = {
  info: 'text-subtle',
  warn: 'text-accent-fg',
  error: 'text-danger',
};

/**
 * Notes about assumptions that would otherwise produce a misleading number.
 * Shown before the figures so nothing looks healthier than it is.
 */
export function Advisories() {
  const { preview, simulation } = useModel();
  const live = preview?.simulation ?? simulation;
  if (live.advisories.length === 0) return null;

  return (
    <section aria-label="Notes about these assumptions" className="panel divide-y divide-line">
      {live.advisories.map((advisory) => (
        <div key={advisory.id} className="flex items-start gap-2.5 px-4 py-2.5">
          <span className={`mt-0.5 ${TONE[advisory.severity] ?? 'text-subtle'}`}>
            <Icon name={advisory.severity === 'info' ? 'info' : 'warning'} size={14} />
          </span>
          <p className="text-sm text-fg">{advisory.title}</p>
        </div>
      ))}
    </section>
  );
}
