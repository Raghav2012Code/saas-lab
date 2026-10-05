import { useCallback, useState } from 'react';

/**
 * Remembers which chart series the user has hidden. Shared by every panel so
 * the same interaction works everywhere a chart has more than one series.
 */
export function useSeriesToggle(): {
  hidden: string[];
  toggle: (id: string) => void;
} {
  const [hidden, setHidden] = useState<string[]>([]);

  const toggle = useCallback((id: string) => {
    setHidden((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    );
  }, []);

  return { hidden, toggle };
}
