import { useCallback, useEffect, useId, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { cx } from '../../lib/cx';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'bottom';
  /** pass through to the wrapper so tooltips can sit inside flex rows */
  className?: string;
}

const MAX_WIDTH = 304;
const GAP = 8;

/**
 * Tooltip on hover, focus and tap. Positioned against the viewport so it never
 * gets clipped by a scrolling panel, and always reachable by keyboard.
 */
export function Tooltip({ content, children, side = 'top', className }: TooltipProps) {
  const id = useId();
  const [timer, setTimer] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);

  const place = useCallback(
    (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      const half = Math.min(MAX_WIDTH, window.innerWidth - 16) / 2;
      const left = Math.min(Math.max(rect.left + rect.width / 2, half + 8), window.innerWidth - half - 8);
      const top = side === 'top' ? rect.top - GAP : rect.bottom + GAP;
      setPosition({ left, top });
    },
    [side],
  );

  const showNow = useCallback(
    (element: HTMLElement) => {
      place(element);
      setOpen(true);
    },
    [place],
  );

  const showSoon = useCallback(
    (element: HTMLElement) => {
      const handle = window.setTimeout(() => {
        place(element);
        setOpen(true);
      }, 150);
      setTimer(handle);
    },
    [place],
  );

  const hide = useCallback(() => {
    setTimer((handle) => {
      if (handle !== null) window.clearTimeout(handle);
      return null;
    });
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') hide();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('resize', hide);
    };
  }, [open, hide]);

  useEffect(
    () => () => {
      if (timer !== null) window.clearTimeout(timer);
    },
    [timer],
  );

  return (
    <>
      <span
        className={cx('inline-flex items-center', className)}
        onPointerEnter={(event) => {
          if (event.pointerType === 'mouse') showSoon(event.currentTarget);
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === 'mouse') hide();
        }}
        onFocus={(event) => showNow(event.currentTarget)}
        onBlur={hide}
        aria-describedby={open ? id : undefined}
      >
        {children}
      </span>
      {open && position
        ? createPortal(
            <div
              id={id}
              role="tooltip"
              className="tip"
              style={{
                left: position.left,
                top: position.top,
                transform: side === 'top' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
                maxWidth: `min(${MAX_WIDTH}px, calc(100vw - 2rem))`,
              }}
            >
              {content}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
