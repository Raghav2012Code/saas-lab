/** Axis labels for a monthly projection. */
export function monthLabels(points: { month: number; date: string }[]): string[] {
  const short = new Intl.DateTimeFormat(undefined, { month: 'short', timeZone: 'UTC' });

  return points.map((point) => {
    if (point.month === 0) return 'Now';
    const date = new Date(`${point.date}T00:00:00Z`);
    const label = short.format(date);
    // Mark the year at each January so a 24/36-month axis stays unambiguous.
    return date.getUTCMonth() === 0 ? `${label} ’${String(date.getUTCFullYear()).slice(2)}` : label;
  });
}

/** "Month 14" style label for a month index. */
export function monthName(index: number): string {
  return index === 0 ? 'today' : `month ${index}`;
}
