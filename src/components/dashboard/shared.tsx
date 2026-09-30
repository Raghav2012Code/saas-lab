import type { ReactNode } from 'react';

/** Hairline grid of headline tiles: one surface, not a wall of cards. */
export function TileGrid({ children }: { children: ReactNode }) {
  return (
    <div className="panel overflow-hidden">
      <div className="grid grid-cols-1 gap-px bg-line min-[360px]:grid-cols-2 lg:grid-cols-4">
        {children}
      </div>
    </div>
  );
}

export function Tile({ children }: { children: ReactNode }) {
  return <div className="min-w-0 bg-surface px-4">{children}</div>;
}

/** A labelled group of rows inside a panel. */
export function RowGroup({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col">
      {title ? <h3 className="label-xs pb-1.5">{title}</h3> : null}
      <div className="divide-y divide-line">{children}</div>
    </div>
  );
}
