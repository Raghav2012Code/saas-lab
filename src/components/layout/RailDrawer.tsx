import { useEffect, useRef } from 'react';

import { useModel } from '../../state/store';
import { AssumptionRail } from './AssumptionRail';

/**
 * The assumptions rail on small screens. A native <dialog> gives us the modal
 * behaviour for free: Escape closes it, focus is trapped, and the backdrop is
 * real rather than a hand-rolled overlay.
 */
export function RailDrawer() {
  const { railOpen, setRailOpen } = useModel();
  const dialog = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (railOpen && !element.open) element.showModal();
    if (!railOpen && element.open) element.close();
  }, [railOpen]);

  return (
    <dialog
      ref={dialog}
      className="rail-dialog"
      aria-label="Your assumptions"
      onClose={() => setRailOpen(false)}
      onCancel={() => setRailOpen(false)}
    >
      <AssumptionRail />
    </dialog>
  );
}
