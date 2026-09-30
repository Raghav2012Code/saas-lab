/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { DEFAULT_HORIZON, DEFAULT_MODEL, STORAGE_KEY } from '../engine/constants';
import { createFormatters, type Formatters } from '../engine/format';
import { derive } from '../engine/metrics';
import { simulate } from '../engine/model';
import { buildScenarios } from '../engine/scenarios';
import { readModelFromHash } from '../engine/share';
import { isDefaultModel, modelWarnings, normalizeModel } from '../engine/validate';
import { activeLevers, applyLevers, EMPTY_LEVERS, type LeverValues } from '../engine/whatIf';
import type {
  CurrencyCode,
  Derived,
  HorizonMonths,
  Model,
  ModelChange,
  NumericField,
  ScenarioResult,
  Simulation,
} from '../engine/types';
import { describeChanges } from '../engine/scenarios';

export type TabId = 'overview' | 'projections' | 'scenarios' | 'methodology';

export interface Preview {
  model: Model;
  simulation: Simulation;
  derived: Derived;
  changes: ModelChange[];
}

interface StoreValue {
  model: Model;
  fmt: Formatters;
  simulation: Simulation;
  derived: Derived;
  preview: Preview | null;
  scenarios: ScenarioResult[];
  warnings: ReturnType<typeof modelWarnings>;
  horizon: HorizonMonths;
  tab: TabId;
  railOpen: boolean;
  isDefault: boolean;
  levers: LeverValues;

  setField: (key: NumericField, value: number) => void;
  update: (patch: Partial<Model>) => void;
  reset: () => void;
  setCurrency: (code: CurrencyCode) => void;
  setHorizon: (horizon: HorizonMonths) => void;
  setTab: (tab: TabId) => void;
  setRailOpen: (open: boolean) => void;
  setLever: (id: string, value: number | null) => void;
  resetLevers: () => void;
  applyPreview: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function consumeSharedHash(): Model | null {
  if (typeof window === 'undefined') return null;
  const shared = readModelFromHash(window.location.hash);
  if (!shared) return null;
  // Consume the hash so edits are not overwritten by a refresh.
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  return shared;
}

function readInitialModel(): Model {
  // A shared link wins, because that is what the visitor came for.
  const shared = consumeSharedHash();
  if (shared) return shared;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return normalizeModel(JSON.parse(stored));
  } catch {
    /* corrupt or unavailable storage falls back to the defaults */
  }

  return { ...DEFAULT_MODEL };
}

function readInitialHorizon(): HorizonMonths {
  return DEFAULT_HORIZON;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [model, setModel] = useState<Model>(readInitialModel);
  const [levers, setLevers] = useState<LeverValues>(EMPTY_LEVERS);
  const [horizon, setHorizon] = useState<HorizonMonths>(readInitialHorizon);
  const [tab, setTab] = useState<TabId>('overview');
  const [railOpen, setRailOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(model));
    } catch {
      /* private mode: the session still works, it just will not be remembered */
    }
  }, [model]);

  // Someone pasting a share link into an already-open tab should load it too.
  useEffect(() => {
    const onHashChange = () => {
      const shared = consumeSharedHash();
      if (shared) {
        setModel(shared);
        setLevers(EMPTY_LEVERS);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const fmt = useMemo(() => createFormatters(model.currency), [model.currency]);

  const simulation = useMemo(() => simulate(model), [model]);
  const derived = useMemo(() => derive(model, simulation), [model, simulation]);

  const active = useMemo(() => activeLevers(model, levers), [model, levers]);

  const preview = useMemo<Preview | null>(() => {
    if (active.length === 0) return null;
    const previewModel = applyLevers(model, levers);
    const previewSimulation = simulate(previewModel);
    return {
      model: previewModel,
      simulation: previewSimulation,
      derived: derive(previewModel, previewSimulation),
      changes: describeChanges(model, previewModel),
    };
  }, [active.length, model, levers]);

  const scenarios = useMemo(() => buildScenarios(model), [model]);
  const warnings = useMemo(() => modelWarnings(model), [model]);

  const update = useCallback((patch: Partial<Model>) => {
    setModel((current) => normalizeModel({ ...current, ...patch }));
  }, []);

  const setField = useCallback((key: NumericField, value: number) => {
    setModel((current) => normalizeModel({ ...current, [key]: value }));
  }, []);

  const reset = useCallback(() => {
    setModel({ ...DEFAULT_MODEL });
    setLevers(EMPTY_LEVERS);
  }, []);

  const setCurrency = useCallback((code: CurrencyCode) => {
    setModel((current) => ({ ...current, currency: code }));
  }, []);

  const setLever = useCallback((id: string, value: number | null) => {
    setLevers((current) => ({ ...current, [id]: value }));
  }, []);

  const resetLevers = useCallback(() => setLevers(EMPTY_LEVERS), []);

  const applyPreview = useCallback(() => {
    setModel((current) => normalizeModel(applyLevers(current, levers)));
    setLevers(EMPTY_LEVERS);
  }, [levers]);

  const value = useMemo<StoreValue>(
    () => ({
      model,
      fmt,
      simulation,
      derived,
      preview,
      scenarios,
      warnings,
      horizon,
      tab,
      railOpen,
      isDefault: isDefaultModel(model),
      levers,
      setField,
      update,
      reset,
      setCurrency,
      setHorizon,
      setTab,
      setRailOpen,
      setLever,
      resetLevers,
      applyPreview,
    }),
    [
      model,
      fmt,
      simulation,
      derived,
      preview,
      scenarios,
      warnings,
      horizon,
      tab,
      railOpen,
      levers,
      setField,
      update,
      reset,
      setCurrency,
      setLever,
      resetLevers,
      applyPreview,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useModel(): StoreValue {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useModel must be used inside StoreProvider');
  return context;
}

/**
 * The value a metric should display right now: the preview when a what-if is
 * running, otherwise the committed model.
 */
export function useLive(): { derived: Derived; simulation: Simulation; model: Model; fmt: Formatters; previewing: boolean } {
  const store = useModel();
  if (store.preview) {
    return {
      derived: store.preview.derived,
      simulation: store.preview.simulation,
      model: store.preview.model,
      fmt: store.fmt,
      previewing: true,
    };
  }
  return {
    derived: store.derived,
    simulation: store.simulation,
    model: store.model,
    fmt: store.fmt,
    previewing: false,
  };
}
