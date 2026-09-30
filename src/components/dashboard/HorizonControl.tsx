import { HORIZONS } from '../../engine/constants';
import type { HorizonMonths } from '../../engine/types';
import { useModel } from '../../state/store';
import { Segmented } from '../ui/Segmented';

/** Projection length. Shared state, so every chart on every tab agrees. */
export function HorizonControl() {
  const { horizon, setHorizon } = useModel();
  return (
    <Segmented<`${HorizonMonths}`>
      label="Projection length"
      value={`${horizon}`}
      onChange={(value) => setHorizon(Number(value) as HorizonMonths)}
      options={HORIZONS.map((entry) => ({ value: `${entry.months}`, label: entry.label }))}
    />
  );
}
