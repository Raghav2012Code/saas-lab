import { useEffect, useRef } from 'react';

import { useModel } from '../../state/store';
import { IconButton } from '../ui/Button';
import { AssumptionRail } from './AssumptionRail';

/**
 * The assumptions rail on small screens.
 *
 * A native <dialog> gives us the modal behaviour for free (focus trap, inert
 * background, real backdrop). Three things it does not give you, all handled
 * here:
 *
 *  - touch has no Escape key, so the rail carries a close button;
 *  - the backdrop does not dismiss by default, so a click landing on the dialog
 *    element itself (outside its content) closes it;
 *  - a native close must be mirrored into app state, or the drawer can never be
 *    reopened. React state is therefore the single source of truth: Escape, the
 *    close button and the backdrop all set it, and the effect below is the only
 *    thing that opens or closes the native element.
 *
 * The contents mount only while open, so the document never holds two copies of
 * every input, label and heading.
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

  // Belt and braces: if the platform does fire a native close, follow it.
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const sync = () => setRailOpen(element.open);
    element.addEventListener('close', sync);
    element.addEventListener('cancel', sync);
    return () => {
      element.removeEventListener('close', sync);
      element.removeEventListener('cancel', sync);
    };
  }, [setRailOpen]);

  return (
    <dialog
      ref={dialog}
      className="rail-dialog"
      aria-label="Your assumptions"
      onClick={(event) => {
        if (event.target === dialog.current) setRailOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') setRailOpen(false);
      }}
    >
      {railOpen ? (
        <AssumptionRail
          variant="drawer"
          closeSlot={
            <IconButton
              label="Close assumptions"
              icon="close"
              onClick={() => setRailOpen(false)}
            />
          }
        />
      ) : null}
    </dialog>
  );
}
