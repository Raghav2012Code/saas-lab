import { useEffect, useRef, useState } from 'react';

import { assumptionsCsv, copyText, downloadFile, modelJson, projectionCsv } from '../../engine/export';
import { buildShareUrl } from '../../engine/share';
import { assumptionRows, buildModelExport } from '../../lib/export-model';
import { useModel } from '../../state/store';
import { useToast } from '../../state/toast';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

/** Real exports only: three files that open cleanly, plus the print sheet. */
export function ExportMenu() {
  const { model, derived, simulation, fmt, horizon } = useModel();
  const { notify } = useToast();
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (!open) return;

    // Focus the first item when the menu opens
    const timer = setTimeout(() => {
      itemRefs.current[0]?.focus();
    }, 0);

    const onPointerDown = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        trigger.current?.focus();
        return;
      }

      if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'Tab'].includes(event.key)) {
        const items = itemRefs.current.filter((el): el is HTMLButtonElement => el !== null);
        if (items.length === 0) return;

        if (event.key === 'Tab') {
          setOpen(false);
          return;
        }

        event.preventDefault();
        const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);

        if (event.key === 'ArrowDown') {
          const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % items.length;
          items[nextIndex]?.focus();
        } else if (event.key === 'ArrowUp') {
          const prevIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
          items[prevIndex]?.focus();
        } else if (event.key === 'Home') {
          items[0]?.focus();
        } else if (event.key === 'End') {
          items[items.length - 1]?.focus();
        }
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const stamp = new Date().toISOString().slice(0, 10);

  const actions: { id: string; label: string; hint: string; run: () => void }[] = [
    {
      id: 'share',
      label: 'Copy share link',
      hint: 'Every assumption travels in the link',
      run: () => {
        void copyText(buildShareUrl(model)).then((ok) =>
          notify(
            ok ? 'Share link copied — the whole model is in the link' : 'Could not copy the link',
            ok ? 'neutral' : 'error',
          ),
        );
      },
    },
    {
      id: 'projection',
      label: 'Projection CSV',
      hint: `Every month of the ${horizon}-month projection`,
      run: () => {
        downloadFile(
          `saas-projection-${horizon}mo-${stamp}.csv`,
          projectionCsv(simulation.points.slice(0, horizon + 1)),
          'text/csv',
        );
        notify('Projection CSV downloaded');
      },
    },
    {
      id: 'assumptions',
      label: 'Assumptions CSV',
      hint: 'Every input, exactly as entered',
      run: () => {
        downloadFile(
          `saas-assumptions-${stamp}.csv`,
          assumptionsCsv(model, assumptionRows(model, fmt)),
          'text/csv',
        );
        notify('Assumptions CSV downloaded');
      },
    },
    {
      id: 'json',
      label: 'Model JSON',
      hint: 'The full model, for backups or scripts',
      run: () => {
        downloadFile(
          `saas-model-${stamp}.json`,
          modelJson(buildModelExport(model, derived, fmt)),
          'application/json',
        );
        notify('Model JSON downloaded');
      },
    },
    {
      id: 'print',
      label: 'Print / Save as PDF',
      hint: 'Prints the tab you are looking at',
      run: () => {
        setOpen(false);
        window.print();
      },
    },
  ];

  return (
    <div ref={container} className="relative">
      <Button
        ref={trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && !open) {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <Icon name="download" size={14} />
        <span className="hidden sm:inline">Export</span>
        <Icon name="chevronDown" size={13} />
      </Button>

      {open ? (
        <div
          role="menu"
          aria-label="Export"
          className="panel menu-in absolute right-0 z-50 mt-1.5 w-[17rem] overflow-hidden p-1 shadow-[var(--shadow-overlay)]"
        >
          {actions.map((action, index) => (
            <button
              key={action.id}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              type="button"
              role="menuitem"
              className="flex w-full flex-col items-start gap-0.5 rounded-sm px-2.5 py-2 text-left transition-colors hover:bg-surface-2 focus-visible:bg-surface-2"
              onClick={() => {
                action.run();
                setOpen(false);
              }}
            >
              <span className="text-sm font-medium text-fg">{action.label}</span>
              <span className="text-xs text-muted">{action.hint}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
