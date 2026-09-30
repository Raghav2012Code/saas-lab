import { CURRENCIES, CURRENCY_ORDER } from '../../engine/currency';
import { copyText } from '../../engine/export';
import { buildShareUrl } from '../../engine/share';
import type { CurrencyCode } from '../../engine/types';
import { useModel } from '../../state/store';
import { resolveDark, themeLabel, useTheme, type ThemeMode } from '../../state/theme';
import { useToast } from '../../state/toast';
import { Segmented } from '../ui/Segmented';
import { Select } from '../ui/Select';
import { Button, IconButton } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { ExportMenu } from './ExportMenu';
import type { TabId } from '../../state/store';

const TABS: { value: TabId; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'projections', label: 'Projections' },
  { value: 'scenarios', label: 'Scenarios' },
  { value: 'methodology', label: 'Methodology' },
];

const NEXT_THEME: Record<ThemeMode, ThemeMode> = {
  system: 'light',
  light: 'dark',
  dark: 'system',
};

function BrandMark() {
  return (
    <svg viewBox="0 0 20 20" width={22} height={22} aria-hidden="true" focusable="false">
      <rect width="20" height="20" rx="5.5" fill="var(--brand)" />
      <path
        d="M5.1 13.7 8.3 10l2.4 2.2 4-5.7"
        fill="none"
        stroke="var(--brand-fg)"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="14.7" cy="6.5" r="1.3" fill="var(--brand-fg)" />
    </svg>
  );
}

export function TopBar() {
  const { model, setCurrency, tab, setTab } = useModel();
  const { mode, cycle } = useTheme();
  const { notify } = useToast();

  const themeIcon = mode === 'light' ? 'sun' : mode === 'dark' ? 'moon' : 'monitor';
  const resolved = resolveDark(mode) ? 'dark' : 'light';

  const share = async () => {
    const ok = await copyText(buildShareUrl(model));
    notify(
      ok ? 'Share link copied — every assumption travels in the link' : 'Could not copy the link',
      ok ? 'neutral' : 'error',
    );
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 lg:px-5">
        <a
          href="#top"
          className="order-1 flex min-h-8 items-center gap-2 rounded-sm py-1"
          title="Back to top"
        >
          <BrandMark />
          <span className="text-base font-semibold tracking-tight text-fg-strong">
            SaaS<span className="font-medium text-muted"> Calculator</span>
          </span>
        </a>

        <div className="order-3 w-full min-w-0 lg:order-2 lg:w-auto">
          <Segmented
            className="-mx-1 px-1"
            value={tab}
            onChange={setTab}
            options={TABS}
            label="View"
          />
        </div>

        <div className="order-2 ml-auto flex items-center gap-1.5 lg:order-3">
          <Select<CurrencyCode>
            ariaLabel="Currency"
            value={model.currency}
            onChange={setCurrency}
            options={CURRENCY_ORDER.map((code) => ({
              value: code,
              label: `${code} ${CURRENCIES[code].symbol}`,
            }))}
          />
          <IconButton
            label={`Theme: ${themeLabel(mode)} (${resolved}). Switch to ${themeLabel(NEXT_THEME[mode])}.`}
            icon={themeIcon}
            onClick={cycle}
          />
          <IconButton label="Copy a share link to this model" icon="link" onClick={share} />
          <ExportMenu />
        </div>
      </div>
    </header>
  );
}

export function MobileRailTrigger() {
  const { setRailOpen, warnings, derived, fmt } = useModel();
  const warningCount = warnings.length;

  return (
    <div className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface px-4 py-2.5 lg:hidden">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="label-xs">MRR today</p>
          <p className="num truncate text-base text-fg-strong">
            {fmt.moneyCompact(derived.today.mrr)}
            <span className="text-subtle"> · {fmt.number(derived.today.customers)} customers</span>
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setRailOpen(true)}
          title={
            warningCount > 0
              ? `${warningCount} assumption${warningCount === 1 ? '' : 's'} look unusual`
              : 'Edit your assumptions'
          }
        >
          <Icon name="sliders" size={14} />
          Assumptions
          {warningCount > 0 ? (
            <span className="ml-0.5 rounded-full bg-brand-fg/20 px-1.5 text-xs">{warningCount}</span>
          ) : null}
        </Button>
      </div>
    </div>
  );
}
