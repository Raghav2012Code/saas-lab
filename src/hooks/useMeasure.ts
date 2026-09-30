import { useEffect, useRef, useState, type RefObject } from 'react';

/**
 * Measures an element's width and keeps it in sync with resizes. Charts use
 * this so they fill their container without any charting dependency.
 */
export function useMeasure<T extends HTMLElement>(): [RefObject<T | null>, number] {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    setWidth(element.clientWidth);

    if (typeof ResizeObserver === 'undefined') {
      const onResize = () => setWidth(element.clientWidth);
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
}
