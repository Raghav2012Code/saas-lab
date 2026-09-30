import { leverDescriptions } from '../../lib/levers';
import { useModel } from '../../state/store';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Pill } from '../ui/Pill';

/**
 * The global "you are looking at a hypothetical" bar. Because the what-if runs
 * through the same store, this banner appears on every tab until it is applied
 * or discarded.
 */
export function PreviewBanner() {
  const { preview, applyPreview, resetLevers, model, levers, fmt } = useModel();
  if (!preview) return null;

  const descriptions = leverDescriptions(model, levers, fmt).map((entry) => entry.text);

  return (
    <div className="sticky top-[var(--header-h)] z-30 border-b border-line bg-accent-soft">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 lg:px-5">
        <span className="flex items-center gap-1.5">
          <Icon name="flask" size={14} className="text-accent-fg" />
          <Pill tone="ghost">What if</Pill>
        </span>

        <p className="min-w-0 flex-1 text-sm text-accent-fg">
          {descriptions.length > 0 ? descriptions.join(' · ') : 'Adjust the levers to explore a change.'}
        </p>

        <div className="flex items-center gap-2">
          <span className="num hidden text-xs text-accent-fg sm:inline">
            MRR {fmt.moneyCompact(preview.derived.today.mrr)}
          </span>
          <Button size="sm" variant="primary" onClick={applyPreview}>
            Apply
          </Button>
          <Button size="sm" onClick={resetLevers}>
            Discard
          </Button>
        </div>
      </div>
    </div>
  );
}
