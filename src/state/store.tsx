/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { DEFAULT_HORIZON, DEFAULT_MODEL, FIELD_SPECS, STORAGE_KEY } from '../engine/constants';
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
  replaceModel: (model: Model) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  setCurrency: (code: CurrencyCode) => void;
  setHorizon: (horizon: HorizonMonths) => void;
  setTab: (tab: TabId) => void;
  setRailOpen: (open: boolean) => void;
  setLever: (id: string, value: number | null) => void;
  resetLevers: () => void;
  applyPreview: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

/** Shallow equality across every field of the model, for history bookkeeping. */
function sameModel(a: Model, b: Model): boolean {
  return (
    a.currency === b.currency &&
    a.acquisitionMode === b.acquisitionMode &&
    a.cacMode === b.cacMode &&
    FIELD_SPECS.every((spec) => a[spec.key] === b[spec.key])
  );
}

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
  const [model, setModelState] = useState<Model>(readInitialModel);
  const [levers, setLevers] = useState<LeverValues>(EMPTY_LEVERS);
  const [horizon, setHorizon] = useState<HorizonMonths>(readInitialHorizon);
  const [tab, setTab] = useState<TabId>('overview');
  const [railOpen, setRailOpen] = useState(false);

  /**
   * Undo history for the assumptions. Dragging a label fires an update per few
   * pixels, so consecutive changes to the same field inside a short window fold
   * into one entry — otherwise a single scrub would bury the previous state
   * under fifty of them.
   */
  const [history, setHistory] = useState<{ past: Model[]; future: Model[] }>({ past: [], future: [] });
  const lastEdit = useRef<{ key: string; at: number }>({ key: '', at: 0 });

  const commit = useCallback(
    (next: Model, coalesceKey?: string) => {
      // Committing a value that is already set (re-typing the same number, or a
      // scrub that lands back where it started) must not create an undo step the
      // user has to press through.
      if (sameModel(next, model)) return;

      const now = Date.now();
      const coalesce =
        coalesceKey !== undefined && lastEdit.current.key === coalesceKey && now - lastEdit.current.at < 600;
      lastEdit.current = { key: coalesceKey ?? '', at: now };
      if (!coalesce) {
        setHistory((current) => ({ past: [...current.past, model].slice(-50), future: [] }));
      }
      setModelState(next);
    },
    [model],
  );

  const undo = useCallback(() => {
    const previous = history.past[history.past.length - 1];
    if (!previous) return;
    lastEdit.current = { key: '', at: 0 };
    setHistory({ past: history.past.slice(0, -1), future: [...history.future, model] });
    setModelState(previous);
  }, [history, model]);

  const redo = useCallback(() => {
    const next = history.future[history.future.length - 1];
    if (!next) return;
    lastEdit.current = { key: '', at: 0 };
    setHistory({ past: [...history.past, model], future: history.future.slice(0, -1) });
    setModelState(next);
  }, [history, model]);

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
        setModelState(shared);
        setLevers(EMPTY_LEVERS);
        setHistory({ past: [], future: [] });
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

  const update = useCallback(
    (patch: Partial<Model>) => {
      commit(normalizeModel({ ...model, ...patch }));
    },
    [commit, model],
  );

  const setField = useCallback(
    (key: NumericField, value: number) => {
      commit(normalizeModel({ ...model, [key]: value }), key);
    },
    [commit, model],
  );

  const reset = useCallback(() => {
    commit({ ...DEFAULT_MODEL });
    setLevers(EMPTY_LEVERS);
  }, [commit]);

  const setCurrency = useCallback(
    (code: CurrencyCode) => {
      commit({ ...model, currency: code }, 'currency');
    },
    [commit, model],
  );

  const replaceModel = useCallback(
    (next: Model) => {
      commit(normalizeModel(next));
      setLevers(EMPTY_LEVERS);
    },
    [commit],
  );

  const setLever = useCallback((id: string, value: number | null) => {
    setLevers((current) => ({ ...current, [id]: value }));
  }, []);

  const resetLevers = useCallback(() => setLevers(EMPTY_LEVERS), []);

  const applyPreview = useCallback(() => {
    commit(normalizeModel(applyLevers(model, levers)));
    setLevers(EMPTY_LEVERS);
  }, [commit, levers, model]);

  const activeCount = active.length;

  /**
   * Keyboard parity for the two things a pointer gets for free: undo, and
   * backing out of a what-if. Skipped while typing so the browser's own
   * field-level undo keeps working inside inputs.
   */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const editing =
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if (event.key === 'Escape') {
        if (activeCount > 0 && !document.querySelector('dialog[open]')) resetLevers();
        return;
      }
      if (editing) return;
      if (!(event.metaKey || event.ctrlKey)) return;

      const key = event.key.toLowerCase();
      if (key === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      } else if (key === 'y') {
        event.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeCount, redo, resetLevers, undo]);

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
      replaceModel,
      undo,
      redo,
      canUndo: history.past.length > 0,
      canRedo: history.future.length > 0,
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
      replaceModel,
      undo,
      redo,
      history.past.length,
      history.future.length,
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
