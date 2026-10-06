import { CURRENCIES, CURRENCY_ORDER } from '../../engine/currency';
import type { CurrencyCode } from '../../engine/types';
import { useModel } from '../../state/store';
import { resolveDark, themeLabel, useTheme, type ThemeMode } from '../../state/theme';
import { Segmented } from '../ui/Segmented';
import { Select } from '../ui/Select';
import { Button, IconButton } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Tooltip } from '../ui/Tooltip';
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
  const { model, setCurrency, tab, setTab, undo, redo, canUndo, canRedo } = useModel();
  const { mode, cycle } = useTheme();

  const themeIcon = mode === 'light' ? 'sun' : mode === 'dark' ? 'moon' : 'monitor';
  const resolved = resolveDark(mode) ? 'dark' : 'light';

  return (
    <header
      className="sticky top-0 z-40 border-b border-line bg-bg"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div
        className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 lg:px-5"
        style={{
          paddingLeft: 'max(1rem, env(safe-area-inset-left, 0px))',
          paddingRight: 'max(1rem, env(safe-area-inset-right, 0px))',
        }}
      >
        <a
          href="#top"
          className="order-1 flex min-h-8 items-center gap-2 rounded-sm py-1"
          title="Back to top"
        >
          <BrandMark />
          {/* The mark carries the brand on a phone; the wordmark would push the
              controls onto a second row. */}
          <span className="hidden text-base font-semibold tracking-tight text-fg-strong sm:inline">
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

        <div className="order-2 ml-auto flex items-center gap-1 sm:gap-1.5 lg:order-3">
          <div className="flex items-center gap-0.5">
            <Tooltip
              content={canUndo ? 'Undo the last change (⌘Z)' : 'Nothing to undo'}
              className={!canUndo ? 'cursor-not-allowed' : undefined}
            >
              <IconButton
                label="Undo the last change (⌘Z or Ctrl+Z)"
                icon="undo"
                onClick={undo}
                disabled={!canUndo}
                className="disabled:opacity-35 disabled:pointer-events-none"
              />
            </Tooltip>
            <Tooltip
              content={canRedo ? 'Redo the change (⌘⇧Z)' : 'Nothing to redo'}
              className={!canRedo ? 'cursor-not-allowed' : undefined}
            >
              <IconButton
                label="Redo the change (⌘⇧Z or Ctrl+Shift+Z)"
                icon="redo"
                onClick={redo}
                disabled={!canRedo}
                className="disabled:opacity-35 disabled:pointer-events-none"
              />
            </Tooltip>
          </div>
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
    <div
      data-bottom-bar
      className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface px-4 pt-2.5 lg:hidden"
      style={{
        paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom, 0px))',
        paddingLeft: 'max(1rem, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(1rem, env(safe-area-inset-right, 0px))',
      }}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="label-xs truncate">
            MRR today
            {/* The label row has spare width; the value row does not. Below
                380px even this is tight, so the count is dropped rather than
                truncated mid-word. */}
            <span className="hidden normal-case min-[380px]:inline">
              {' '}
              · {fmt.number(derived.today.customers)} customers
            </span>
          </p>
          <p className="num truncate text-base text-fg-strong">{fmt.moneyCompact(derived.today.mrr)}</p>
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
