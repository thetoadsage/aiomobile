import { useState } from 'react';
import type { LiveStreams } from '../api/types';
import { retainFilePositions, type FilePositions } from '../lib/streams';

/** Per-instance, per-visit observations shared by Overview, cards and details. */
export function useStreamPositions(scope: string, snapshot: LiveStreams | undefined): FilePositions {
  const [state, setState] = useState(() => ({ scope, snapshot, positions: retainFilePositions(new Map(), snapshot?.streams ?? []) }));
  if (state.scope !== scope || state.snapshot !== snapshot) {
    const previous = state.scope === scope ? state.positions : new Map();
    const next = { scope, snapshot, positions: snapshot && state.scope === scope ? retainFilePositions(previous, snapshot.streams) : previous };
    // Derive from the new snapshot before children render, avoiding a stale frame.
    setState(next);
    return next.positions;
  }
  return state.positions;
}
