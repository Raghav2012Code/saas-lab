import { useEffect } from 'react';

/**
 * Publishes the real heights of the sticky header and the mobile action bar as
 * CSS variables.
 *
 * Both are content-sized: the header wraps to two or three rows on a narrow
 * phone, and the bar grows with the safe-area inset on a notched device. Rather
 * than hard-coding offsets that are wrong on some device, everything that needs
 * to clear them reads `--header-h` and `--bottom-bar-h`.
 */
export function useLayoutMetrics(): void {
  useEffect(() => {
    const root = document.documentElement;
    const header = document.querySelector<HTMLElement>('header.sticky');
    const bar = document.querySelector<HTMLElement>('[data-bottom-bar]');

    const measure = () => {
      const headerHeight = header ? Math.round(header.getBoundingClientRect().height) : 0;
      root.style.setProperty('--header-h', `${headerHeight}px`);

      const barVisible = bar ? getComputedStyle(bar).display !== 'none' : false;
      const barHeight = bar && barVisible ? Math.round(bar.getBoundingClientRect().height) : 0;
      root.style.setProperty('--bottom-bar-h', `${barHeight}px`);
    };

    measure();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }

    const observer = new ResizeObserver(measure);
    if (header) observer.observe(header);
    if (bar) observer.observe(bar);
    // Fonts settling and orientation changes do not always fire the observer.
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    window.addEventListener('load', measure);
    // A webfont swap changes the header's height a frame after first paint.
    void document.fonts?.ready.then(measure).catch(() => undefined);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
      window.removeEventListener('load', measure);
    };
  }, []);
}
